const jwt      = require('jsonwebtoken');
const AppError = require('./AppError');

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

/**
 * Sign a JWT token.
 * @param {object} payload  - Data to encode (id, role, etc.)
 * @param {string} expiresIn - Override default expiry (optional)
 * @returns {string} signed JWT
 */
function signToken(payload, expiresIn = EXPIRES) {
  return jwt.sign(payload, SECRET, { expiresIn });
}

/**
 * Verify a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {AppError} 401 if invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid token. Please log in again.', 401);
  }
}

/**
 * Build the standard auth response payload.
 * Returns token + safe user object (no password_hash).
 */
function buildAuthResponse(user, role) {
  const payload = { id: user.id, role };

  // For members, also embed member_uid so front-end can display it
  if (role === 'MEMBER') {
    payload.member_uid = user.member_uid;
  }

  const token = signToken(payload);

  // Strip sensitive fields before sending
  const { password_hash, ...safeUser } = user.toJSON
    ? user.toJSON()
    : user;

  return { token, user: safeUser };
}

module.exports = { signToken, verifyToken, buildAuthResponse };