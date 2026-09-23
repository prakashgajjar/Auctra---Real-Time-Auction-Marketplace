import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireVerifiedSeller } from '../middleware/rbac.middleware.js';
import {
  generatePresignedUrlController,
  mockUploadReceiver,
} from '../controllers/upload.controller.js';

const router = Router();

router.post('/presigned-url', requireAuth, requireVerifiedSeller, generatePresignedUrlController);
router.put('/mock-receiver', mockUploadReceiver);

export default router;
