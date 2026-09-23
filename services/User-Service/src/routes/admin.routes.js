import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
  reviewSellerApplicationSchema,
} from '../validation/admin.schema.js';
import {
  listUsersController,
  getUserDetailsController,
  updateUserStatusController,
  updateUserRoleController,
  listSellerApplicationsController,
  reviewSellerApplicationController,
} from '../controllers/admin.controller.js';

const router = Router();

// All Admin routes require ADMIN or MODERATOR role
router.use(requireAuth, requireRole('ADMIN', 'MODERATOR'));

// User Directory & Moderation
router.get('/users', listUsersController);
router.get('/users/:id', getUserDetailsController);
router.patch('/users/:id/status', validate(updateUserStatusSchema), updateUserStatusController);
router.patch('/users/:id/role', validate(updateUserRoleSchema), updateUserRoleController);

// Seller Applications Management
router.get('/seller-applications', listSellerApplicationsController);
router.patch(
  '/seller-applications/:id/review',
  validate(reviewSellerApplicationSchema),
  reviewSellerApplicationController
);

export default router;
