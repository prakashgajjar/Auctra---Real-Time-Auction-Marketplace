import prisma from '../prisma/client.js';
import { acquireLock, releaseLock, setAuctionState } from '../redis/client.js';

let intervalHandle = null;

export async function processAuctionLifecycle() {
  const now = new Date();

  try {
    // 1. Scheduled -> Live
    const scheduledAuctions = await prisma.auction.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: { lte: now },
      },
      select: { id: true, currentHighestBid: true, startingPrice: true, currentHighestBidderId: true },
    });

    if (scheduledAuctions.length > 0) {
      await prisma.auction.updateMany({
        where: {
          id: { in: scheduledAuctions.map((a) => a.id) },
        },
        data: {
          status: 'LIVE',
        },
      });

      for (const a of scheduledAuctions) {
        await setAuctionState(a.id, {
          currentBid: a.currentHighestBid || a.startingPrice,
          highestBidderId: a.currentHighestBidderId || null,
          status: 'LIVE',
        });
      }

      console.log(`[Lifecycle Worker] Activated ${scheduledAuctions.length} scheduled auction(s) to LIVE status.`);
    }

    // 2. Expired Live -> Ended (Sold / Unsold)
    const expiredAuctions = await prisma.auction.findMany({
      where: {
        status: { in: ['LIVE', 'EXTENDED'] },
        endTime: { lte: now },
      },
      include: { product: true },
    });

    for (const auction of expiredAuctions) {
      // Acquire distributed lock to prevent multiple worker replicas from racing
      const lockKey = `lock:auction:${auction.id}`;
      const lockToken = await acquireLock(lockKey, 10000);

      if (!lockToken) {
        // Another worker instance is currently finalizing this auction
        continue;
      }

      try {
        const hasBids = auction.bidCount > 0 && auction.currentHighestBid;
        const reserveMet = !auction.reservePrice || Number(auction.currentHighestBid) >= Number(auction.reservePrice);
        const isSold = Boolean(hasBids && reserveMet);

        await prisma.$transaction(async (tx) => {
          // Verify status inside transaction in case it was modified just before acquiring lock
          const freshAuction = await tx.auction.findUnique({
            where: { id: auction.id },
          });

          if (!['LIVE', 'EXTENDED'].includes(freshAuction?.status)) {
            return;
          }

          await tx.auction.update({
            where: { id: auction.id },
            data: {
              status: isSold ? 'SOLD' : 'UNSOLD',
              winningBid: isSold ? auction.currentHighestBid : null,
              winnerId: isSold ? auction.currentHighestBidderId : null,
              endedAt: now,
            },
          });

          await tx.product.update({
            where: { id: auction.productId },
            data: {
              status: isSold ? 'SOLD' : 'AVAILABLE',
            },
          });
        });

        await setAuctionState(auction.id, {
          currentBid: isSold ? auction.currentHighestBid : null,
          highestBidderId: isSold ? auction.currentHighestBidderId : null,
          status: isSold ? 'SOLD' : 'UNSOLD',
        });

        console.log(
          `[Lifecycle Worker] Auction ${auction.id} concluded -> Result: ${isSold ? 'SOLD' : 'UNSOLD'} (Bids: ${auction.bidCount}, Winning: ₹${auction.currentHighestBid || 0})`
        );
      } finally {
        await releaseLock(lockKey, lockToken);
      }
    }
  } catch (err) {
    console.error('[Lifecycle Worker Error]:', err.message);
  }
}


export function startAuctionLifecycleWorker(intervalSeconds = 30) {
  if (intervalHandle) return;
  console.log(`✓ Auction Lifecycle Worker started (Checking every ${intervalSeconds}s)`);
  // Run once immediately on startup
  processAuctionLifecycle();
  intervalHandle = setInterval(processAuctionLifecycle, intervalSeconds * 1000);
}

export function stopAuctionLifecycleWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('✓ Auction Lifecycle Worker stopped.');
  }
}
