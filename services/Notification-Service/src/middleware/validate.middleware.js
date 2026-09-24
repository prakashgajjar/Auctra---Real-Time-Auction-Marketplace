import { AppError } from '../utils/app-error.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = schema.parse(dataToValidate);

      if (source === 'body') req.body = validatedData;
      if (source === 'query') req.validatedQuery = validatedData;
      if (source === 'params') req.params = validatedData;

      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
      }
      next(err);
    }
  };
}
