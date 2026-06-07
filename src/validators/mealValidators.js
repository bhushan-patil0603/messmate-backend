'use strict';

const { body, param, query } = require('express-validator');

/**
 * Validators for POST /api/v1/members/:id/meal
 * Admin marks a meal for a specific member
 */
const markMealValidators = [
  param('id')
    .isUUID().withMessage('Member ID must be a valid UUID'),

  body('meal_type')
    .trim()
    .notEmpty().withMessage('meal_type is required')
    .isIn(['LUNCH', 'DINNER']).withMessage('meal_type must be either LUNCH or DINNER'),
];

/**
 * Validators for GET /api/v1/members/:id/meals
 * Fetch meal history for a member
 */
const mealHistoryValidators = [
  param('id')
    .isUUID().withMessage('Member ID must be a valid UUID'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),

  query('date')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('date must be in YYYY-MM-DD format'),
];

module.exports = { markMealValidators, mealHistoryValidators };