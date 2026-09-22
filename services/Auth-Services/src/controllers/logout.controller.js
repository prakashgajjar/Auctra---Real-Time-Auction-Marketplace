import { logoutUser } from '../services/logout.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function logoutController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await logoutUser(
      {
        userId: req.user.userId,
        refreshToken: req.body?.refreshToken,
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
