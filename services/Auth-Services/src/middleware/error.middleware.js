/**
 * Custom application error with HTTP status code
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Central Express error handling middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Only log detailed stack traces in non-production or for 500s
  if (statusCode >= 500) {
    console.error(`💥 [${req.method} ${req.originalUrl}] 500 Error:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}
