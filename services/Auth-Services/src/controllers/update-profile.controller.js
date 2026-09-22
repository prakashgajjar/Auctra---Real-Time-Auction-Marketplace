import { updateUserProfile } from '../services/profile.service.js';

export async function updateProfileController(req, res, next) {
  try {
    const user = await updateUserProfile(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
