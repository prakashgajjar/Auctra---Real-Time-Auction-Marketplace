import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),

  db: {
    url: process.env.DATABASE_URL,
  },

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auctra_user_logs',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'auctra-dev-access-secret-key-change-in-production',
  },
};

export default config;
