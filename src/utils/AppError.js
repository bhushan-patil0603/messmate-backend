/**
 * Typed operational error class.
 * Throw this anywhere in the app — the global error handler catches it
 * and formats it into a consistent JSON response.
 *
 * Usage:
 *   throw new AppError('Member not found', 404);
 *   throw new AppError('Token balance is zero', 422);
 */
class AppError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode  = statusCode;
    this.status      = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;  // distinguishes from unexpected programmer errors
    this.errors      = errors;  // optional array of validation error details

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;