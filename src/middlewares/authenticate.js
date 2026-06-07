const { verifyToken } = require('../utils/jwt');
const AppError        = require('../utils/AppError');
const asyncHandler    = require('../utils/asyncHandler');
const { Admin, Member } = require('../models');

/**
 * authenticate
 *
 * Reads the Bearer token from the Authorization header,
 * verifies it, looks up the user from the DB, and attaches
 * the full user record to req.user.
 *
 * Must run before any authorise() middleware.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // 1. Extract token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No authentication token provided. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Malformed authorization header.', 401);
  }

  // 2. Verify signature + expiry
  const decoded = verifyToken(token);

  // 3. Fetch the actual user from DB to ensure they still exist and are active
  let currentUser;

  if (decoded.role === 'ADMIN') {
    currentUser = await Admin.findOne({
      where: { id: decoded.id, is_active: true },
    });
  } else if (decoded.role === 'MEMBER') {
    currentUser = await Member.findOne({
      where: { id: decoded.id, status: 'ACTIVE' },
    });
  }

  if (!currentUser) {
    throw new AppError(
      'The account associated with this token no longer exists or is inactive.',
      401,
    );
  }

  // 4. Attach user + role to request
  req.user     = currentUser;
  req.userRole = decoded.role;

  next();
});

module.exports = authenticate;