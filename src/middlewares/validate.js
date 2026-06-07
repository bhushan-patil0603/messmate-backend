const { validationResult } = require('express-validator');
const AppError             = require('../utils/AppError');

/**
 * validate
 *
 * Reads express-validator results.
 * If any errors exist, throws a 400 AppError with all field errors.
 * Place this after your validation chain in the route.
 *
 * Usage:
 *   router.post('/login', loginValidators, validate, controller);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field:   e.path || e.param,
      message: e.msg,
    }));
    return next(new AppError('Validation failed', 400, formatted));
  }
  next();
};

module.exports = validate;