import { checkRateLimit } from '../redis/client.js';
import config from '../config/index.js';
import { AppError } from '../utils/app-error.js';

export function rateLimiter({
  max = config.rateLimit.notificationsMax,
  windowSeconds = config.rateLimit.windowSeconds,
  keyGenerator = (req) => req.user?.id || req.ip,
} = {}) {
  return async (req, res, next) => {
    try {
      const identifier = keyGenerator(req);
      const result = await checkRateLimit(identifier, max, windowSeconds);

      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        throw new AppError(
          'Rate limit exceeded. Please slow down your requests.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
