import { registerUser } from '../services/register.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function registerController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await registerUser(req.body, meta);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
