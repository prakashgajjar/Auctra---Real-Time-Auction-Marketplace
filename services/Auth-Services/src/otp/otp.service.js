import redis, { getJson, setJson } from '../redis/client.js';
import config from '../config/index.js';

const KEY_PREFIX = 'otp:';
const COOLDOWN_PREFIX = 'otp_cooldown:';

export function generateOtp() {
  const len = config.otp.length;
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function storeOtp(email, code) {
  const key = `${KEY_PREFIX}${email}`;
  const ttl = config.otp.expiryMinutes * 60;
  await setJson(key, { code, attempts: 0, createdAt: new Date().toISOString() }, ttl);
}

export async function verifyOtp(email, inputCode) {
  const key = `${KEY_PREFIX}${email}`;
  const maxAttempts = config.otp.maxAttempts;
  const stored = await getJson(key);

  if (!stored) {
    return { success: false, error: 'OTP has expired or does not exist. Please request a new one.' };
  }

  if (stored.attempts >= maxAttempts) {
    await redis.del(key);
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.', tooMany: true };
  }

  // Increment attempts
  stored.attempts += 1;
  const remainingTtl = await redis.ttl(key);
  if (remainingTtl > 0) {
    await setJson(key, stored, remainingTtl);
  }

  if (stored.code !== inputCode) {
    const remaining = maxAttempts - stored.attempts;
    return { success: false, error: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  // Valid — clean up
  await redis.del(key);
  return { success: true };
}

export async function canResendOtp(email) {
  const exists = await redis.exists(`${COOLDOWN_PREFIX}${email}`);
  return exists === 0;
}

export async function setResendCooldown(email) {
  await redis.setex(`${COOLDOWN_PREFIX}${email}`, config.otp.resendCooldownSeconds, '1');
}

export async function getResendCooldownRemaining(email) {
  const ttl = await redis.ttl(`${COOLDOWN_PREFIX}${email}`);
  return ttl > 0 ? ttl : 0;
}
