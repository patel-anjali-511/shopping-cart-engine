const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responce');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
