/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Additional data to include in response
 */
const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error description message
 * @param {Object|Array|null} errors - Structured validation/operational errors
 */
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
