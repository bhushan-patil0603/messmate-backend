const memberService = require('../services/memberService');
const asyncHandler  = require('../utils/asyncHandler');

/**
 * POST /api/v1/members
 * ADMIN only
 * Submit a new member request (status = PENDING)
 */
const createMember = asyncHandler(async (req, res) => {
  const { name, days, start_date, initial_password } = req.body;

  const member = await memberService.createMemberRequest({
    name,
    days: parseInt(days, 10),
    start_date,
    initial_password,
  });

  res.status(201).json({
    status:  'success',
    message: 'Member request submitted successfully',
    data:    { member },
  });
});

/**
 * GET /api/v1/members
 * ADMIN only
 * List members, optionally filtered by status + paginated
 * Query: ?status=PENDING|ACTIVE|DECLINED|EXPIRED&page=1&limit=20
 */
const listMembers = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;

  const result = await memberService.listMembers({ status, page, limit });

  res.status(200).json({
    status: 'success',
    data:   result,
  });
});

/**
 * GET /api/v1/members/:id
 * ADMIN only
 * Get a single member's full details including warning flags
 */
const getMember = asyncHandler(async (req, res) => {
  const member = await memberService.getMemberById(req.params.id);

  res.status(200).json({
    status: 'success',
    data:   { member },
  });
});

/**
 * PATCH /api/v1/members/:id/approve
 * ADMIN only
 * Approve a PENDING member — assigns MBR-XXXX ID, sets ACTIVE,
 * hashes and stores initial password
 * Body (optional): { initial_password: string }
 */
const approveMember = asyncHandler(async (req, res) => {
  const { initial_password } = req.body;

  const member = await memberService.approveMember(
    req.params.id,
    initial_password,
  );

  res.status(200).json({
    status:  'success',
    message: `Member approved. Their login ID is ${member.member_uid}.`,
    data:    { member },
  });
});

/**
 * PATCH /api/v1/members/:id/decline
 * ADMIN only
 * Decline a PENDING member request
 */
const declineMember = asyncHandler(async (req, res) => {
  const member = await memberService.declineMember(req.params.id);

  res.status(200).json({
    status:  'success',
    message: 'Member request declined',
    data:    { member },
  });
});

/**
 * GET /api/v1/members/me
 * MEMBER only
 * Logged-in member views their own profile, token balance,
 * recent meal history, and warning state
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await memberService.getMemberProfile(req.user.id);

  res.status(200).json({
    status: 'success',
    data:   { member: profile },
  });
});

module.exports = {
  createMember,
  listMembers,
  getMember,
  approveMember,
  declineMember,
  getMyProfile,
};