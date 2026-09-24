import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';
import {
  listNotificationsController,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  clearReadNotificationsController,
  sendNotificationController,
} from '../controllers/notification.controller.js';
import {
  getPreferencesController,
  updatePreferencesController,
} from '../controllers/preference.controller.js';
import {
  broadcastController,
  getStatsController,
  listDLQController,
  getDLQRecordController,
  retryDLQController,
  deleteDLQRecordController,
  purgeDLQController,
} from '../controllers/admin-notification.controller.js';
import {
  getNotificationsQuerySchema,
  sendNotificationSchema,
  broadcastNotificationSchema,
  updatePreferencesSchema,
  dlqQuerySchema,
} from '../validation/notification.schema.js';

const router = Router();

// Apply rate limiting to all notification endpoints
router.use(rateLimiter());

// ==========================================
// 1. Direct Dispatch (Internal / Services)
// ==========================================
router.post('/send', validate(sendNotificationSchema, 'body'), sendNotificationController);

// ==========================================
// 2. User Notification Endpoints (Auth Required)
// ==========================================
router.get(
  '/',
  requireAuth,
  validate(getNotificationsQuerySchema, 'query'),
  listNotificationsController
);

router.get('/unread-count', requireAuth, getUnreadCountController);

router.patch('/read-all', requireAuth, markAllAsReadController);

router.delete('/clear-read', requireAuth, clearReadNotificationsController);

router.patch('/:id/read', requireAuth, markAsReadController);

router.delete('/:id', requireAuth, deleteNotificationController);

// Preferences
router.get('/preferences', requireAuth, getPreferencesController);

router.put(
  '/preferences',
  requireAuth,
  validate(updatePreferencesSchema, 'body'),
  updatePreferencesController
);

// ==========================================
// 3. Admin & DLQ Operations (Admin/Moderator Only)
// ==========================================
router.post(
  '/admin/broadcast',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validate(broadcastNotificationSchema, 'body'),
  broadcastController
);

router.get(
  '/admin/stats',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  getStatsController
);

router.get(
  '/admin/dlq',
  requireAuth,
  requireRole('ADMIN'),
  validate(dlqQuerySchema, 'query'),
  listDLQController
);

router.get(
  '/admin/dlq/:id',
  requireAuth,
  requireRole('ADMIN'),
  getDLQRecordController
);

router.post(
  '/admin/dlq/:id/retry',
  requireAuth,
  requireRole('ADMIN'),
  retryDLQController
);

router.delete(
  '/admin/dlq/:id',
  requireAuth,
  requireRole('ADMIN'),
  deleteDLQRecordController
);

router.delete(
  '/admin/dlq',
  requireAuth,
  requireRole('ADMIN'),
  purgeDLQController
);

export default router;
