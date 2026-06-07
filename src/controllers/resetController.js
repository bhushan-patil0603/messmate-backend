'use strict';

const resetService = require('../services/resetService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/reset-day
 * ADMIN only
 *
 * Manually triggers the daily reset:
 *   - Sets lunch_used_today = false for all ACTIVE members
 *   - Sets dinner_used_today = false for all ACTIVE members
 *   - Marks any ACTIVE members past their end_date as EXPIRED
 *   - Writes a ResetLog entry with triggeredBy = MANUAL
 *
 * Body (optional): { notes: string }
 */
const resetDay = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const result = await resetService.performReset('MANUAL', notes || null);

  res.status(200).json({
    status:  'success',
    message: `Daily reset complete. ${result.membersAffected} member(s) reset${
      result.expiredCount > 0
        ? `, ${result.expiredCount} member(s) marked as EXPIRED`
        : ''
    }.`,
    data: {
      members_affected: result.membersAffected,
      expired_count:    result.expiredCount,
      reset_log:        result.resetLog,
    },
  });
});

/**
 * GET /api/v1/reset-logs
 * ADMIN only
 *
 * Returns paginated history of all reset events (manual + scheduler).
 * Query: ?page=1&limit=20
 */
const getResetLogs = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await resetService.getResetLogs({ page, limit });

  res.status(200).json({
    status: 'success',
    data:   result,
  });
});

module.exports = { resetDay, getResetLogs };