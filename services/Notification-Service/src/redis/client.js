import Redis from 'ioredis';
import config from '../config/index.js';

// Primary Redis client for commands & publishing
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Dedicated Redis subscriber client for Pub/Sub listening
export const subscriberRedis = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✓ Redis connected for Notification Service');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message);
});

subscriberRedis.on('connect', () => {
  console.log('✓ Redis Subscriber connected for Notification Engine');
});

subscriberRedis.on('error', (err) => {
  console.error('✗ Redis Subscriber connection error:', err.message);
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
 * Idempotency Check for incoming events.
 * Returns true if the event has ALREADY been processed within TTL window.
 */
export async function isEventProcessed(eventId) {
  if (!eventId) return false;
  try {
    const exists = await redis.exists(`notif:evt_processed:${eventId}`);
    return exists === 1;
  } catch (err) {
    console.warn(`[Redis Event Check Warning] ${eventId}:`, err.message);
    return false;
  }
}

/**
 * Marks event as processed with TTL (default 24h).
 */
export async function markEventProcessed(eventId, ttlSeconds = 86400) {
  if (!eventId) return;
  try {
    await redis.set(`notif:evt_processed:${eventId}`, '1', 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[Redis Mark Processed Warning] ${eventId}:`, err.message);
  }
}

/**
 * Publish Real-time In-App Notification over Redis Pub/Sub
 * Consumed by websocket-service or client listeners
 */
export async function publishWebSocketNotification(userId, notification) {
  if (!config.features.enableWebSocketPublish) return;
  try {
    const payload = JSON.stringify({
      channel: `user:${userId}:notifications`,
      notification,
      timestamp: new Date().toISOString(),
    });

    await Promise.all([
      redis.publish(`user:${userId}:notifications`, payload),
      redis.publish('notifications:realtime', payload),
    ]);
  } catch (err) {
    console.warn(`[WebSocket Pub Warning] User ${userId}:`, err.message);
  }
}

/**
 * Publish Broadcast Notification over Redis Pub/Sub
 */
export async function publishBroadcastNotification(notification) {
  if (!config.features.enableWebSocketPublish) return;
  try {
    const payload = JSON.stringify({
      channel: 'notification:broadcast',
      notification,
      timestamp: new Date().toISOString(),
    });
    await redis.publish('notification:broadcast', payload);
  } catch (err) {
    console.warn(`[WebSocket Broadcast Warning]:`, err.message);
  }
}

/**
 * Sliding Window Rate Limiter
 */
export async function checkRateLimit(key, maxRequests = 60, windowSeconds = 60) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const rateLimitKey = `rate_limit:notif:${key}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(rateLimitKey, 0, windowStart);
    pipeline.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
    pipeline.zcard(rateLimitKey);
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
    console.warn(`[Rate Limiter Warning]:`, err.message);
    return { allowed: true, current: 1, limit: maxRequests, remaining: maxRequests - 1 };
  }
}

export default redis;
