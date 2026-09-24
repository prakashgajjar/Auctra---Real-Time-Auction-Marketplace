import redis from '../redis/client.js';

const DEFAULT_PREFERENCES = {
  email: {
    outbid: true,
    auctionWon: true,
    auctionStarted: true,
    endingSoon: true,
    payment: true,
    orderShipped: true,
    system: true,
  },
  inApp: {
    outbid: true,
    auctionWon: true,
    auctionStarted: true,
    endingSoon: true,
    bidPlaced: true,
    payment: true,
    orderShipped: true,
    system: true,
  },
};

const PREF_PREFIX = 'user:notif_prefs:';

export async function getUserPreferences(userId) {
  try {
    const cached = await redis.get(`${PREF_PREFIX}${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn(`[Preference Warning] Failed reading cache for ${userId}:`, err.message);
  }
  return DEFAULT_PREFERENCES;
}

export async function updateUserPreferences(userId, newPreferences) {
  const current = await getUserPreferences(userId);
  const updated = {
    email: {
      ...current.email,
      ...(newPreferences.email || {}),
    },
    inApp: {
      ...current.inApp,
      ...(newPreferences.inApp || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    await redis.set(`${PREF_PREFIX}${userId}`, JSON.stringify(updated), 'EX', 86400 * 30); // 30 days cache
  } catch (err) {
    console.warn(`[Preference Warning] Failed caching for ${userId}:`, err.message);
  }

  return updated;
}
