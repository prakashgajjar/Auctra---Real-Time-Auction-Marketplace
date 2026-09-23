import { AuditLog } from './audit.model.js';
import { isMongoConnected } from '../mongo/connection.js';

export async function logUserAction({ userId, performedBy, action, details = {}, ip, userAgent }) {
  try {
    if (!isMongoConnected()) return;
    await AuditLog.create({
      userId,
      performedBy: performedBy || userId,
      action,
      details,
      ipAddress: ip,
      userAgent,
    });
  } catch (err) {
    console.error('Failed to write user audit log:', err.message);
  }
}

export async function getUserAuditLogs(userId, limit = 50) {
  if (!isMongoConnected()) return [];
  return AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}
