import prisma from '../prisma/client.js';
import { publishWebSocketNotification, publishBroadcastNotification } from '../redis/client.js';
import {
  sendOutbidEmail,
  sendAuctionWonEmail,
  sendAuctionStartedEmail,
  sendEndingSoonEmail,
  sendPaymentEmail,
  sendOrderShippedEmail,
  sendSystemEmail,
  sendEmail,
} from '../mail/mail.service.js';
import { getUserPreferences } from './preference.service.js';
import { AppError } from '../utils/app-error.js';

/**
 * Dispatch Multi-Channel Notification
 * Channels: IN_APP (PostgreSQL), WEBSOCKET (Redis Pub/Sub), EMAIL (Resend / SMTP)
 */
export async function dispatchNotification({
  userId,
  type = 'SYSTEM',
  title,
  message,
  data = {},
  channels = ['IN_APP', 'EMAIL', 'WEBSOCKET'],
  emailPayload = null,
}) {
  if (!userId) {
    throw new AppError('userId is required to dispatch notification', 400, 'MISSING_USER_ID');
  }

  // 1. Fetch user info if needed for email or preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, firstName: true },
  });

  if (!user) {
    console.warn(`[Notification Warning] Target user ${userId} not found in database`);
    return null;
  }

  const preferences = await getUserPreferences(userId);
  let savedNotification = null;
  let emailResult = null;
  let webSocketResult = false;

  // 2. Channel: IN_APP
  if (channels.includes('IN_APP')) {
    savedNotification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
      },
    });
  }

  // 3. Channel: WEBSOCKET / Real-Time Pub-Sub
  if (channels.includes('WEBSOCKET')) {
    const payload = savedNotification || {
      id: `temp-${Date.now()}`,
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    await publishWebSocketNotification(userId, payload);
    webSocketResult = true;
  }

  // 4. Channel: EMAIL
  const shouldSendEmail =
    channels.includes('EMAIL') &&
    user.email &&
    isEmailAllowedByPreference(type, preferences);

  if (shouldSendEmail) {
    try {
      emailResult = await triggerTemplatedEmail({
        type,
        user,
        title,
        message,
        data,
        emailPayload,
      });
    } catch (err) {
      console.error(`[Email Delivery Error] Failed to send email to ${user.email}:`, err.message);
      emailResult = { success: false, error: err.message };
    }
  }

  return {
    notification: savedNotification,
    emailResult,
    webSocketResult,
  };
}

/**
 * Check if the notification type is allowed in user's email preferences
 */
function isEmailAllowedByPreference(type, preferences) {
  if (!preferences || !preferences.email) return true;
  switch (type) {
    case 'AUCTION_OUTBID':
      return preferences.email.outbid !== false;
    case 'AUCTION_WON':
      return preferences.email.auctionWon !== false;
    case 'AUCTION_STARTED':
      return preferences.email.auctionStarted !== false;
    case 'AUCTION_ENDING_SOON':
      return preferences.email.endingSoon !== false;
    case 'PAYMENT_SUCCESSFUL':
    case 'PAYMENT_PENDING':
    case 'PAYMENT_REFUNDED':
      return preferences.email.payment !== false;
    case 'ORDER_SHIPPED':
      return preferences.email.orderShipped !== false;
    case 'SYSTEM':
      return preferences.email.system !== false;
    default:
      return true;
  }
}

/**
 * Route to corresponding rich email template
 */
