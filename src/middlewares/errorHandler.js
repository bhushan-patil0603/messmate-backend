const logger   = require('../utils/logger');
const AppError = require('../utils/AppError');

// ── Sequelize-specific error translators ─────────────────────────────────────

function handleSequelizeValidationError(err) {
  const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  return new AppError('Validation failed', 400, errors);
}

function handleSequelizeUniqueConstraint(err) {
  const field = err.errors?.[0]?.path || 'field';
  return new AppError(`Duplicate value for ${field}`, 409);
}

function handleSequelizeForeignKey() {
  return new AppError('Referenced record does not exist', 400);
}

// ── JWT error translators ─────────────────────────────────────────────────────

function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Token has expired. Please log in again.', 401);
}

// ── Send responses ────────────────────────────────────────────────────────────

function sendDevError(err, res) {
  res.status(err.statusCode).json({
    status:  err.status,
    message: err.message,
    errors:  err.errors || [],
    stack:   err.stack,
  });
}

function sendProdError(err, res) {
  if (err.isOperational) {
    // Known, safe-to-expose errors
    return res.status(err.statusCode).json({
      status:  err.status,
      message: err.message,
      errors:  err.errors || [],
    });
  }
  // Unknown / programmer errors — don't leak details
  logger.error('UNEXPECTED ERROR:', err);
  return res.status(500).json({
    status:  'error',
    message: 'Something went wrong. Please try again later.',
  });
}

// ── Global error handler (must have 4 params) ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    logger.error(err.message, { stack: err.stack });
    return sendDevError(err, res);
  }

  // Translate known library errors to AppErrors in production
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name  === 'SequelizeValidationError')    error = handleSequelizeValidationError(err);
  if (err.name  === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueConstraint(err);
  if (err.name  === 'SequelizeForeignKeyConstraintError') error = handleSequelizeForeignKey();
  if (err.name  === 'JsonWebTokenError')           error = handleJWTError();
  if (err.name  === 'TokenExpiredError')           error = handleJWTExpiredError();

  sendProdError(error, res);
};