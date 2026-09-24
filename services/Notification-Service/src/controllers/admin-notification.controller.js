import { broadcastNotification, getNotificationStats } from '../services/notification.service.js';
import {
  listDLQ,
  getDLQRecord,
  removeDLQRecord,
  purgeDLQ,
  getDLQStats,
} from '../services/dlq.service.js';
import {
  handleBidPlaced,
  handleAuctionStarted,
  handleAuctionEndingSoon,
  handleAuctionWon,
  handlePaymentSuccessful,
  handleOrderShipped,
  handleDirectNotification,
} from '../events/event-handlers.js';
import { successResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export async function broadcastController(req, res, next) {
  try {
    const result = await broadcastNotification(req.body);
    return successResponse(res, result, 'Broadcast notification dispatched successfully', 200);
  } catch (err) {
    next(err);
  }
}

export async function getStatsController(req, res, next) {
  try {
    const [notifStats, dlqStats] = await Promise.all([
      getNotificationStats(),
      getDLQStats(),
    ]);

    return successResponse(
      res,
      {
        notifications: notifStats,
        dlq: dlqStats,
      },
      'Notification service metrics retrieved'
    );
  } catch (err) {
    next(err);
  }
}

export async function listDLQController(req, res, next) {
  try {
    const query = req.validatedQuery || {};
    const result = await listDLQ({
      page: query.page,
      limit: query.limit,
    });
    return successResponse(res, result.records, 'DLQ records retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDLQRecordController(req, res, next) {
  try {
    const { id } = req.params;
    const record = await getDLQRecord(id);
    if (!record) {
      throw new AppError('DLQ record not found', 404, 'NOT_FOUND');
    }
    return successResponse(res, record, 'DLQ record retrieved');
  } catch (err) {
    next(err);
  }
}

export async function retryDLQController(req, res, next) {
  try {
    const { id } = req.params;
    const record = await getDLQRecord(id);
    if (!record) {
      throw new AppError('DLQ record not found', 404, 'NOT_FOUND');
    }

    const payload = record.payload;
    const eventType = payload?.type || payload?.eventType;

    // Execute matching handler
    switch (eventType) {
      case 'BID_PLACED':
        await handleBidPlaced(payload);
        break;
      case 'AUCTION_STARTED':
      case 'AUCTION_LIVE':
        await handleAuctionStarted(payload);
        break;
      case 'AUCTION_ENDING_SOON':
        await handleAuctionEndingSoon(payload);
        break;
      case 'AUCTION_ENDED':
      case 'AUCTION_WON':
        await handleAuctionWon(payload);
        break;
      case 'PAYMENT_SUCCESSFUL':
        await handlePaymentSuccessful(payload);
        break;
      case 'ORDER_SHIPPED':
        await handleOrderShipped(payload);
        break;
      default:
        await handleDirectNotification(payload);
        break;
    }

    // Success! Remove from DLQ
    await removeDLQRecord(id);

    return successResponse(res, { retriedId: id, status: 'SUCCESS' }, 'Event reprocessed and removed from DLQ');
  } catch (err) {
    next(new AppError(`DLQ replay failed: ${err.message}`, 500, 'REPLAY_FAILED'));
  }
}

export async function deleteDLQRecordController(req, res, next) {
  try {
    const { id } = req.params;
    await removeDLQRecord(id);
    return successResponse(res, { deletedId: id }, 'DLQ record deleted');
  } catch (err) {
    next(err);
  }
}

export async function purgeDLQController(req, res, next) {
  try {
    const result = await purgeDLQ();
    return successResponse(res, result, 'Dead-Letter Queue purged successfully');
  } catch (err) {
    next(err);
  }
}
