import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export async function getUserWatchlist(userId) {
  const watchItems = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      auction: {
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
              sellerProfile: { select: { storeName: true, ratingAverage: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return watchItems.map((w) => ({
    ...w.auction,
    isWatchlisted: true,
    addedAt: w.createdAt,
  }));
}

export async function addToWatchlist(userId, auctionId) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_auctionId: { userId, auctionId },
    },
  });

  if (existing) {
    return { message: 'Auction is already in your watchlist.' };
  }

  await prisma.watchlist.create({
    data: {
      userId,
      auctionId,
    },
  });

  return { message: 'Auction added to watchlist.' };
}

export async function removeFromWatchlist(userId, auctionId) {
  await prisma.watchlist.deleteMany({
    where: { userId, auctionId },
  });

  return { message: 'Auction removed from watchlist.' };
}
