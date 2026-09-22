import prisma from '../prisma/client.js';
import { hashSha256 } from '../utils/hash.js';
import { verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens, createSession } from '../tokens/token.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function refreshUserToken({ refreshToken }, { ip, userAgent, deviceInfo } = {}) {
  const { valid, error } = verifyRefreshToken(refreshToken);
  if (!valid) {
    throw new AppError(error, 401, 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = hashSha256(refreshToken);
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // Reuse detection: if a revoked token is used, assume breach and revoke all sessions!
  if (!tokenRecord || tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
    if (tokenRecord?.revoked) {
      console.warn(`⚠️ Token reuse detected for user ${tokenRecord.userId}! Revoking all active sessions.`);
      await revokeAllUserTokens(tokenRecord.userId);
    }
    throw new AppError('Invalid or expired refresh token. Please sign in again.', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (tokenRecord.user.status !== 'ACTIVE') {
    throw new AppError('Account is not active', 403, 'INACTIVE_ACCOUNT');
  }

  // Revoke the old refresh token (Token Rotation)
  await revokeRefreshToken(refreshToken);

  // Issue new session
  const tokens = await createSession(tokenRecord.user, { ip, userAgent, deviceInfo });

  return {
    tokens,
  };
}
