/**
 * Middleware factory to validate request body using Zod schemas
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed for request data',
          details: formattedErrors,
        },
      });
    }

    req.body = result.data;
    next();
  };
}
