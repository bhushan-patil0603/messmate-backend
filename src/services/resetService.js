'use strict';

const { Op }              = require('sequelize');
const sequelize           = require('../config/sequelize');
const { Member, ResetLog } = require('../models');
const logger              = require('../utils/logger');

/**
 * performReset
 *
 * Single function called by BOTH the manual endpoint AND the cron scheduler.
 * Abstracts all reset logic so neither caller duplicates it.
 *
 * Steps (from RGD FR-04):
 *   1. Find all ACTIVE members
 *   2. Set lunch_used_today = false, dinner_used_today = false for all of them
 *   3. Mark any ACTIVE members whose end_date has passed as EXPIRED
 *   4. Write a ResetLog entry with triggeredBy, timestamp, and count
 *
 * Business rules enforced:
 *   FR-04-BR1: Re-enables Lunch and Dinner for all ACTIVE members
 *   FR-04-BR2: Does NOT restore tokens
 *   FR-04-BR3: Members with 0 tokens still have buttons reset (re-enable)
 *              but remain at 0 tokens — controller/frontend disables them again
 *   FR-04-BR4: Every reset is logged with a timestamp
 *
 * @param {'MANUAL' | 'SCHEDULER'} triggeredBy
 * @param {string}  [notes]   - Optional note to store in the log
 * @returns {Promise<{ membersAffected: number, expiredCount: number, resetLog: object }>}
 */
async function performReset(triggeredBy, notes = null) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return sequelize.transaction(async (t) => {
    // ── Step 1: Expire members whose end_date has passed ──────────────────────
    const [expiredCount] = await Member.update(
      { status: 'EXPIRED' },
      {
        where: {
          status:   'ACTIVE',
          end_date: { [Op.lt]: today },  // end_date strictly before today
        },
        transaction: t,
      },
    );

    if (expiredCount > 0) {
      logger.info(`Daily reset: ${expiredCount} member(s) marked as EXPIRED`);
    }

    // ── Step 2: Reset daily meal flags for remaining ACTIVE members ───────────
    const [membersAffected] = await Member.update(
      {
        lunch_used_today:  false,
        dinner_used_today: false,
      },
      {
        where:       { status: 'ACTIVE' },
        transaction: t,
      },
    );

    // ── Step 3: Write ResetLog ────────────────────────────────────────────────
    const resetLog = await ResetLog.create(
      {
        triggered_by:     triggeredBy,
        reset_at:         new Date(),
        members_affected: membersAffected,
        notes: notes || (expiredCount > 0
          ? `${expiredCount} member(s) expired; ${membersAffected} meal flag(s) reset`
          : null),
      },
      { transaction: t },
    );

    logger.info(
      `Daily reset [${triggeredBy}]: ${membersAffected} member(s) reset, ` +
      `${expiredCount} expired. Log ID: ${resetLog.id}`,
    );

    return {
      membersAffected,
      expiredCount,
      resetLog: resetLog.toJSON(),
    };
  });
}

/**
 * getResetLogs
 *
 * Returns paginated reset history for admin review.
 *
 * @param {object} options - { page, limit }
 */
async function getResetLogs({ page = 1, limit = 20 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await ResetLog.findAndCountAll({
    order:  [['reset_at', 'DESC']],
    limit:  Number(limit),
    offset,
  });

  return {
    reset_logs: rows,
    pagination: {
      total:       count,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(count / Number(limit)),
    },
  };
}

module.exports = { performReset, getResetLogs };