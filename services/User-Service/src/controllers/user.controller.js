import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/api-response.js';

export async function getMeController(req, res, next) {
  try {
    const user = await userService.getMe(req.user.id);
    return successResponse(res, { user }, 'User profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateMeController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const user = await userService.updateMe(req.user.id, req.body, context);
    return successResponse(res, { user }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfileController(req, res, next) {
  try {
    const user = await userService.getPublicProfile(req.params.idOrUsername);
    return successResponse(res, { user }, 'Public profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}
