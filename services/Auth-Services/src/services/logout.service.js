import { revokeRefreshToken, blacklistAccessToken } from '../tokens/token.service.js';
import { logAction } from '../audit/audit.service.js';

export async function logoutUser({ userId, refreshToken, accessToken }, { ip, userAgent } = {}) {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  if (accessToken) {
    await blacklistAccessToken(accessToken);
  }

  logAction({
    userId,
    action: 'LOGOUT',
    ip,
    userAgent,
  });

  return { message: 'Logged out successfully' };
}
