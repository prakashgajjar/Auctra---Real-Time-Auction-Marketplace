import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { setAuctionState, publishBidEvent } from '../redis/client.js';
import config from '../config/index.js';

export async function setAutoBid({ userId, auctionId, maxBudget }) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  if (auction.sellerId === userId) {
    throw new AppError('Sellers cannot configure auto-bidding on their own auctions.', 403, 'FORBIDDEN');
  }

  if (!['LIVE', 'EXTENDED', 'SCHEDULED'].includes(auction.status)) {
    throw new AppError(`Cannot set auto-bid for auction with status ${auction.status}.`, 400, 'INVALID_STATUS');
  }

  const currentBid = Number(auction.currentHighestBid || auction.startingPrice);
  const minIncrement = Number(auction.minIncrement);
  const minRequired = auction.bidCount > 0 ? currentBid + minIncrement : currentBid;

  if (Number(maxBudget) < minRequired) {
    throw new AppError(
      `Maximum budget must be at least ₹${minRequired} (current bid + min increment ₹${minIncrement}).`,
      400,
      'BUDGET_TOO_LOW'
    );
  }

  const autoBid = await prisma.autoBid.upsert({
    where: {
      auctionId_userId: { auctionId, userId },
    },
    update: {
      maxBudget,
      isActive: true,
    },
    create: {
      auctionId,
      userId,
      maxBudget,
      isActive: true,
    },
  });

  // If the auction is currently LIVE and user is not currently the leader, trigger auto-bidding
  if (['LIVE', 'EXTENDED'].includes(auction.status) && auction.currentHighestBidderId !== userId) {
    await triggerAutoBiddingCycle(auctionId);
  }

  return autoBid;
}

export async function getAutoBid(userId, auctionId) {
  const autoBid = await prisma.autoBid.findUnique({
    where: {
      auctionId_userId: { auctionId, userId },
    },
  });
  return autoBid;
}

export async function cancelAutoBid(userId, auctionId) {
  const autoBid = await prisma.autoBid.findUnique({
    where: {
      auctionId_userId: { auctionId, userId },
    },
  });

  if (!autoBid || !autoBid.isActive) {
    throw new AppError('No active auto-bid found for this auction.', 404, 'AUTO_BID_NOT_FOUND');
  }

  return prisma.autoBid.update({
    where: {
      auctionId_userId: { auctionId, userId },
    },
    data: {
      isActive: false,
    },
  });
}

/**
 * Evaluates active auto-bids for an auction and places proxy bids until equilibrium
 */
export async function triggerAutoBiddingCycle(auctionId) {
  let safetyLoopCounter = 0;
  const maxIterations = 20;

  while (safetyLoopCounter < maxIterations) {
    safetyLoopCounter++;

    const placed = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction || !['LIVE', 'EXTENDED'].includes(auction.status)) {
        return false;
      }

      const now = new Date();
      if (auction.endTime <= now) {
        return false;
      }

      const currentBid = Number(auction.currentHighestBid || auction.startingPrice);
      const minIncrement = Number(auction.minIncrement);
      const nextMinimumBid = auction.bidCount > 0 ? currentBid + minIncrement : currentBid;

      // Find top active auto-bidders who are NOT the current leader and can afford nextMinimumBid
      const competingAutoBids = await tx.autoBid.findMany({
        where: {
          auctionId,
          isActive: true,
          userId: { not: auction.currentHighestBidderId || '' },
          maxBudget: { gte: nextMinimumBid },
        },
        orderBy: [{ maxBudget: 'desc' }, { createdAt: 'asc' }],
        take: 2,
      });

      if (competingAutoBids.length === 0) {
        return false;
      }

      const topBidder = competingAutoBids[0];
      const secondBidder = competingAutoBids[1];

      let bidAmount = nextMinimumBid;

      // If there is another active auto-bidder competing, raise to outbid them immediately
      if (secondBidder) {
        const secondMax = Number(secondBidder.maxBudget);
        const neededToOutbid = secondMax + minIncrement;
        bidAmount = Math.min(Number(topBidder.maxBudget), Math.max(nextMinimumBid, neededToOutbid));
      }

      // Check Anti-Sniping
      const timeRemainingMs = auction.endTime.getTime() - now.getTime();
      let extendedEndTime = auction.endTime;
      let antiSnipingTriggered = auction.antiSnipingTriggered;

      if (timeRemainingMs <= config.bidding.antiSnipingWindowSeconds * 1000) {
        extendedEndTime = new Date(auction.endTime.getTime() + config.bidding.antiSnipingExtensionSeconds * 1000);
        antiSnipingTriggered = true;
      }

      // Record AUTO bid
      const newBid = await tx.bid.create({
        data: {
          auctionId,
          bidderId: topBidder.userId,
          amount: bidAmount,
          bidType: 'AUTO',
        },
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentHighestBid: bidAmount,
          currentHighestBidderId: topBidder.userId,
          bidCount: { increment: 1 },
          endTime: extendedEndTime,
          antiSnipingTriggered,
        },
      });

      // Deactivate auto-bids whose max budget was exceeded
      await tx.autoBid.updateMany({
        where: {
          auctionId,
          isActive: true,
          maxBudget: { lt: bidAmount + minIncrement },
        },
        data: {
          isActive: false,
        },
      });

      return {
        bid: newBid,
        auction: updatedAuction,
      };
    });

    if (!placed) {
      break;
    }

    // Sync Redis Cache & Pub/Sub
    await setAuctionState(auctionId, {
      currentBid: placed.bid.amount,
      highestBidderId: placed.bid.bidderId,
      bidCount: placed.auction.bidCount,
      status: placed.auction.status,
    });

    await publishBidEvent(auctionId, {
      bidId: placed.bid.id,
      bidderId: placed.bid.bidderId,
      amount: Number(placed.bid.amount),
      bidType: 'AUTO',
      bidCount: placed.auction.bidCount,
      endTime: placed.auction.endTime.toISOString(),
      antiSnipingTriggered: placed.auction.antiSnipingTriggered,
    });
  }
}
