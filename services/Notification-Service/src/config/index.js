import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3007', 10),
  isProduction: process.env.NODE_ENV === 'production',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'auctra-dev-access-secret-key-change-in-production',
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'Auctra <onboarding@resend.dev>',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  features: {
    enableEmail: process.env.ENABLE_EMAIL !== 'false',
    enableWebSocketPublish: process.env.ENABLE_WEBSOCKET_PUBLISH !== 'false',
  },

  dlq: {
    maxRetries: parseInt(process.env.DLQ_MAX_RETRIES || '3', 10),
    retryBackoffMs: parseInt(process.env.DLQ_RETRY_BACKOFF_MS || '1000', 10),
  },

  rateLimit: {
    notificationsMax: parseInt(process.env.RATE_LIMIT_NOTIFICATIONS_MAX || '60', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10),
  },
};

export default config;
