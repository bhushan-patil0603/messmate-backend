const express      = require('express');
const authController = require('../controllers/authController');
const { adminLoginValidators, memberLoginValidators } = require('../validators/authValidators');
const validate     = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

/**
 * POST /api/v1/auth/admin/login
 * Public — stricter rate limit applied
 * Body: { email: string, password: string }
 * Returns: { token, user: AdminObject }
 */
router.post(
  '/admin/login',
  authLimiter,
  adminLoginValidators,
  validate,
  authController.adminLogin,
);

/**
 * POST /api/v1/auth/member/login
 * Public — stricter rate limit applied
 * Body: { member_uid: "MBR-XXXX", password: string }
 * Returns: { token, user: MemberObject }
 */
router.post(
  '/member/login',
  authLimiter,
  memberLoginValidators,
  validate,
  authController.memberLogin,
);

/**
 * GET /api/v1/auth/me
 * Protected — requires valid JWT (any role)
 * Returns the currently authenticated user's profile
 */
router.get(
  '/me',
  authenticate,
  authController.getMe,
);

module.exports = router;