const authService  = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/auth/admin/login
 * Body: { email, password }
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.adminLogin(email, password);

  res.status(200).json({
    status:  'success',
    message: 'Admin logged in successfully',
    data:    result,
  });
});

/**
 * POST /api/v1/auth/member/login
 * Body: { member_uid, password }
 */
const memberLogin = asyncHandler(async (req, res) => {
  const { member_uid, password } = req.body;

  const result = await authService.memberLogin(member_uid, password);

  res.status(200).json({
    status:  'success',
    message: 'Member logged in successfully',
    data:    result,
  });
});

/**
 * GET /api/v1/auth/me
 * Protected: authenticate required
 * Returns the currently logged-in user's profile
 */
const getMe = asyncHandler(async (req, res) => {
  const profile = authService.getMe(req.user, req.userRole);

  res.status(200).json({
    status: 'success',
    data:   { user: profile },
  });
});

module.exports = { adminLogin, memberLogin, getMe };