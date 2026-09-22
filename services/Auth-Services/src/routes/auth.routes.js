import { Router } from 'express';

// Middlewares
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { loginRateLimiter, otpRateLimiter } from '../middleware/rate-limit.middleware.js';

// Validation Schemas
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validation/auth.schema.js';

// Single-Responsibility Controllers
import { registerController } from '../controllers/register.controller.js';
import { verifyEmailController } from '../controllers/verify-email.controller.js';
import { resendOtpController } from '../controllers/resend-otp.controller.js';
import { loginController } from '../controllers/login.controller.js';
import { refreshTokenController } from '../controllers/refresh-token.controller.js';
import { logoutController } from '../controllers/logout.controller.js';
import { logoutAllController } from '../controllers/logout-all.controller.js';
import { forgotPasswordController } from '../controllers/forgot-password.controller.js';
import { resetPasswordController } from '../controllers/reset-password.controller.js';
import { changePasswordController } from '../controllers/change-password.controller.js';
import { getProfileController } from '../controllers/get-profile.controller.js';
import { updateProfileController } from '../controllers/update-profile.controller.js';
import { getLoginHistoryController } from '../controllers/get-login-history.controller.js';
import { getAuditLogsController } from '../controllers/get-audit-logs.controller.js';

const router = Router();

// Public Routes
router.post('/register', validate(registerSchema), registerController);
router.post('/verify-email', validate(verifyOtpSchema), verifyEmailController);
router.post('/resend-otp', otpRateLimiter, validate(resendOtpSchema), resendOtpController);
router.post('/login', loginRateLimiter, validate(loginSchema), loginController);
router.post('/refresh', validate(refreshTokenSchema), refreshTokenController);
router.post('/forgot-password', otpRateLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);

// Authenticated Routes
router.post('/logout', requireAuth, logoutController);
router.post('/logout-all', requireAuth, logoutAllController);
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePasswordController);
router.get('/me', requireAuth, getProfileController);
router.patch('/me', requireAuth, validate(updateProfileSchema), updateProfileController);
router.get('/login-history', requireAuth, getLoginHistoryController);
router.get('/audit-logs', requireAuth, getAuditLogsController);

export default router;
