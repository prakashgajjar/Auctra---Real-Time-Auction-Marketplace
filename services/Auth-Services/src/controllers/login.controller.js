import { loginUser } from '../services/login.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function loginController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await loginUser(req.body, meta);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
