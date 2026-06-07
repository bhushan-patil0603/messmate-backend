const { Op }                 = require('sequelize');
const { Member, MealLog }    = require('../models');
const { generateMemberUid }  = require('../utils/idGenerator');
const { hashPassword }       = require('../utils/hash');
const AppError               = require('../utils/AppError');

// ── Default initial password assigned to a member on approval ────────────────
const DEFAULT_INITIAL_PASSWORD = 'Member@123';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * createMemberRequest
 *
 * Submitted by admin when a new person wants to join the mess.
 * Status is set to PENDING. No UID or password yet.
 *
 * Business rules:
 *   FR-01-BR1: totalTokens = days × 2
 *   FR-01-BR2: endDate     = startDate + (days - 1)
 *   FR-01-BR3: All mandatory fields validated upstream
 *   FR-01-BR4: Status = PENDING on creation
 */
async function createMemberRequest(data) {
  const { name, days, start_date } = data;

  // Calculate tokens and end date
  const totalTokens = days * 2;

  const startDateObj = new Date(start_date);
  const endDateObj   = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + days - 1);
  const end_date = endDateObj.toISOString().split('T')[0];

  const member = await Member.create({
    name,
    days,
    total_tokens:     totalTokens,
    remaining_tokens: totalTokens,
    start_date,
    end_date,
    status:            'PENDING',
    lunch_used_today:  false,
    dinner_used_today: false,
  });

  return member;
}

/**
 * listMembers
 *
 * Returns a paginated list of members filtered by status.
 * Default: returns all statuses if none specified.
 *
 * @param {object} options - { status, page, limit }
 */
async function listMembers({ status, page = 1, limit = 20 } = {}) {
  const where  = {};
  if (status) where.status = status;

  const offset = (page - 1) * limit;

  const { count, rows } = await Member.findAndCountAll({
    where,
    order:      [['created_at', 'DESC']],
    limit:      parseInt(limit, 10),
    offset,
    attributes: { exclude: ['password_hash'] },
  });

  return {
    members:    rows,
    pagination: {
      total:        count,
      page:         parseInt(page, 10),
      limit:        parseInt(limit, 10),
      total_pages:  Math.ceil(count / limit),
    },
  };
}

/**
 * getMemberById
 *
 * Fetches a single member by internal UUID.
 * Includes warning flags (low token / near expiry).
 *
 * @param {string} id  - UUID
 */
async function getMemberById(id) {
  const member = await Member.findByPk(id, {
    attributes: { exclude: ['password_hash'] },
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  return {
    ...member.toJSON(),
    warnings: member.getWarnings(),
  };
}

/**
 * approveMember
 *
 * Admin approves a PENDING member request.
 *
 * Steps:
 *  1. Verify member exists and is PENDING
 *  2. Generate unique MBR-XXXX ID
 *  3. Hash the initial password (custom or default)
 *  4. Set status = ACTIVE, approvedAt = now
 *
 * The member can now log in with member_uid + initial_password.
 */
async function approveMember(id, initialPassword) {
  const member = await Member.findByPk(id);

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.status !== 'PENDING') {
    throw new AppError(
      `Cannot approve a member with status "${member.status}". Only PENDING members can be approved.`,
      409,
    );
  }

  // Generate unique readable ID
  const member_uid = await generateMemberUid();

  // Set a login password — admin can pass a custom one or fall back to default
  const plainPassword = initialPassword || DEFAULT_INITIAL_PASSWORD;
  const password_hash = await hashPassword(plainPassword);

  await member.update({
    member_uid,
    password_hash,
    status:      'ACTIVE',
    approved_at: new Date(),
  });

  // Return safe object (no password_hash)
  const { password_hash: _omit, ...safeData } = member.toJSON();

  return {
    ...safeData,
    warnings:         member.getWarnings(),
    initial_password: plainPassword, // returned ONCE so admin can hand it to the member
  };
}

/**
 * declineMember
 *
 * Admin declines a PENDING member request.
 * The record is kept in DB with status = DECLINED (audit trail).
 */
async function declineMember(id) {
  const member = await Member.findByPk(id);

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.status !== 'PENDING') {
    throw new AppError(
      `Cannot decline a member with status "${member.status}". Only PENDING members can be declined.`,
      409,
    );
  }

  await member.update({ status: 'DECLINED' });

  const { password_hash: _omit, ...safeData } = member.toJSON();
  return safeData;
}

/**
 * getMemberProfile
 *
 * Used by a logged-in MEMBER to view their own profile.
 * Includes token balance, meal flags, and warning state.
 *
 * @param {string} memberId  - UUID from req.user.id
 */
async function getMemberProfile(memberId) {
  const member = await Member.findByPk(memberId, {
    attributes: { exclude: ['password_hash'] },
    include: [{
      model:      MealLog,
      as:         'mealLogs',
      limit:      10,
      order:      [['date', 'DESC'], ['marked_at', 'DESC']],
      attributes: ['meal_type', 'date', 'marked_at', 'tokens_after'],
    }],
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  return {
    ...member.toJSON(),
    warnings:      member.getWarnings(),
    days_remaining: member.daysUntilExpiry(),
  };
}

/**
 * getActiveMembers
 *
 * Convenience wrapper — returns all ACTIVE members with warning flags.
 * Used internally by the reset job and meal service.
 */
async function getActiveMembers() {
  const members = await Member.findAll({
    where:      { status: 'ACTIVE' },
    attributes: { exclude: ['password_hash'] },
    order:      [['name', 'ASC']],
  });

  return members.map((m) => ({
    ...m.toJSON(),
    warnings: m.getWarnings(),
  }));
}

module.exports = {
  createMemberRequest,
  listMembers,
  getMemberById,
  approveMember,
  declineMember,
  getMemberProfile,
  getActiveMembers,
  DEFAULT_INITIAL_PASSWORD,
};