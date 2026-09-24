import { subscriberRedis, isEventProcessed, markEventProcessed } from '../redis/client.js';
import config from '../config/index.js';
import { pushToDLQ } from '../services/dlq.service.js';
import {
  handleBidPlaced,
  handleAuctionStarted,
  handleAuctionEndingSoon,
  handleAuctionWon,
  handlePaymentSuccessful,
  handleOrderShipped,
  handleDirectNotification,
} from './event-handlers.js';

const CHANNELS_TO_SUBSCRIBE = [
  'auction:events',
  'auction:lifecycle',
  'notification:events',
  'payment:events',
  'order:events',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Route incoming channel message to corresponding handler
 */
async function routeEvent(channel, event) {
  const eventType = event.type || event.eventType;

  switch (eventType) {
    case 'BID_PLACED':
      return handleBidPlaced(event);

    case 'AUCTION_STARTED':
    case 'AUCTION_LIVE':
      return handleAuctionStarted(event);

    case 'AUCTION_ENDING_SOON':
      return handleAuctionEndingSoon(event);

    case 'AUCTION_ENDED':
    case 'AUCTION_WON':
      return handleAuctionWon(event);

    case 'PAYMENT_SUCCESSFUL':
      return handlePaymentSuccessful(event);

    case 'ORDER_SHIPPED':
      return handleOrderShipped(event);

    case 'SEND_NOTIFICATION':
    case 'DIRECT_NOTIFICATION':
      return handleDirectNotification(event);

    default:
      // If sent on notification:events with no specific type, treat as direct notification
      if (channel === 'notification:events' && event.userId) {
        return handleDirectNotification(event);
      }
      console.log(`[Event Consumer] Ignored event type "${eventType}" on channel ${channel}`);
  }
}

/**
 * Process event with Idempotency + Exponential Backoff Retry + DLQ
 */
async function processEventWithResilience(channel, rawMessage) {
  let event;
  try {
    event = JSON.parse(rawMessage);
  } catch (err) {
    console.error(`[Event Parse Error] Invalid JSON on channel ${channel}:`, rawMessage);
    await pushToDLQ({
      eventName: `${channel}:unparseable`,
      payload: rawMessage,
      error: err,
      retryCount: 0,
    });
    return;
  }

  // Generate unique event identifier for idempotency
  const eventId =
    event.eventId ||
    event.bidId ||
    event.id ||
    `${channel}:${event.type || 'msg'}:${event.auctionId || event.orderId || event.userId || ''}:${event.timestamp || event.createdAt || Date.now()}`;

  // 1. Idempotency Check
  const alreadyProcessed = await isEventProcessed(eventId);
  if (alreadyProcessed) {
    console.log(`[Event Idempotency] Skipping duplicate event ${eventId}`);
    return;
  }

  // 2. Resilience Retry Loop (plane.md: Retry -> Retry -> DLQ)
  let attempt = 0;
  const maxRetries = config.dlq.maxRetries;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      attempt++;
      await routeEvent(channel, event);
      // Mark as processed upon success
      await markEventProcessed(eventId);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[Event Retry Warning] Attempt ${attempt}/${maxRetries} failed for ${eventId}: ${err.message}`);

      if (attempt < maxRetries) {
        const backoffMs = config.dlq.retryBackoffMs * Math.pow(2, attempt - 1);
        await sleep(backoffMs);
      }
    }
  }

  // 3. Max retries exceeded -> Push to Dead-Letter Queue (DLQ)
  await pushToDLQ({
    eventName: `${channel}:${event.type || 'UNKNOWN'}`,
    payload: event,
    error: lastError,
    retryCount: attempt,
  });
}

/**
 * Start Redis Pub/Sub Consumer
 */
export async function startEventConsumer() {
  try {
    await subscriberRedis.subscribe(...CHANNELS_TO_SUBSCRIBE);
    console.log(`✓ Notification Event Consumer subscribed to channels: [${CHANNELS_TO_SUBSCRIBE.join(', ')}]`);

    subscriberRedis.on('message', (channel, message) => {
      // Non-blocking processing
      processEventWithResilience(channel, message).catch((err) => {
        console.error(`[Unhandled Consumer Error] Channel ${channel}:`, err);
      });
    });
  } catch (err) {
    console.error('✗ Failed to initialize Notification Event Consumer:', err.message);
  }
}

/**
 * Stop Event Consumer
 */
export async function stopEventConsumer() {
  try {
    await subscriberRedis.unsubscribe(...CHANNELS_TO_SUBSCRIBE);
    console.log('✓ Notification Event Consumer unsubscribed cleanly.');
  } catch (err) {
    console.warn('Warning during event consumer shutdown:', err.message);
  }
}
