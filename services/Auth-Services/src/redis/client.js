import Redis from 'ioredis';
import config from '../config/index.js';

function extractRedisUrl(input) {
  if (!input) return null;
  const match = input.match(/rediss?:\/\/[^\s]+/);
  return match ? match[0] : input;
}

const redisUrl = extractRedisUrl(config.redis.url);

const redisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.error('Redis: max retry attempts reached');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};

const redis = redisUrl
  ? new Redis(redisUrl, redisOptions)
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      ...redisOptions,
    });

redis.on('connect', () => console.log('Redis connected successfully'));
redis.on('error', (err) => console.error('Redis error:', err.message));

// ── Convenience helpers 

export async function getJson(key) {
  const data = await redis.get(key);
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
}

export async function setJson(key, value, ttlSeconds) {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function incrementRateLimit(key, windowSeconds) {
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, windowSeconds);
  const results = await multi.exec();
  return results ? results[0][1] : 0;
}

export async function blacklistToken(jti, ttlSeconds) {
  await redis.setex(`blacklist:${jti}`, ttlSeconds, '1');
}

export async function isTokenBlacklisted(jti) {
  const result = await redis.exists(`blacklist:${jti}`);
  return result === 1;
}

export async function isRedisHealthy() {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch { return false; }
}

export default redis;
