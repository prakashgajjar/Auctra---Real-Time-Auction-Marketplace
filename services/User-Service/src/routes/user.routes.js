import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateProfileSchema } from '../validation/user.schema.js';
import {
  getMeController,
  updateMeController,
  getPublicProfileController,
} from '../controllers/user.controller.js';

const router = Router();

// Public route: View seller or buyer public profile
router.get('/profile/:idOrUsername', getPublicProfileController);

// Authenticated personal profile routes
router.get('/me', requireAuth, getMeController);
router.patch('/me', requireAuth, validate(updateProfileSchema), updateMeController);

export default router;
