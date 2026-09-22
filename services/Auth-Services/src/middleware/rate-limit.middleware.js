import { incrementRateLimit } from '../redis/client.js';
import config from '../config/index.js';

/**
 * Redis-based sliding rate limiter
 */
export function rateLimiter({ max, windowSeconds, keyGenerator, message }) {
  return async (req, res, next) => {
    try {
      const keySuffix = keyGenerator ? keyGenerator(req) : (req.ip || 'anonymous');
      const key = `ratelimit:${keySuffix}`;

      const count = await incrementRateLimit(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));

      if (count > max) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: message || `Too many requests. Please try again after ${windowSeconds} seconds.`,
            retryAfterSeconds: windowSeconds,
          },
        });
      }

      next();
    } catch (err) {
      // In case Redis is down, fail open so user authentication is not blocked
      console.error('Rate limit error, failing open:', err.message);
      next();
    }
  };
}

export const loginRateLimiter = rateLimiter({
  max: config.rateLimit.loginMax,
  windowSeconds: config.rateLimit.loginWindowSeconds,
  keyGenerator: (req) => `login:${req.ip || 'anon'}:${req.body?.identifier || ''}`,
  message: 'Too many login attempts. Please wait before trying again.',
});

export const otpRateLimiter = rateLimiter({
  max: config.rateLimit.otpMax,
  windowSeconds: config.rateLimit.otpWindowSeconds,
  keyGenerator: (req) => `otp:${req.ip || 'anon'}:${req.body?.email || ''}`,
  message: 'Too many OTP requests. Please wait 15 minutes before requesting again.',
});
