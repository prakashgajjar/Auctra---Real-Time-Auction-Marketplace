import { changeUserPassword } from '../services/change-password.service.js';
import { getClientMeta } from '../utils/client-meta.js';

export async function changePasswordController(req, res, next) {
  try {
    const meta = getClientMeta(req);
    const result = await changeUserPassword(
      {
        userId: req.user.userId,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
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
