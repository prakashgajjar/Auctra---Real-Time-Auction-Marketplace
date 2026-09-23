import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { setAuctionState, deleteAuctionState } from '../redis/client.js';

export async function createAuction(sellerId, data) {
  const { productId, startingPrice, reservePrice, minIncrement, buyNowPrice, startTime, endTime } = data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { auction: true },
  });

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.sellerId !== sellerId) {
    throw new AppError('You do not own this product.', 403, 'FORBIDDEN');
  }

  if (product.auction) {
    throw new AppError('An auction is already configured for this product.', 409, 'AUCTION_EXISTS');
  }

  const createdAuction = await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.create({
      data: {
        productId,
        sellerId,
        startingPrice,
        reservePrice,
        minIncrement,
        buyNowPrice,
        currentHighestBid: startingPrice,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'DRAFT',
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { status: 'IN_AUCTION' },
    });

    return auction;
  });

  await setAuctionState(createdAuction.id, {
    currentBid: startingPrice,
    highestBidderId: null,
    status: 'DRAFT',
  });

  return createdAuction;
}

export async function publishAuction(sellerId, auctionId) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  if (auction.sellerId !== sellerId) {
    throw new AppError('You do not have permission to publish this auction.', 403, 'FORBIDDEN');
  }

  if (auction.status !== 'DRAFT') {
    throw new AppError(`Cannot publish auction with status ${auction.status}.`, 400, 'INVALID_STATUS');
  }

  const now = new Date();
  const newStatus = auction.startTime <= now ? 'LIVE' : 'SCHEDULED';

  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: { status: newStatus },
  });

  await setAuctionState(auctionId, {
    currentBid: updatedAuction.currentHighestBid || updatedAuction.startingPrice,
    highestBidderId: updatedAuction.currentHighestBidderId || null,
    status: newStatus,
  });

  return updatedAuction;
}

export async function updateAuction(sellerId, auctionId, updateData) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  if (auction.sellerId !== sellerId) {
    throw new AppError('You do not have permission to edit this auction.', 403, 'FORBIDDEN');
  }

  if (auction.status !== 'DRAFT') {
    throw new AppError(`Cannot modify an auction that is already ${auction.status.toLowerCase()}.`, 400, 'AUCTION_LOCKED');
  }

  const dataToUpdate = { ...updateData };
  if (dataToUpdate.startTime) dataToUpdate.startTime = new Date(dataToUpdate.startTime);
  if (dataToUpdate.endTime) dataToUpdate.endTime = new Date(dataToUpdate.endTime);

  // If starting price changed and no bids placed, update currentHighestBid as well
  if (dataToUpdate.startingPrice && auction.bidCount === 0) {
    dataToUpdate.currentHighestBid = dataToUpdate.startingPrice;
  }

  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: dataToUpdate,
  });

  await setAuctionState(auctionId, {
    currentBid: updatedAuction.currentHighestBid || updatedAuction.startingPrice,
    highestBidderId: null,
    status: updatedAuction.status,
  });

  return updatedAuction;
}

export async function deleteAuction(sellerId, auctionId) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  if (auction.sellerId !== sellerId) {
    throw new AppError('You do not have permission to delete this auction.', 403, 'FORBIDDEN');
  }

  if (auction.status !== 'DRAFT') {
    throw new AppError(`Cannot delete an auction that is already ${auction.status.toLowerCase()}.`, 400, 'AUCTION_LOCKED');
  }

  await prisma.$transaction(async (tx) => {
    await tx.auction.delete({
      where: { id: auctionId },
    });

    await tx.product.update({
      where: { id: auction.productId },
      data: { status: 'AVAILABLE' },
    });
  });

  await deleteAuctionState(auctionId);

  return { message: 'Draft auction deleted successfully. Product restored to available inventory.' };
}

export async function cancelAuction(sellerId, auctionId) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  if (auction.sellerId !== sellerId) {
    throw new AppError('You do not have permission to cancel this auction.', 403, 'FORBIDDEN');
  }

  if (auction.bidCount > 0) {
    throw new AppError('Cannot cancel an auction after bids have already been placed.', 400, 'BIDS_EXIST');
  }

  if (['ENDED', 'SOLD', 'CANCELLED'].includes(auction.status)) {
    throw new AppError(`Auction is already ${auction.status.toLowerCase()}.`, 400, 'INVALID_STATUS');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.auction.update({
      where: { id: auctionId },
      data: { status: 'CANCELLED' },
    });

    await tx.product.update({
      where: { id: auction.productId },
      data: { status: 'AVAILABLE' },
    });

    return res;
  });

  await setAuctionState(auctionId, { status: 'CANCELLED' });

  return updated;
}


