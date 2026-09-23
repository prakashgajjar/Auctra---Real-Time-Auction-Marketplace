import { errorResponse } from '../utils/api-response.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500) {
    console.error(`[Unhandled Bid-Service Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return errorResponse(res, message, statusCode, code, err.details || null);
}
