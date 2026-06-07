'use strict';

const { Op }                   = require('sequelize');
const sequelize                = require('../config/sequelize');
const { Member, MealLog }      = require('../models');
const { evaluateWarnings }     = require('./warningService');
const AppError                 = require('../utils/AppError');

/**
 * markMeal
 *
 * Core business logic for marking a LUNCH or DINNER for an active member.
 *
 * Business rules enforced (from RGD FR-03):
 *   FR-03-BR1: Member must be ACTIVE
 *   FR-03-BR2/BR3: Checking lunchUsedToday / dinnerUsedToday before marking
 *   FR-03-BR4: Token balance updates immediately (real-time)
 *   FR-03-BR5: Lunch and Dinner are independent
 *   FR-03-BR6: If tokens = 0, meal cannot be marked
 *   AC-08: Double-marking returns 409 Conflict
 *
 * Uses a DB transaction so token decrement + flag update + MealLog
 * creation are fully atomic — no partial writes possible.
 *
 * @param {string} memberId  - Member UUID
 * @param {string} mealType  - 'LUNCH' | 'DINNER'
 * @returns {object}         - Updated member snapshot + warning state
 */
async function markMeal(memberId, mealType) {
  // ── 1. Fetch the member ────────────────────────────────────────────────────
  const member = await Member.findByPk(memberId);

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // ── 2. Member must be ACTIVE ───────────────────────────────────────────────
  if (member.status !== 'ACTIVE') {
    throw new AppError(
      `Cannot mark meal for a member with status "${member.status}". Member must be ACTIVE.`,
      422,
    );
  }

  // ── 3. Check tokens available ──────────────────────────────────────────────
  if (member.remaining_tokens <= 0) {
    throw new AppError(
      'Token balance is zero. No more meals can be marked for this member.',
      422,
    );
  }

  // ── 4. Check same-day duplicate (application-level guard) ─────────────────
  //    The DB unique index is the safety net; this gives a cleaner error message
  const flagField = mealType === 'LUNCH' ? 'lunch_used_today' : 'dinner_used_today';

  if (member[flagField]) {
    throw new AppError(
      `${mealType} has already been marked for this member today.`,
      409,
    );
  }

  // ── 5. Atomic transaction: decrement token + set flag + create log ─────────
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const updatedMember = await sequelize.transaction(async (t) => {
    // a. Decrement remaining_tokens and set the daily flag
    const updateFields = {
      remaining_tokens: member.remaining_tokens - 1,
      [flagField]:      true,
    };

    await member.update(updateFields, { transaction: t });

    // b. Create an immutable MealLog entry for audit
    await MealLog.create(
      {
        member_id:    memberId,
        meal_type:    mealType,
        date:         today,
        marked_at:    new Date(),
        tokens_after: member.remaining_tokens - 1,
      },
      { transaction: t },
    );

    return member; // already updated in-place by Sequelize
  });

  // ── 6. Build and return response ───────────────────────────────────────────
  const { password_hash: _omit, ...safeData } = updatedMember.toJSON();

  return {
    ...safeData,
    meal_marked:  mealType,
    date:         today,
    warning:      evaluateWarnings(updatedMember),
  };
}

/**
 * getMealHistory
 *
 * Returns paginated meal logs for a specific member.
 * Accessible by ADMIN (any member) and MEMBER (own records only — enforced in controller).
 *
 * @param {string} memberId
 * @param {object} options  - { page, limit, date }
 */
async function getMealHistory(memberId, { page = 1, limit = 20, date } = {}) {
  // Verify member exists
  const member = await Member.findByPk(memberId, {
    attributes: ['id', 'name', 'member_uid', 'remaining_tokens', 'status'],
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const where = { member_id: memberId };
  if (date) where.date = date;

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await MealLog.findAndCountAll({
    where,
    order:  [['date', 'DESC'], ['marked_at', 'DESC']],
    limit:  Number(limit),
    offset,
  });

  return {
    member: {
      id:               member.id,
      name:             member.name,
      member_uid:       member.member_uid,
      remaining_tokens: member.remaining_tokens,
      status:           member.status,
    },
    meal_logs:  rows,
    pagination: {
      total:       count,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(count / Number(limit)),
    },
  };
}

/**
 * getDailyMealSummary
 *
 * Returns a summary of all meal marks for a given date (defaults to today).
 * Admin-only. Useful for the owner to see at a glance who ate what.
 *
 * @param {string} date  - YYYY-MM-DD (optional, defaults to today)
 */
async function getDailyMealSummary(date) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const logs = await MealLog.findAll({
    where:   { date: targetDate },
    include: [{
      model:      Member,
      as:         'member',
      attributes: ['id', 'name', 'member_uid', 'remaining_tokens'],
    }],
    order: [['marked_at', 'ASC']],
  });

  // Group by meal type for easy reading
  const lunch  = logs.filter((l) => l.meal_type === 'LUNCH');
  const dinner = logs.filter((l) => l.meal_type === 'DINNER');

  return {
    date:          targetDate,
    total_meals:   logs.length,
    lunch_count:   lunch.length,
    dinner_count:  dinner.length,
    lunch_members: lunch.map((l) => ({
      member_uid:   l.member?.member_uid,
      name:         l.member?.name,
      marked_at:    l.marked_at,
      tokens_after: l.tokens_after,
    })),
    dinner_members: dinner.map((l) => ({
      member_uid:   l.member?.member_uid,
      name:         l.member?.name,
      marked_at:    l.marked_at,
      tokens_after: l.tokens_after,
    })),
  };
}

module.exports = { markMeal, getMealHistory, getDailyMealSummary };