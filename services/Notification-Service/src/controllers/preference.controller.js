import { getUserPreferences, updateUserPreferences } from '../services/preference.service.js';
import { successResponse } from '../utils/api-response.js';

export async function getPreferencesController(req, res, next) {
  try {
    const preferences = await getUserPreferences(req.user.id);
    return successResponse(res, preferences, 'User notification preferences retrieved');
  } catch (err) {
    next(err);
  }
}

export async function updatePreferencesController(req, res, next) {
  try {
    const updated = await updateUserPreferences(req.user.id, req.body);
    return successResponse(res, updated, 'Notification preferences updated successfully');
  } catch (err) {
    next(err);
  }
}
