import { refreshUserToken } from '../services/refresh-token.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function refreshTokenController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await refreshUserToken(req.body, meta);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
