import { revokeAllUserTokens, blacklistAccessToken } from '../tokens/token.service.js';
import { logAction } from '../audit/audit.service.js';

export async function logoutAllSessions({ userId, accessToken }, { ip, userAgent } = {}) {
  await revokeAllUserTokens(userId);

  if (accessToken) {
    await blacklistAccessToken(accessToken);
  }

  logAction({
    userId,
    action: 'LOGOUT_ALL',
    ip,
    userAgent,
  });

  return { message: 'Logged out from all devices successfully' };
}
