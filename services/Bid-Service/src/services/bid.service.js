import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import {
  acquireLock,
  releaseLock,
  setAuctionState,
  checkIdempotency,
  storeIdempotency,
  publishBidEvent,
} from '../redis/client.js';
import { triggerAutoBiddingCycle } from './auto-bid.service.js';
import config from '../config/index.js';

export async function placeBid({ userId, auctionId, amount, idempotencyKey = null, ipAddress = null }) {
  // 1. Idempotency Check (Task 10 & 20)
  if (idempotencyKey) {
    const cachedResponse = await checkIdempotency(idempotencyKey);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        isIdempotentReplay: true,
      };
    }
  }

  // 2. Acquire Redis Distributed Lock (Task 10 & 12)
  const lockKey = `lock:auction:${auctionId}`;
  const lockToken = await acquireLock(lockKey, 5000);

  if (!lockToken) {
    throw new AppError(
      'A competing bid is currently being processed for this lot. Please retry in a moment.',
      409,
      'CONCURRENT_BID_IN_PROGRESS'
    );
  }

  let placedBidResult = null;

  try {
    // 3. PostgreSQL Transaction with Row-Level Locking (SELECT FOR UPDATE)
    placedBidResult = await prisma.$transaction(async (tx) => {
      // Row-level lock on the auction record
      const rows = await tx.$queryRaw`
        SELECT id, seller_id, starting_price, min_increment, current_highest_bid,
               current_highest_bidder_id, bid_count, start_time, end_time, status, anti_sniping_triggered
        FROM auctions
        WHERE id = ${auctionId}::uuid
        FOR UPDATE
      `;

      if (!rows || rows.length === 0) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
      }

      const auction = rows[0];

      // Verification checks
      if (auction.seller_id === userId) {
        throw new AppError('Sellers cannot place bids on their own items.', 403, 'SELF_BID_FORBIDDEN');
      }

      if (!['LIVE', 'EXTENDED'].includes(auction.status)) {
        throw new AppError(
          `Bids cannot be accepted on auction with status ${auction.status}.`,
          400,
          'AUCTION_NOT_LIVE'
        );
      }

      const now = new Date();
      const endTimeDate = new Date(auction.end_time);

      if (endTimeDate <= now) {
        throw new AppError('This auction has already ended.', 400, 'AUCTION_ENDED');
      }

      if (auction.current_highest_bidder_id === userId) {
        throw new AppError('You are already the highest bidder for this auction.', 400, 'ALREADY_HIGHEST_BIDDER');
      }

      const currentBid = Number(auction.current_highest_bid || auction.starting_price);
      const minIncrement = Number(auction.min_increment);
      const bidCount = parseInt(auction.bid_count, 10);
      const minRequired = bidCount > 0 ? currentBid + minIncrement : currentBid;

      if (Number(amount) < minRequired) {
        throw new AppError(
          `Bid amount must be at least ₹${minRequired} (current bid ₹${currentBid} + increment ₹${minIncrement}).`,
          400,
          'BID_AMOUNT_TOO_LOW'
        );
      }

      // 4. Anti-Sniping Protection (Task 15)
      const timeRemainingMs = endTimeDate.getTime() - now.getTime();
      let extendedEndTime = endTimeDate;
      let antiSnipingTriggered = auction.anti_sniping_triggered;
      let newStatus = auction.status;

      if (timeRemainingMs <= config.bidding.antiSnipingWindowSeconds * 1000) {
        extendedEndTime = new Date(endTimeDate.getTime() + config.bidding.antiSnipingExtensionSeconds * 1000);
        antiSnipingTriggered = true;
        newStatus = 'EXTENDED';
      }

      // 5. Create Bid Record
      const bid = await tx.bid.create({
        data: {
          auctionId,
          bidderId: userId,
          amount,
          bidType: 'MANUAL',
          idempotencyKey,
          ipAddress,
        },
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              firstName: true,
            },
          },
        },
      });

      // 6. Update Auction Record
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentHighestBid: amount,
          currentHighestBidderId: userId,
          bidCount: { increment: 1 },
          endTime: extendedEndTime,
          status: newStatus,
          antiSnipingTriggered,
        },
      });

      const previousHighestBidderId = auction.current_highest_bidder_id;
      const previousHighestBid = auction.current_highest_bid;

      return {
        bid,
        auction: updatedAuction,
        previousHighestBidderId,
        previousHighestBid,
      };
    });
  } finally {
    // Release distributed lock
    await releaseLock(lockKey, lockToken);
  }

  // 7. Update Redis Real-Time Cache
  await setAuctionState(auctionId, {
    currentBid: placedBidResult.bid.amount,
    highestBidderId: userId,
    bidCount: placedBidResult.auction.bidCount,
    status: placedBidResult.auction.status,
  });

  // 8. Publish Real-Time Event
  const bidPayload = {
    bidId: placedBidResult.bid.id,
    auctionId,
    bidderId: userId,
    bidderUsername: placedBidResult.bid.bidder.username,
    amount: Number(placedBidResult.bid.amount),
    previousHighestBidderId: placedBidResult.previousHighestBidderId,
    previousHighestBid: placedBidResult.previousHighestBid ? Number(placedBidResult.previousHighestBid) : null,
    bidType: 'MANUAL',
    bidCount: placedBidResult.auction.bidCount,
    endTime: placedBidResult.auction.endTime.toISOString(),
    antiSnipingTriggered: placedBidResult.auction.antiSnipingTriggered,
    createdAt: placedBidResult.bid.createdAt.toISOString(),
  };

  await publishBidEvent(auctionId, bidPayload);

  // 9. Trigger Auto-Bidding Engine to resolve any competing auto-bidders
  try {
    await triggerAutoBiddingCycle(auctionId);
  } catch (err) {
    console.warn(`[Auto-Bid Warning] Cycle execution notice for ${auctionId}:`, err.message);
  }

  // 10. Cache Idempotency Key Response if provided
  if (idempotencyKey) {
    await storeIdempotency(idempotencyKey, { bid: placedBidResult.bid }, 86400);
  }

  return {
    bid: placedBidResult.bid,
    auction: {
      id: placedBidResult.auction.id,
      currentHighestBid: placedBidResult.auction.currentHighestBid,
      bidCount: placedBidResult.auction.bidCount,
      endTime: placedBidResult.auction.endTime,
      status: placedBidResult.auction.status,
      antiSnipingTriggered: placedBidResult.auction.antiSnipingTriggered,
    },
  };
}

export async function getAuctionBidHistory(auctionId, query = {}) {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const [total, bids] = await Promise.all([
    prisma.bid.count({ where: { auctionId } }),
    prisma.bid.findMany({
      where: { auctionId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        bidder: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    }),
  ]);

  // Mask bidder usernames for privacy (e.g., "pr****96")
  const sanitizedBids = bids.map((b) => {
    const rawUsername = b.bidder.username;
    const masked =
      rawUsername.length > 3
        ? `${rawUsername.slice(0, 2)}****${rawUsername.slice(-2)}`
        : `${rawUsername.slice(0, 1)}***`;

    return {
      id: b.id,
      auctionId: b.auctionId,
      amount: b.amount,
      bidType: b.bidType,
      bidder: {
        id: b.bidder.id,
        maskedUsername: masked,
      },
      createdAt: b.createdAt,
    };
  });

  return {
    bids: sanitizedBids,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserBids(userId, query = {}) {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const [total, bids] = await Promise.all([
    prisma.bid.count({ where: { bidderId: userId } }),
    prisma.bid.findMany({
      where: { bidderId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    bids,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
