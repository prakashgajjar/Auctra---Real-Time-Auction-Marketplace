import { forgotPasswordRequest } from '../services/forgot-password.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function forgotPasswordController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await forgotPasswordRequest(req.body, meta);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
