'use strict';

const mealService  = require('../services/mealService');
const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');

/**
 * POST /api/v1/members/:id/meal
 * ADMIN only
 *
 * Marks LUNCH or DINNER for a member.
 * Deducts 1 token atomically.
 * Disables that meal button for the day.
 * Returns updated token balance + warning state.
 *
 * Body: { meal_type: "LUNCH" | "DINNER" }
 */
const markMeal = asyncHandler(async (req, res) => {
  const { id }        = req.params;
  const { meal_type } = req.body;

  const result = await mealService.markMeal(id, meal_type.toUpperCase());

  res.status(200).json({
    status:  'success',
    message: `${result.meal_marked} marked successfully for ${result.name}`,
    data:    { member: result },
  });
});

/**
 * GET /api/v1/members/:id/meals
 * ADMIN: can fetch any member's history
 * MEMBER: can only fetch their own history (enforced here)
 *
 * Query: ?page=1&limit=20&date=YYYY-MM-DD
 */
const getMealHistory = asyncHandler(async (req, res) => {
  const { id }              = req.params;
  const { page, limit, date } = req.query;

  // Members can only view their own meal history
  if (req.userRole === 'MEMBER' && req.user.id !== id) {
    throw new AppError('You can only view your own meal history.', 403);
  }

  const result = await mealService.getMealHistory(id, { page, limit, date });

  res.status(200).json({
    status: 'success',
    data:   result,
  });
});

/**
 * GET /api/v1/meals/summary
 * ADMIN only
 *
 * Returns a summary of all meal marks for a given date.
 * Query: ?date=YYYY-MM-DD  (defaults to today)
 */
const getDailyMealSummary = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const result = await mealService.getDailyMealSummary(date);

  res.status(200).json({
    status: 'success',
    data:   result,
  });
});

module.exports = { markMeal, getMealHistory, getDailyMealSummary };