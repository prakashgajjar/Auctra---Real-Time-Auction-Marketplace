import prisma from '../prisma/client.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { revokeAllUserTokens } from '../tokens/token.service.js';
import { logAction } from '../audit/audit.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function changeUserPassword({ userId, currentPassword, newPassword }, { ip, userAgent } = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Invalidate all sessions except current one or all
  await revokeAllUserTokens(userId);

  logAction({
    userId,
    action: 'PASSWORD_CHANGED',
    ip,
    userAgent,
  });

  return {
    message: 'Password changed successfully. All other sessions have been logged out.',
  };
}
