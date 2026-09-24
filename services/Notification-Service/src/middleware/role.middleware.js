import { AppError } from '../utils/app-error.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: requires one of [${allowedRoles.join(', ')}] roles.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
