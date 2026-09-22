import { resetPasswordWithOtp } from '../services/reset-password.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function resetPasswordController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await resetPasswordWithOtp(req.body, meta);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