async function triggerTemplatedEmail({ type, user, title, message, data, emailPayload }) {
  const recipient = user.email;
  const username = user.username || user.firstName || 'Bidder';
  const custom = emailPayload || {};

  switch (type) {
    case 'AUCTION_OUTBID':
      return sendOutbidEmail({
        to: recipient,
        username,
        auctionTitle: custom.auctionTitle || data.auctionTitle,
        newBidAmount: custom.newBidAmount || data.newBidAmount || data.amount,
        auctionId: custom.auctionId || data.auctionId,
        endTime: custom.endTime || data.endTime,
      });

    case 'AUCTION_WON':
      return sendAuctionWonEmail({
        to: recipient,
        username,
        auctionTitle: custom.auctionTitle || data.auctionTitle,
        winningBidAmount: custom.winningBidAmount || data.winningBidAmount || data.amount,
        auctionId: custom.auctionId || data.auctionId,
      });

    case 'AUCTION_STARTED':
      return sendAuctionStartedEmail({
        to: recipient,
        username,
        auctionTitle: custom.auctionTitle || data.auctionTitle,
        startingPrice: custom.startingPrice || data.startingPrice,
        auctionId: custom.auctionId || data.auctionId,
        endTime: custom.endTime || data.endTime,
      });

    case 'AUCTION_ENDING_SOON':
      return sendEndingSoonEmail({
        to: recipient,
        username,
        auctionTitle: custom.auctionTitle || data.auctionTitle,
        currentBidAmount: custom.currentBidAmount || data.currentBidAmount || data.amount,
        auctionId: custom.auctionId || data.auctionId,
        minutesRemaining: custom.minutesRemaining || data.minutesRemaining || 15,
      });

    case 'PAYMENT_SUCCESSFUL':
    case 'PAYMENT_PENDING':
    case 'PAYMENT_REFUNDED':
      return sendPaymentEmail({
        to: recipient,
        username,
        orderId: custom.orderId || data.orderId,
        auctionTitle: custom.auctionTitle || data.auctionTitle,
        amount: custom.amount || data.amount,
        paymentStatus: type === 'PAYMENT_SUCCESSFUL' ? 'SUCCESSFUL' : type.replace('PAYMENT_', ''),
        transactionId: custom.transactionId || data.transactionId,
      });

    case 'ORDER_SHIPPED':
      return sendOrderShippedEmail({
        to: recipient,
        username,
        orderId: custom.orderId || data.orderId,
        auctionTitle: custom.auctionTitle || data.auctionTitle,
        trackingNumber: custom.trackingNumber || data.trackingNumber,
        carrier: custom.carrier || data.carrier,
      });

    default:
      return sendSystemEmail({
        to: recipient,
        username,
        title,
        message,
        actionUrl: custom.actionUrl || data.actionUrl,
        actionText: custom.actionText || data.actionText,
      });
  }
}

/**
 * List User Notifications (Paginated)
 */
export async function getNotifications({ userId, page = 1, limit = 20, isRead = undefined, type = undefined }) {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(isRead !== undefined && { isRead: isRead === true || isRead === 'true' }),
    ...(type && { type }),
  };

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    unreadCount,
    notifications,
  };
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
  return { unreadCount: count };
}

/**
 * Mark single notification as read
 */
export async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new AppError('Notification not found or access denied.', 404, 'NOT_FOUND');
  }

  if (notification.isRead) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all user notifications as read
 */
export async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { updatedCount: result.count };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new AppError('Notification not found or access denied.', 404, 'NOT_FOUND');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { success: true, deletedId: notificationId };
}

/**
 * Clear all read notifications for user
 */
export async function clearReadNotifications(userId) {
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true,
    },
  });

  return { deletedCount: result.count };
}

/**
 * Broadcast notification to all active users or by role (Admin Only)
 */
export async function broadcastNotification({ title, message, type = 'SYSTEM', data = {}, targetRole = null }) {
  const userFilter = {
    status: 'ACTIVE',
    ...(targetRole && { role: targetRole }),
  };

  const users = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, email: true },
  });

  if (!users || users.length === 0) {
    return { dispatchedCount: 0 };
  }

  // 1. Create in-app notification records in batches of 100
  const notificationRecords = users.map((u) => ({
    userId: u.id,
    type,
    title,
    message,
    data: data || {},
  }));

  const batchSize = 100;
  for (let i = 0; i < notificationRecords.length; i += batchSize) {
    const chunk = notificationRecords.slice(i, i + batchSize);
    await prisma.notification.createMany({
      data: chunk,
    });
  }

  // 2. Publish real-time broadcast via Redis
  await publishBroadcastNotification({
    type,
    title,
    message,
    data,
    targetRole,
  });

  return { dispatchedCount: users.length };
}

/**
 * Notification Service Overall Stats (Admin Only)
 */
export async function getNotificationStats() {
  const [totalNotifications, unreadCount, breakdown] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.notification.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
  ]);

  const typeCounts = breakdown.reduce((acc, curr) => {
    acc[curr.type] = curr._count.id;
    return acc;
  }, {});

  return {
    totalNotifications,
    unreadCount,
    readCount: totalNotifications - unreadCount,
    breakdownByType: typeCounts,
  };
}
