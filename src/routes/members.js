const express            = require('express');
const memberController   = require('../controllers/memberController');
const authenticate       = require('../middlewares/authenticate');
const authorise          = require('../middlewares/authorise');
const validate           = require('../middlewares/validate');
const {
  createMemberValidators,
  approveMemberValidators,
  declineMemberValidators,
  listMembersValidators,
  getMemberValidators,
} = require('../validators/memberValidators');

const router = express.Router();

// All member routes require authentication
router.use(authenticate);

// ── MEMBER-only routes (must come before /:id routes to avoid param clash) ───

/**
 * GET /api/v1/members/me
 * Member views their own profile + token balance + recent meals + warnings
 */
router.get(
  '/me',
  authorise('MEMBER'),
  memberController.getMyProfile,
);

// ── ADMIN-only routes ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/members
 * Admin submits a new member request (status = PENDING)
 * Body: { name, days, start_date, initial_password? }
 */
router.post(
  '/',
  authorise('ADMIN'),
  createMemberValidators,
  validate,
  memberController.createMember,
);

/**
 * GET /api/v1/members
 * Admin lists members filtered by status + paginated
 * Query: ?status=PENDING|ACTIVE|DECLINED|EXPIRED&page=1&limit=20
 */
router.get(
  '/',
  authorise('ADMIN'),
  listMembersValidators,
  validate,
  memberController.listMembers,
);

/**
 * GET /api/v1/members/:id
 * Admin gets single member details + warning flags
 */
router.get(
  '/:id',
  authorise('ADMIN'),
  getMemberValidators,
  validate,
  memberController.getMember,
);

/**
 * PATCH /api/v1/members/:id/approve
 * Admin approves a PENDING request
 * Assigns MBR-XXXX ID, hashes initial password, sets status = ACTIVE
 * Body (optional): { initial_password }
 */
router.patch(
  '/:id/approve',
  authorise('ADMIN'),
  approveMemberValidators,
  validate,
  memberController.approveMember,
);

/**
 * PATCH /api/v1/members/:id/decline
 * Admin declines a PENDING request (record kept for audit)
 */
router.patch(
  '/:id/decline',
  authorise('ADMIN'),
  declineMemberValidators,
  validate,
  memberController.declineMember,
);

module.exports = router;