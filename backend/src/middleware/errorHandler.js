/**
 * Structured Error Handler Middleware
 *
 * Centralizes error response formatting for the entire API.
 * Handles Prisma errors, validation errors, and generic errors.
 */
const { createLogger } = require('../utils/logger');

const logger = createLogger('ErrorHandler');

/**
 * Map Prisma error codes to HTTP status codes and messages.
 */
const PRISMA_ERRORS = {
  P2002: { status: 400, message: 'A record with that unique field already exists' },
  P2025: { status: 404, message: 'Record not found' },
  P2003: { status: 400, message: 'Foreign key constraint failed' },
  P2014: { status: 400, message: 'Relation violation' },
};

/**
 * Express error-handling middleware.
 */
function errorHandler(err, _req, res, _next) {
  logger.error(err.message, {
    code:  err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Prisma errors
  if (err.code && PRISMA_ERRORS[err.code]) {
    const { status, message } = PRISMA_ERRORS[err.code];
    return res.status(status).json({
      error:   message,
      details: err.meta?.target || err.meta?.cause || undefined,
    });
  }

  // Validation errors (from our validators)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error:  'Validation failed',
      errors: err.errors || [err.message],
    });
  }

  // Generic errors with status
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error:   err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
