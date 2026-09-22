import 'dotenv/config';

const config = {
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  isProduction: process.env.NODE_ENV === 'production',

  // PostgreSQL
  databaseUrl: process.env.DATABASE_URL,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI,

  // Redis
  redis: {
    url: process.env.REDIS_URL || process.env.REDIS || null,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // OTP
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSeconds: 60,
  },

  // Resend
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'Auctra <onboarding@resend.dev>',
  },

  // SMTP (Fallback)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Rate Limiting
  rateLimit: {
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
    loginWindowSeconds: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_SECONDS || '60', 10),
    otpMax: parseInt(process.env.RATE_LIMIT_OTP_MAX || '3', 10),
    otpWindowSeconds: parseInt(process.env.RATE_LIMIT_OTP_WINDOW_SECONDS || '900', 10),
  },
};

export default config;
