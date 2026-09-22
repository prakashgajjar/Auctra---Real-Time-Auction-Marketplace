import prisma from '../prisma/client.js';
import { comparePassword } from '../utils/hash.js';
import { logAction, logLoginAttempt } from '../audit/audit.service.js';
import { createSession } from '../tokens/token.service.js';
import { sanitizeUser } from '../utils/user.js';
import { AppError } from '../middleware/error.middleware.js';

export async function loginUser({ identifier, password }, { ip, userAgent, deviceInfo } = {}) {
  const normalized = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalized }, { username: identifier }],
    },
  });

  if (!user) {
    logLoginAttempt({
      userId: 'unknown',
      ip,
      userAgent,
      device: deviceInfo,
      status: 'FAILED',
      failureReason: 'User not found',
    });
    throw new AppError('Invalid email/username or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    logLoginAttempt({
      userId: user.id,
      ip,
      userAgent,
      device: deviceInfo,
      status: 'FAILED',
      failureReason: 'Incorrect password',
    });
    throw new AppError('Invalid email/username or password', 401, 'INVALID_CREDENTIALS');
  }

  // Account status checks
  if (user.status === 'PENDING_VERIFICATION') {
    throw new AppError(
      'Your email is not verified. Please verify your email before logging in.',
      403,
      'PENDING_VERIFICATION'
    );
  }

  if (user.status === 'SUSPENDED') {
    throw new AppError(
      'Your account has been suspended. Please contact customer support.',
      403,
      'ACCOUNT_SUSPENDED'
    );
  }

  if (user.status === 'DEACTIVATED') {
    throw new AppError(
      'Your account has been deactivated.',
      403,
      'ACCOUNT_DEACTIVATED'
    );
  }

  // Record successful login in MongoDB
  logLoginAttempt({
    userId: user.id,
    ip,
    userAgent,
    device: deviceInfo,
    status: 'SUCCESS',
  });

  logAction({
    userId: user.id,
    action: 'LOGIN',
    ip,
    userAgent,
    metadata: { role: user.role },
  });

  // Issue access + refresh tokens
  const tokens = await createSession(user, { ip, userAgent, deviceInfo });

  return {
    user: sanitizeUser(user),
    tokens,
  };
}
