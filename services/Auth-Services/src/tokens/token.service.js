import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import prisma from '../prisma/client.js';
import { hashSha256 } from '../utils/hash.js';
import { blacklistToken, isTokenBlacklisted } from '../redis/client.js';

/**
 * Sign an Access Token (short-lived, e.g. 15m)
 */
export function generateAccessToken(payload) {
  const jti = uuidv4();
  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      jwtid: jti,
    }
  );
  return { token, jti };
}

/**
 * Sign a Refresh Token (long-lived, e.g. 7d)
 */
export function generateRefreshToken(payload) {
  const jti = uuidv4();
  const token = jwt.sign(
    {
      userId: payload.userId,
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
      jwtid: jti,
    }
  );
  return { token, jti };
}

/**
 * Create a new token pair and record the hashed refresh token in PostgreSQL
 */
export async function createSession(user, { ip, userAgent, deviceInfo } = {}) {
  const { token: accessToken } = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const { token: refreshToken } = generateRefreshToken({
    userId: user.id,
  });

  // Calculate expiration date (7 days default)
  const decodedRefresh = jwt.decode(refreshToken);
  const expiresAt = decodedRefresh?.exp
    ? new Date(decodedRefresh.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const tokenHash = hashSha256(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: ip || null,
      userAgent: userAgent || null,
      deviceInfo: deviceInfo || null,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiresIn,
  };
}

/**
 * Verify Access Token and ensure not blacklisted in Redis
 */
export async function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      return { valid: false, error: 'Token has been revoked', code: 'TOKEN_REVOKED' };
    }
    return { valid: true, payload: decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Access token expired', code: 'TOKEN_EXPIRED' };
    }
    return { valid: false, error: 'Invalid access token', code: 'TOKEN_INVALID' };
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    return { valid: true, payload: decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Refresh token expired', code: 'TOKEN_EXPIRED' };
    }
    return { valid: false, error: 'Invalid refresh token', code: 'TOKEN_INVALID' };
  }
}

/**
 * Revoke a single refresh token
 */
export async function revokeRefreshToken(token) {
  const tokenHash = hashSha256(token);
  return prisma.refreshToken.updateMany({
    where: { tokenHash, revoked: false },
    data: {
      revoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoke all active refresh tokens for a user (e.g. on logout-all or password reset)
 */
export async function revokeAllUserTokens(userId) {
  return prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: {
      revoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Blacklist an access token in Redis until its natural expiration
 */
export async function blacklistAccessToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.jti || !decoded.exp) return;

    const remainingSeconds = Math.max(1, Math.floor(decoded.exp - Date.now() / 1000));
    await blacklistToken(decoded.jti, remainingSeconds);
  } catch (err) {
    console.error('Failed to blacklist access token:', err);
  }
}
