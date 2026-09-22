import { getAuditLogs } from '../audit/audit.service.js';

export async function getAuditLogsController(req, res, next) {
  try {
    const logs = await getAuditLogs(req.user.userId);
    res.status(200).json({
      success: true,
      data: { logs },
    });
  } catch (err) {
    next(err);
  }
}
