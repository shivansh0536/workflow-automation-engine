/**
 * Async Handler — eliminates repetitive try/catch in controllers.
 * Wraps an async route handler and forwards errors to Express error middleware.
 *
 * @param {Function} fn - async (req, res, next) => ...
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
