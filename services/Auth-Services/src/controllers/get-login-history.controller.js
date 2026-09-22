import { getLoginHistory } from '../audit/audit.service.js';

export async function getLoginHistoryController(req, res, next) {
  try {
    const history = await getLoginHistory(req.user.userId);
    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (err) {
    next(err);
  }
}
