const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responce');

/**
 * Validation Request Handler Middleware
 * Checks express-validator results. If validations fail, blocks the chain and returns a structured 400 error.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Map array of validation errors to standard formatting
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      value: err.value,
      message: err.msg
    }));
    
    return errorResponse(res, 400, 'Invalid request payload inputs', formattedErrors);
  }
  next();
};

module.exports = validateRequest;
