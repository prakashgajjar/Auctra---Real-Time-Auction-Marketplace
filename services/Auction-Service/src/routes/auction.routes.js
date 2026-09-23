import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { requireVerifiedSeller } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAuctionSchema,
  updateAuctionSchema,
  queryAuctionsSchema,
} from '../validation/auction.schema.js';
import {
  createAuctionController,
  updateAuctionController,
  deleteAuctionController,
  publishAuctionController,
  cancelAuctionController,
  buyNowController,
  getAuctionDetailsController,
  listPublicAuctionsController,
  listSellerAuctionsController,
  listBuyerWonAuctionsController,
} from '../controllers/auction.controller.js';

const router = Router();

// 1. Buyer & Account Endpoints (Must precede parameterized /:id route)
router.get('/buyer/won', requireAuth, listBuyerWonAuctionsController);
router.get('/seller/me', requireAuth, requireVerifiedSeller, listSellerAuctionsController);

// 2. Public Discovery Endpoints (Supports optional authentication for watchlists)
router.get('/', optionalAuth, validate(queryAuctionsSchema, 'query'), listPublicAuctionsController);
router.get('/:id', optionalAuth, getAuctionDetailsController);

// 3. Instant Purchase (Buy Now)
router.post('/:id/buy-now', requireAuth, buyNowController);

// 4. Seller Auction Management Endpoints
router.post('/', requireAuth, requireVerifiedSeller, validate(createAuctionSchema), createAuctionController);
router.patch('/:id', requireAuth, requireVerifiedSeller, validate(updateAuctionSchema), updateAuctionController);
router.delete('/:id', requireAuth, requireVerifiedSeller, deleteAuctionController);
router.patch('/:id/publish', requireAuth, requireVerifiedSeller, publishAuctionController);
router.patch('/:id/cancel', requireAuth, requireVerifiedSeller, cancelAuctionController);

export default router;

