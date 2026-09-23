import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { bidRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  placeBidSchema,
  autoBidSchema,
  queryBidsSchema,
} from '../validation/bid.schema.js';
import {
  placeBidController,
  getAuctionBidHistoryController,
  getUserBidsController,
  setAutoBidController,
  getAutoBidController,
  cancelAutoBidController,
} from '../controllers/bid.controller.js';

const router = Router();

// 1. Place a Bid (Subject to JWT Auth & Redis Sliding Window Rate Limiting)
router.post(
  '/',
  requireAuth,
  bidRateLimiter(),
  validate(placeBidSchema),
  placeBidController
);

// 2. User Specific Bid History
router.get(
  '/my-bids',
  requireAuth,
  validate(queryBidsSchema, 'query'),
  getUserBidsController
);

// 3. Auto-Bidding Management
router.post(
  '/auto',
  requireAuth,
  validate(autoBidSchema),
  setAutoBidController
);

router.get(
  '/auto/:auctionId',
  requireAuth,
  getAutoBidController
);

router.delete(
  '/auto/:auctionId',
  requireAuth,
  cancelAutoBidController
);

// 4. Public Auction Bid History
router.get(
  '/auction/:auctionId',
  validate(queryBidsSchema, 'query'),
  getAuctionBidHistoryController
);

export default router;
