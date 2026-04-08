/**
 * Request Validation Middleware Factory
 *
 * Creates Express middleware that validates req.body using a validator function.
 * Uses the Chain of Responsibility concept — if validation fails, the chain stops.
 *
 * @param {Function} validatorFn - function(data) => { valid, errors }
 * @returns {Function} Express middleware
 */
function validateRequest(validatorFn) {
  return (req, res, next) => {
    const { valid, errors } = validatorFn(req.body);
    if (!valid) {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.errors = errors;
      err.status = 400;
      return next(err);
    }
    next();
  };
}

module.exports = validateRequest;
