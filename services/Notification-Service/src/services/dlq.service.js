import { v4 as uuidv4 } from 'uuid';
import redis from '../redis/client.js';

const DLQ_LIST_KEY = 'notif:dlq:list';
const DLQ_RECORD_PREFIX = 'notif:dlq:record:';

/**
 * Record a failed event into Dead-Letter Queue (DLQ)
 */
export async function pushToDLQ({ eventName, payload, error, retryCount = 3 }) {
  const dlqId = uuidv4();
  const record = {
    id: dlqId,
    eventName,
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    error: error?.message || String(error),
    stack: error?.stack || '',
    retryCount: String(retryCount),
    status: 'PENDING_INSPECTION',
    failedAt: new Date().toISOString(),
  };

  try {
    const pipeline = redis.pipeline();
    pipeline.hset(`${DLQ_RECORD_PREFIX}${dlqId}`, record);
    pipeline.lpush(DLQ_LIST_KEY, dlqId);
    // Keep max 5000 records in DLQ list
    pipeline.ltrim(DLQ_LIST_KEY, 0, 4999);
    await pipeline.exec();

    console.error(`🚨 [DLQ RECORDED] Event "${eventName}" pushed to DLQ (ID: ${dlqId}). Error: ${record.error}`);
    return { id: dlqId, ...record };
  } catch (err) {
    console.error(`💥 [CRITICAL] Failed to write event to DLQ:`, err.message);
    return null;
  }
}

/**
 * List DLQ records (paginated)
 */
export async function listDLQ({ page = 1, limit = 20 } = {}) {
  const start = (page - 1) * limit;
  const stop = start + limit - 1;

  try {
    const [total, ids] = await Promise.all([
      redis.llen(DLQ_LIST_KEY),
      redis.lrange(DLQ_LIST_KEY, start, stop),
    ]);

    if (!ids || ids.length === 0) {
      return { total: total || 0, page, limit, records: [] };
    }

    const pipeline = redis.pipeline();
    for (const id of ids) {
      pipeline.hgetall(`${DLQ_RECORD_PREFIX}${id}`);
    }
    const results = await pipeline.exec();

    const records = results
      .map(([err, data]) => {
        if (err || !data || !data.id) return null;
        try {
          return {
            ...data,
            payload: JSON.parse(data.payload),
          };
        } catch {
          return data;
        }
      })
      .filter(Boolean);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      records,
    };
  } catch (err) {
    console.warn(`[DLQ List Error]:`, err.message);
    return { total: 0, page, limit, totalPages: 0, records: [] };
  }
}

/**
 * Get DLQ Record by ID
 */
export async function getDLQRecord(dlqId) {
  try {
    const record = await redis.hgetall(`${DLQ_RECORD_PREFIX}${dlqId}`);
    if (!record || !record.id) return null;
    try {
      record.payload = JSON.parse(record.payload);
    } catch {
      // raw payload
    }
    return record;
  } catch (err) {
    console.warn(`[DLQ Fetch Error] ${dlqId}:`, err.message);
    return null;
  }
}

/**
 * Remove record from DLQ
 */
export async function removeDLQRecord(dlqId) {
  try {
    const pipeline = redis.pipeline();
    pipeline.del(`${DLQ_RECORD_PREFIX}${dlqId}`);
    pipeline.lrem(DLQ_LIST_KEY, 0, dlqId);
    await pipeline.exec();
    return true;
  } catch (err) {
    console.warn(`[DLQ Remove Error] ${dlqId}:`, err.message);
    return false;
  }
}

/**
 * Purge entire DLQ
 */
export async function purgeDLQ() {
  try {
    const ids = await redis.lrange(DLQ_LIST_KEY, 0, -1);
    if (ids && ids.length > 0) {
      const keys = ids.map((id) => `${DLQ_RECORD_PREFIX}${id}`);
      await redis.del(...keys, DLQ_LIST_KEY);
    } else {
      await redis.del(DLQ_LIST_KEY);
    }
    return { cleared: ids ? ids.length : 0 };
  } catch (err) {
    console.warn(`[DLQ Purge Error]:`, err.message);
    return { cleared: 0 };
  }
}

/**
 * DLQ Statistics
 */
export async function getDLQStats() {
  try {
    const total = await redis.llen(DLQ_LIST_KEY);
    return {
      pendingDlqCount: total || 0,
      status: total > 0 ? 'DEGRADED_EVENTS_PRESENT' : 'CLEAN',
    };
  } catch (err) {
    return { pendingDlqCount: 0, status: 'UNKNOWN' };
  }
}
