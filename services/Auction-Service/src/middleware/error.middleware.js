import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { errorResponse } from '../utils/api-response.js';

export function errorHandler(err, req, res, next) {
  // Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
  }

  // Known App Operational Error
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  // Prisma Unique Constraint Error
  if (err.code === 'P2002') {
    const fields = err.meta?.target || ['field'];
    return errorResponse(
      res,
      `A record with this ${fields.join(', ')} already exists.`,
      409,
      'CONFLICT_ERROR'
    );
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return errorResponse(res, 'Requested resource not found.', 404, 'NOT_FOUND');
  }

  // Unhandled / Internal Server Error
  console.error('Unhandled Application Error in Auction Service:', err);
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
}
