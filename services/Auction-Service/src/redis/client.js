import Redis from 'ioredis';
import config from '../config/index.js';

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✓ Redis connected for Auction Engine');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message);
});

export async function isRedisHealthy() {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export async function isTokenBlacklisted(jti) {
  try {
    const result = await redis.exists(`blacklist:${jti}`);
    return result === 1;
  } catch {
    return false;
  }
}

/**
 * Sync auction real-time state into Redis.
 * Complies with Auctra architecture keys:
 * auction:{auctionId}:currentBid
 * auction:{auctionId}:highestBidder
 * auction:{auctionId}:status
 */
export async function setAuctionState(auctionId, { currentBid, highestBidderId, status }) {
  try {
    const pipeline = redis.pipeline();
    if (currentBid !== undefined && currentBid !== null) {
      pipeline.set(`auction:${auctionId}:currentBid`, String(currentBid));
    }
    if (highestBidderId !== undefined && highestBidderId !== null) {
      pipeline.set(`auction:${auctionId}:highestBidder`, String(highestBidderId));
    }
    if (status) {
      pipeline.set(`auction:${auctionId}:status`, String(status));
    }
    await pipeline.exec();
  } catch (err) {
    console.warn(`[Redis State Sync Warning] Failed to sync auction ${auctionId}:`, err.message);
  }
}

export async function getAuctionState(auctionId) {
  try {
    const [currentBid, highestBidder, status] = await Promise.all([
      redis.get(`auction:${auctionId}:currentBid`),
      redis.get(`auction:${auctionId}:highestBidder`),
      redis.get(`auction:${auctionId}:status`),
    ]);
    return {
      currentBid: currentBid ? Number(currentBid) : null,
      highestBidder,
      status,
    };
  } catch (err) {
    console.warn(`[Redis State Fetch Warning] Failed to fetch auction ${auctionId}:`, err.message);
    return null;
  }
}

export async function deleteAuctionState(auctionId) {
  try {
    await redis.del(
      `auction:${auctionId}:currentBid`,
      `auction:${auctionId}:highestBidder`,
      `auction:${auctionId}:status`
    );
  } catch (err) {
    console.warn(`[Redis State Del Warning] Failed to delete auction ${auctionId}:`, err.message);
  }
}

/**
 * Acquire distributed lock using Redis SET NX PX
 */
export async function acquireLock(key, ttlMs = 5000, value = null) {
  try {
    const lockValue = value || `${Date.now()}-${Math.random()}`;
    const result = await redis.set(key, lockValue, 'PX', ttlMs, 'NX');
    if (result === 'OK') {
      return lockValue;
    }
    return null;
  } catch (err) {
    console.warn(`[Redis Lock Warning] Failed to acquire lock ${key}:`, err.message);
    return null;
  }
}

/**
 * Safely release distributed lock using Lua script to verify lock owner
 */
export async function releaseLock(key, lockValue) {
  if (!lockValue) return false;
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  try {
    const result = await redis.eval(luaScript, 1, key, lockValue);
    return result === 1;
  } catch (err) {
    console.warn(`[Redis Lock Warning] Failed to release lock ${key}:`, err.message);
    return false;
  }
}

export default redis;

