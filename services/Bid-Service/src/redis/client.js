import Redis from 'ioredis';
import config from '../config/index.js';

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✓ Redis connected for Bid Service Engine');
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
 * Safely release distributed lock using Lua script
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

/**
 * Real-time Auction State Cache Sync
 */
export async function setAuctionState(auctionId, { currentBid, highestBidderId, bidCount, status }) {
  try {
    const pipeline = redis.pipeline();
    if (currentBid !== undefined && currentBid !== null) {
      pipeline.set(`auction:${auctionId}:currentBid`, String(currentBid));
    }
    if (highestBidderId !== undefined && highestBidderId !== null) {
      pipeline.set(`auction:${auctionId}:highestBidder`, String(highestBidderId));
    }
    if (bidCount !== undefined && bidCount !== null) {
      pipeline.set(`auction:${auctionId}:bidCount`, String(bidCount));
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
    const [currentBid, highestBidder, bidCount, status] = await Promise.all([
      redis.get(`auction:${auctionId}:currentBid`),
      redis.get(`auction:${auctionId}:highestBidder`),
      redis.get(`auction:${auctionId}:bidCount`),
      redis.get(`auction:${auctionId}:status`),
    ]);
    return {
      currentBid: currentBid ? Number(currentBid) : null,
      highestBidder,
      bidCount: bidCount ? parseInt(bidCount, 10) : 0,
      status,
    };
  } catch (err) {
    console.warn(`[Redis State Fetch Warning] Failed to fetch auction ${auctionId}:`, err.message);
    return null;
  }
}

/**
 * Idempotency Check & Storage (Task 10 & 20)
 */
export async function checkIdempotency(key) {
  try {
    const cached = await redis.get(`idempotency:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function storeIdempotency(key, data, ttlSeconds = 86400) {
  try {
    await redis.set(`idempotency:${key}`, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[Redis Idempotency Warning] Failed to store ${key}:`, err.message);
  }
}

/**
 * Publish Real-time Bid Event via Redis Pub/Sub (Task 11)
 */
export async function publishBidEvent(auctionId, eventData) {
  try {
    const payload = JSON.stringify(eventData);
    await Promise.all([
      redis.publish(`auction:${auctionId}:bids`, payload),
      redis.publish('auction:events', JSON.stringify({ type: 'BID_PLACED', auctionId, ...eventData })),
    ]);
  } catch (err) {
    console.warn(`[Redis Pub/Sub Warning] Failed to publish bid for ${auctionId}:`, err.message);
  }
}

/**
 * Sliding Window Rate Limiter (Task 13)
 * Limits user to `maxRequests` per `windowSeconds`
 */
export async function checkRateLimit(key, maxRequests = 20, windowSeconds = 60) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const rateLimitKey = `rate_limit:${key}`;

  try {
    const pipeline = redis.pipeline();
    // Remove timestamps older than windowStart
    pipeline.zremrangebyscore(rateLimitKey, 0, windowStart);
    // Add current timestamp
    pipeline.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
    // Count items in window
    pipeline.zcard(rateLimitKey);
    // Set expire
    pipeline.expire(rateLimitKey, windowSeconds * 2);

    const results = await pipeline.exec();
    const count = results[2][1];

    return {
      allowed: count <= maxRequests,
      current: count,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - count),
    };
  } catch (err) {
    console.warn(`[Rate Limiter Warning] Redis check failed:`, err.message);
    return { allowed: true, current: 1, limit: maxRequests, remaining: maxRequests - 1 };
  }
}

export default redis;
