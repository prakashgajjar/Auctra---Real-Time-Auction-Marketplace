import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { isTokenBlacklisted } from '../redis/client.js';
import prisma from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token has expired. Please refresh your token.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }

    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      throw new AppError('Token has been revoked. Please log in again.', 401, 'TOKEN_REVOKED');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        sellerProfile: {
          select: {
            id: true,
            storeName: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User account associated with this token does not exist.', 401, 'USER_NOT_FOUND');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new AppError(`Your account has been ${user.status.toLowerCase()}. Access restricted.`, 403, 'ACCOUNT_RESTRICTED');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: attaches user if token is provided, proceeds anonymously otherwise
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.sub },
      select: { id: true, email: true, username: true, role: true, status: true },
    });

    if (user && user.status !== 'BANNED' && user.status !== 'SUSPENDED') {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}
