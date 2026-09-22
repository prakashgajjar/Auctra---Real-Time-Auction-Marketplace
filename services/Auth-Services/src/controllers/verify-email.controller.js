import { verifyUserEmail } from '../services/verify-email.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function verifyEmailController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await verifyUserEmail(req.body, meta);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
