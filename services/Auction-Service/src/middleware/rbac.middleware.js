import { AppError } from '../utils/app-error.js';

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

export function requireVerifiedSeller(req, res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  }

  // Admins can manage any auction
  if (req.user.role === 'ADMIN' || req.user.role === 'MODERATOR') {
    return next();
  }

  if (req.user.role !== 'SELLER') {
    return next(
      new AppError(
        'Only registered sellers can create products and auctions. Please apply in Seller Hub.',
        403,
        'NOT_A_SELLER'
      )
    );
  }

  if (req.user.sellerProfile?.verificationStatus !== 'VERIFIED') {
    return next(
      new AppError(
        `Seller account verification is ${req.user.sellerProfile?.verificationStatus?.toLowerCase() || 'pending'}. You cannot list auctions until verified.`,
        403,
        'SELLER_NOT_VERIFIED'
      )
    );
  }

  next();
}
