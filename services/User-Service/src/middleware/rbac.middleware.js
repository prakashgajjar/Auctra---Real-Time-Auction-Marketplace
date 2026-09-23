import { AppError } from '../utils/app-error.js';
import prisma from '../prisma/client.js';

/**
 * Ensures user has one of the allowed roles
 * @param  {...string} allowedRoles e.g. 'ADMIN', 'MODERATOR', 'SELLER'
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

/**
 * Ensures the user has an active, verified SellerProfile
 */
export async function requireVerifiedSeller(req, res, next) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!sellerProfile) {
      throw new AppError('No seller profile found. Please register as a seller first.', 403, 'NOT_A_SELLER');
    }

    if (sellerProfile.verificationStatus !== 'VERIFIED') {
      throw new AppError(
        `Seller account verification is ${sellerProfile.verificationStatus.toLowerCase()}.`,
        403,
        'SELLER_NOT_VERIFIED'
      );
    }

    req.sellerProfile = sellerProfile;
    next();
  } catch (err) {
    next(err);
  }
}