export async function getAuctionDetails(auctionId, userId = null) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          sellerProfile: {
            select: {
              storeName: true,
              storeDescription: true,
              ratingAverage: true,
              ratingCount: true,
              verificationStatus: true,
            },
          },
        },
      },
    },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  let isWatchlisted = false;
  if (userId) {
    const watch = await prisma.watchlist.findUnique({
      where: {
        userId_auctionId: { userId, auctionId },
      },
    });
    isWatchlisted = !!watch;
  }

  return {
    ...auction,
    isWatchlisted,
  };
}

export async function listPublicAuctions(query, userId = null) {
  const {
    category,
    status = 'LIVE',
    search,
    minPrice,
    maxPrice,
    sort = 'ending_soon',
    page = 1,
    limit = 20,
  } = query;

  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.product = {
      category: {
        OR: [
          { slug: { equals: category, mode: 'insensitive' } },
          { name: { equals: category, mode: 'insensitive' } },
        ],
      },
    };
  }

  if (search) {
    where.product = {
      ...(where.product || {}),
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  if (minPrice || maxPrice) {
    where.currentHighestBid = {};
    if (minPrice) where.currentHighestBid.gte = minPrice;
    if (maxPrice) where.currentHighestBid.lte = maxPrice;
  }

  let orderBy = { endTime: 'asc' };
  if (sort === 'price_asc') orderBy = { currentHighestBid: 'asc' };
  if (sort === 'price_desc') orderBy = { currentHighestBid: 'desc' };
  if (sort === 'newest') orderBy = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { bidCount: 'desc' };

  const [total, auctions] = await Promise.all([
    prisma.auction.count({ where }),
    prisma.auction.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        product: {
          include: {
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        seller: {
          select: {
            username: true,
            sellerProfile: {
              select: {
                storeName: true,
                ratingAverage: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let watchlistedIds = new Set();
  if (userId) {
    const userWatchlist = await prisma.watchlist.findMany({
      where: {
        userId,
        auctionId: { in: auctions.map((a) => a.id) },
      },
      select: { auctionId: true },
    });
    watchlistedIds = new Set(userWatchlist.map((w) => w.auctionId));
  }

  const enrichedAuctions = auctions.map((a) => ({
    ...a,
    isWatchlisted: watchlistedIds.has(a.id),
  }));

  return {
    auctions: enrichedAuctions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function listSellerAuctions(sellerId) {
  return prisma.auction.findMany({
    where: { sellerId },
    include: {
      product: {
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function buyNow(buyerId, auctionId) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { product: true },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  if (auction.sellerId === buyerId) {
    throw new AppError('Sellers cannot purchase their own auction lots.', 400, 'SELF_PURCHASE_FORBIDDEN');
  }

  if (!auction.buyNowPrice) {
    throw new AppError('This auction does not have an instant Buy Now option enabled.', 400, 'BUY_NOW_UNAVAILABLE');
  }

  if (!['SCHEDULED', 'LIVE', 'EXTENDED'].includes(auction.status)) {
    throw new AppError(`Auction is not available for Buy Now purchase (Status: ${auction.status}).`, 400, 'INVALID_STATUS');
  }

  const now = new Date();

  const completedAuction = await prisma.$transaction(async (tx) => {
    // Check inside transaction to guard against concurrent buy-now or bid finalize
    const freshAuction = await tx.auction.findUnique({
      where: { id: auctionId },
    });

    if (!['SCHEDULED', 'LIVE', 'EXTENDED'].includes(freshAuction.status)) {
      throw new AppError(`Auction has already concluded or closed (Status: ${freshAuction.status}).`, 400, 'AUCTION_CLOSED');
    }

    const updatedAuction = await tx.auction.update({
      where: { id: auctionId },
      data: {
        status: 'SOLD',
        winningBid: freshAuction.buyNowPrice,
        winnerId: buyerId,
        currentHighestBid: freshAuction.buyNowPrice,
        currentHighestBidderId: buyerId,
        bidCount: { increment: 1 },
        endedAt: now,
      },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
        seller: {
          select: {
            username: true,
            sellerProfile: { select: { storeName: true, ratingAverage: true } },
          },
        },
      },
    });

    await tx.product.update({
      where: { id: auction.productId },
      data: { status: 'SOLD' },
    });

    return updatedAuction;
  });

  await setAuctionState(auctionId, {
    currentBid: completedAuction.winningBid,
    highestBidderId: buyerId,
    status: 'SOLD',
  });

  return completedAuction;
}

export async function listBuyerWonAuctions(buyerId) {
  return prisma.auction.findMany({
    where: {
      winnerId: buyerId,
      status: 'SOLD',
    },
    include: {
      product: {
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
      seller: {
        select: {
          username: true,
          sellerProfile: {
            select: {
              storeName: true,
              ratingAverage: true,
              verificationStatus: true,
            },
          },
        },
      },
    },
    orderBy: { endedAt: 'desc' },
  });
}

