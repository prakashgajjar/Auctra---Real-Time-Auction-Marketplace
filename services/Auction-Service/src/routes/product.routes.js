import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireVerifiedSeller } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
} from '../validation/product.schema.js';
import {
  createProductController,
  listPublicProductsController,
  listSellerProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
} from '../controllers/product.controller.js';

const router = Router();

// 1. Seller Private Inventory Endpoints (Registered before parameterized /:id route)
router.get('/seller/me', requireAuth, requireVerifiedSeller, listSellerProductsController);
router.get('/me', requireAuth, requireVerifiedSeller, listSellerProductsController);

// 2. Public Product Discovery Endpoints
router.get('/', validate(queryProductsSchema, 'query'), listPublicProductsController);
router.get('/:id', getProductByIdController);

// 3. Seller Product Management Endpoints
router.post('/', requireAuth, requireVerifiedSeller, validate(createProductSchema), createProductController);
router.patch('/:id', requireAuth, requireVerifiedSeller, validate(updateProductSchema), updateProductController);
router.delete('/:id', requireAuth, requireVerifiedSeller, deleteProductController);

export default router;

