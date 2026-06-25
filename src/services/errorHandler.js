const { errorResponse } = require('../utils/responce');

/**
 * Global Exception Handler Middleware
 * Catches all runtime errors and mongoose failures to return uniform JSON error responses.
 */
const errorHandler = (err, req, res, next) => {
  // Log the detailed stack trace to console for development/logging
  console.error('[ERROR STACK]', err);

  // Handle Mongoose schema validation failures
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(item => item.message);
    return errorResponse(res, 400, 'Validation failed for model fields', validationErrors);
  }

  // Handle Mongoose CastError (e.g., passing invalid Hex IDs for ObjectId fields)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, `Malformed identifier path format for field: ${err.path}`);
  }

  // Handle MongoDB Duplicate Key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, 400, `A record with this ${field} already exists.`);
  }

  // General server exception fallback
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, statusCode, message);
};

module.exports = errorHandler;
