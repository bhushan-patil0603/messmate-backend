'use strict';

const express          = require('express');
const mealController   = require('../controllers/mealController');
const authenticate     = require('../middlewares/authenticate');
const authorise        = require('../middlewares/authorise');
const validate         = require('../middlewares/validate');
const { mealMarkLimiter } = require('../middlewares/rateLimiter');
const {
  markMealValidators,
  mealHistoryValidators,
} = require('../validators/mealValidators');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/v1/meals/summary
 * ADMIN only — daily meal summary
 */
router.get(
  '/meals/summary',
  authorise('ADMIN'),
  mealController.getDailyMealSummary,
);

/**
 * POST /api/v1/members/:id/meal
 * ADMIN only — mark LUNCH or DINNER; deducts 1 token
 */
router.post(
  '/members/:id/meal',
  authorise('ADMIN'),
  mealMarkLimiter,
  markMealValidators,
  validate,
  mealController.markMeal,
);

/**
 * GET /api/v1/members/:id/meals
 * ADMIN: any member | MEMBER: own history only
 */
router.get(
  '/members/:id/meals',
  authorise('ADMIN', 'MEMBER'),
  mealHistoryValidators,
  validate,
  mealController.getMealHistory,
);

module.exports = router;