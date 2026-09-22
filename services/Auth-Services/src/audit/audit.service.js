import AuditLog from '../mongo/schemas/audit-log.schema.js';
import LoginHistory from '../mongo/schemas/login-history.schema.js';

// All writes are fire-and-forget — never block auth flows

export async function logAction({ userId, action, ip, userAgent = '', metadata = {}, status = 'SUCCESS' }) {
  try {
    await AuditLog.create({ userId, action, ip, userAgent, metadata, status, timestamp: new Date() });
  } catch (err) {
    console.error(`Audit log failed: ${action}`, err.message);
  }
}

export async function logLoginAttempt({ userId, ip, userAgent = '', device = '', status, failureReason = null }) {
  try {
    await LoginHistory.create({ userId, ip, userAgent, device, status, failureReason, timestamp: new Date() });
  } catch (err) {
    console.error('Login history log failed:', err.message);
  }
}

export async function getLoginHistory(userId, limit = 20) {
  return LoginHistory.find({ userId, status: 'SUCCESS' }).sort({ timestamp: -1 }).limit(limit);
}

export async function getAuditLogs(userId, limit = 50) {
  return AuditLog.find({ userId }).sort({ timestamp: -1 }).limit(limit);
}
