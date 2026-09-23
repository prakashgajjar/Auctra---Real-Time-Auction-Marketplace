import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3004', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'auctra-dev-access-secret-key-change-in-production',
  },
  bidding: {
    antiSnipingWindowSeconds: 30, // Bid in last 30s extends auction
    antiSnipingExtensionSeconds: 30, // Extend by 30s
    rateLimitMaxBidsPerMinute: 20, // 20 bids / min / user
  },
};

export default config;
