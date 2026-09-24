import prisma from '../prisma/client.js';
import { dispatchNotification } from '../services/notification.service.js';

/**
 * Handle BID_PLACED event (from Bid-Service via Redis 'auction:events')
 */
export async function handleBidPlaced(payload) {
  const {
    auctionId,
    bidderId,
    bidderUsername,
    amount,
    previousHighestBidderId,
    endTime,
  } = payload;

  if (!auctionId) return;

  // Retrieve auction details with product title and seller
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: { select: { title: true } },
      seller: { select: { id: true, username: true } },
    },
  });

  const auctionTitle = auction?.product?.title || 'Auction Lot';
  const formattedBid = `₹${Number(amount).toLocaleString('en-IN')}`;

  // 1. OUTBID ALERT: Sent to previous highest bidder if different from new bidder
  if (previousHighestBidderId && previousHighestBidderId !== bidderId) {
    await dispatchNotification({
      userId: previousHighestBidderId,
      type: 'AUCTION_OUTBID',
      title: `Outbid on "${auctionTitle}"`,
      message: `You were outbid by ${bidderUsername || 'another bidder'}. The current highest bid is ${formattedBid}. Place a new bid before time runs out!`,
      data: {
        auctionId,
        auctionTitle,
        newBidAmount: amount,
        bidderUsername,
        endTime: endTime || auction?.endTime,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }

  // 2. SELLER ALERT: Notify seller of the new bid
  if (auction?.sellerId && auction.sellerId !== bidderId) {
    await dispatchNotification({
      userId: auction.sellerId,
      type: 'AUCTION_BID_PLACED',
      title: `New Bid on "${auctionTitle}"`,
      message: `${bidderUsername || 'A bidder'} placed a bid of ${formattedBid} on your auction.`,
      data: {
        auctionId,
        auctionTitle,
        amount,
        bidderId,
        bidderUsername,
      },
      channels: ['IN_APP', 'WEBSOCKET'],
    });
  }
}

/**
 * Handle AUCTION_STARTED / AUCTION_LIVE event
 */
export async function handleAuctionStarted(payload) {
  const { auctionId } = payload;
  if (!auctionId) return;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: { select: { title: true } },
      watchlists: { select: { userId: true } },
    },
  });

  if (!auction) return;

  const auctionTitle = auction.product?.title || 'Auction Lot';
  const startingPrice = Number(auction.startingPrice);

  // Notify all users with this auction in their watchlist
  const targetUserIds = [
    ...new Set([auction.sellerId, ...auction.watchlists.map((w) => w.userId)]),
  ];

  for (const userId of targetUserIds) {
    const isSeller = userId === auction.sellerId;
    await dispatchNotification({
      userId,
      type: 'AUCTION_STARTED',
      title: isSeller ? `Your Auction is Live: "${auctionTitle}"` : `Auction Started: "${auctionTitle}"`,
      message: isSeller
        ? `Your auction "${auctionTitle}" is now live and accepting bids.`
        : `An auction you are watching "${auctionTitle}" has officially started! Starting bid: ₹${startingPrice.toLocaleString('en-IN')}.`,
      data: {
        auctionId,
        auctionTitle,
        startingPrice,
        endTime: auction.endTime,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }
}

/**
 * Handle AUCTION_ENDING_SOON event
 */
export async function handleAuctionEndingSoon(payload) {
  const { auctionId, minutesRemaining = 15 } = payload;
  if (!auctionId) return;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: { select: { title: true } },
      watchlists: { select: { userId: true } },
    },
  });

  if (!auction) return;

  const auctionTitle = auction.product?.title || 'Auction Lot';
  const currentBid = Number(auction.currentHighestBid || auction.startingPrice);

  // Notify watchlisters and highest bidder
  const recipientIds = new Set(auction.watchlists.map((w) => w.userId));
  if (auction.currentHighestBidderId) {
    recipientIds.add(auction.currentHighestBidderId);
  }

  for (const userId of recipientIds) {
    await dispatchNotification({
      userId,
      type: 'AUCTION_ENDING_SOON',
      title: `⏳ Ending Soon: "${auctionTitle}"`,
      message: `Only ${minutesRemaining} minutes remaining for "${auctionTitle}". Current bid is ₹${currentBid.toLocaleString('en-IN')}.`,
      data: {
        auctionId,
        auctionTitle,
        currentBidAmount: currentBid,
        minutesRemaining,
        endTime: auction.endTime,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }
}

/**
 * Handle AUCTION_WON / AUCTION_ENDED event
 */
export async function handleAuctionWon(payload) {
  const { auctionId, winnerId, winningBid, sellerId } = payload;
  if (!auctionId) return;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: { select: { title: true } },
      winner: { select: { id: true, username: true } },
      seller: { select: { id: true, username: true } },
    },
  });

  const effectiveWinnerId = winnerId || auction?.winnerId;
  const effectiveSellerId = sellerId || auction?.sellerId;
  const auctionTitle = auction?.product?.title || 'Auction Lot';
  const effectiveAmount = winningBid || auction?.winningBid || auction?.currentHighestBid || 0;
  const formattedBid = `₹${Number(effectiveAmount).toLocaleString('en-IN')}`;

  // 1. Notify Winner
  if (effectiveWinnerId) {
    await dispatchNotification({
      userId: effectiveWinnerId,
      type: 'AUCTION_WON',
      title: `🎉 Congratulations! You Won "${auctionTitle}"`,
      message: `You placed the winning bid of ${formattedBid} for "${auctionTitle}". Please proceed to payment within 24 hours to secure your item.`,
      data: {
        auctionId,
        auctionTitle,
        winningBidAmount: effectiveAmount,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }

  // 2. Notify Seller
  if (effectiveSellerId) {
    await dispatchNotification({
      userId: effectiveSellerId,
      type: 'AUCTION_ENDED_PARTICIPANT',
      title: effectiveWinnerId ? `Your Auction Ended: "${auctionTitle}" Sold!` : `Your Auction Ended: Unsold`,
      message: effectiveWinnerId
        ? `Your lot "${auctionTitle}" was won by ${auction?.winner?.username || 'the winning bidder'} for ${formattedBid}. Awaiting buyer payment.`
        : `Your auction for "${auctionTitle}" ended without meeting reserve or bids.`,
      data: {
        auctionId,
        auctionTitle,
        winningBidAmount: effectiveAmount,
        status: effectiveWinnerId ? 'SOLD' : 'UNSOLD',
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }
}

/**
 * Handle PAYMENT_SUCCESSFUL event
 */
export async function handlePaymentSuccessful(payload) {
  const { orderId, userId, sellerId, auctionTitle, amount, transactionId } = payload;

  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  // 1. Notify Buyer
  if (userId) {
    await dispatchNotification({
      userId,
      type: 'PAYMENT_SUCCESSFUL',
      title: `Payment Confirmed: Order #${orderId || ''}`,
      message: `We received your payment of ${formattedAmount} for "${auctionTitle || 'your item'}". The seller has been notified to ship your package.`,
      data: {
        orderId,
        auctionTitle,
        amount,
        transactionId,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }

  // 2. Notify Seller
  if (sellerId) {
    await dispatchNotification({
      userId: sellerId,
      type: 'PAYMENT_SUCCESSFUL',
      title: `Payment Received for "${auctionTitle || 'Auction Order'}"`,
      message: `Buyer has successfully paid ${formattedAmount} for order #${orderId || ''}. Please prepare and dispatch the shipment.`,
      data: {
        orderId,
        auctionTitle,
        amount,
        transactionId,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }
}

/**
 * Handle ORDER_SHIPPED event
 */
export async function handleOrderShipped(payload) {
  const { orderId, buyerId, auctionTitle, trackingNumber, carrier } = payload;

  if (buyerId) {
    await dispatchNotification({
      userId: buyerId,
      type: 'ORDER_SHIPPED',
      title: `📦 Order Shipped: "${auctionTitle || 'Package'}"`,
      message: `Your order #${orderId || ''} has been dispatched via ${carrier || 'courier'}. Tracking number: ${trackingNumber || 'Available in order details'}.`,
      data: {
        orderId,
        auctionTitle,
        trackingNumber,
        carrier,
      },
      channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    });
  }
}

/**
 * Handle direct notification payload sent to notification:events
 */
export async function handleDirectNotification(payload) {
  const { userId, type = 'SYSTEM', title, message, data, channels } = payload;
  if (!userId) return;

  await dispatchNotification({
    userId,
    type,
    title,
    message,
    data,
    channels: channels || ['IN_APP', 'EMAIL', 'WEBSOCKET'],
  });
}
