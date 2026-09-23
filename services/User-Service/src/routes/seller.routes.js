import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { applySellerSchema, updateSellerProfileSchema } from '../validation/seller.schema.js';
import {
  applySellerController,
  getSellerProfileController,
  updateSellerProfileController,
  getPublicStoreController,
} from '../controllers/seller.controller.js';

const router = Router();

// Public: View verified seller storefront
router.get('/store/:storeName', getPublicStoreController);

// Authenticated Seller routes
router.post('/apply', requireAuth, validate(applySellerSchema), applySellerController);
router.get('/profile', requireAuth, getSellerProfileController);
router.patch('/profile', requireAuth, validate(updateSellerProfileSchema), updateSellerProfileController);

export default router;
