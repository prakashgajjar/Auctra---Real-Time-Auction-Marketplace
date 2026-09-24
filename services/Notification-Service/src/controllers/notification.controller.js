import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  dispatchNotification,
} from '../services/notification.service.js';
import { successResponse } from '../utils/api-response.js';

export async function listNotificationsController(req, res, next) {
  try {
    const query = req.validatedQuery || {};
    const result = await getNotifications({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      isRead: query.isRead,
      type: query.type,
    });

    return successResponse(res, result.notifications, 'Notifications retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCountController(req, res, next) {
  try {
    const result = await getUnreadCount(req.user.id);
    return successResponse(res, result, 'Unread notification count retrieved');
  } catch (err) {
    next(err);
  }
}

export async function markAsReadController(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await markAsRead(id, req.user.id);
    return successResponse(res, updated, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

export async function markAllAsReadController(req, res, next) {
  try {
    const result = await markAllAsRead(req.user.id);
    return successResponse(res, result, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

export async function deleteNotificationController(req, res, next) {
  try {
    const { id } = req.params;
    const result = await deleteNotification(id, req.user.id);
    return successResponse(res, result, 'Notification deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function clearReadNotificationsController(req, res, next) {
  try {
    const result = await clearReadNotifications(req.user.id);
    return successResponse(res, result, 'Cleared read notifications successfully');
  } catch (err) {
    next(err);
  }
}

export async function sendNotificationController(req, res, next) {
  try {
    const result = await dispatchNotification(req.body);
    return successResponse(res, result, 'Notification dispatched successfully', 201);
  } catch (err) {
    next(err);
  }
}
