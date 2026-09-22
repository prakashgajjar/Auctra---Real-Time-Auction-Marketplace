import { getUserProfile } from '../services/profile.service.js';

export async function getProfileController(req, res, next) {
  try {
    const user = await getUserProfile(req.user.userId);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
