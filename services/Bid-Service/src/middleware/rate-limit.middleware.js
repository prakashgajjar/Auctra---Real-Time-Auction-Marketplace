import { checkRateLimit } from '../redis/client.js';
import config from '../config/index.js';
import { AppError } from '../utils/app-error.js';

export function bidRateLimiter() {
  return async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.ip || 'anonymous';
      const key = `bid:${identifier}`;
      const { allowed, limit, remaining } = await checkRateLimit(
        key,
        config.bidding.rateLimitMaxBidsPerMinute,
        60
      );

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);

      if (!allowed) {
        throw new AppError(
          `Bid rate limit exceeded. Max ${limit} bids per minute. Please wait before placing another bid.`,
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
