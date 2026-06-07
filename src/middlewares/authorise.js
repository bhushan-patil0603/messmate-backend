const AppError = require('../utils/AppError');

/**
 * authorise(...roles)
 *
 * Factory that returns a middleware allowing only users whose
 * role is in the provided list.
 *
 * Must be used AFTER authenticate().
 *
 * Usage:
 *   router.patch('/approve', authenticate, authorise('ADMIN'), controller);
 *   router.get('/profile',   authenticate, authorise('ADMIN','MEMBER'), controller);
 */
const authorise = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return next(
      new AppError(
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.userRole || 'none'}.`,
        403,
      ),
    );
  }
  next();
};

module.exports = authorise;