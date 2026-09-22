import { logoutAllSessions } from '../services/logout-all.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function logoutAllController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await logoutAllSessions(
      {
        userId: req.user.userId,
        accessToken: req.token,
      },
      meta
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
