const { errorResponse } = require('../utils/responce');

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR STACK]', err);

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(item => item.message);
    return errorResponse(res, 400, 'Validation failed for model fields', validationErrors);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, 400, `Malformed identifier path format for field: ${err.path}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, 400, `A record with this ${field} already exists.`);
  }

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, statusCode, message);
};

module.exports = errorHandler;
