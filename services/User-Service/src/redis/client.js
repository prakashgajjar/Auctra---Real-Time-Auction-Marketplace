import Redis from 'ioredis';
import config from '../config/index.js';

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✓ Redis connected successfully');
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

export default redis;
