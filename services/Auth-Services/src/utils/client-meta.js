/**
 * Extract client metadata (IP, User Agent, Device) from Express request
 */
export function getClientMeta(req) {
  return {
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1',
    userAgent: req.headers['user-agent'] || '',
    deviceInfo: req.headers['x-device-info'] || req.headers['user-agent'] || 'Unknown device',
  };
}
