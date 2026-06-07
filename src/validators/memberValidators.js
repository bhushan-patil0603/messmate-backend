const { body, param, query } = require('express-validator');

/**
 * Validators for POST /api/v1/members
 * Admin submits a new member request
 */
const createMemberValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Member name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('days')
    .notEmpty().withMessage('Number of days is required')
    .isInt({ min: 1, max: 365 }).withMessage('Days must be a whole number between 1 and 365'),

  body('start_date')
    .notEmpty().withMessage('Start date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Start date must be in YYYY-MM-DD format'),

  body('initial_password')
    .optional()
    .isLength({ min: 6, max: 100 }).withMessage('Initial password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

/**
 * Validators for PATCH /api/v1/members/:id/approve
 */
const approveMemberValidators = [
  param('id')
    .isUUID().withMessage('Member ID must be a valid UUID'),

  body('initial_password')
    .optional()
    .isLength({ min: 6, max: 100 }).withMessage('Initial password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

/**
 * Validators for PATCH /api/v1/members/:id/decline
 */
const declineMemberValidators = [
  param('id')
    .isUUID().withMessage('Member ID must be a valid UUID'),
];

/**
 * Validators for GET /api/v1/members (list)
 */
const listMembersValidators = [
  query('status')
    .optional()
    .isIn(['PENDING', 'ACTIVE', 'DECLINED', 'EXPIRED'])
    .withMessage('Status must be one of: PENDING, ACTIVE, DECLINED, EXPIRED'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

/**
 * Validators for GET /api/v1/members/:id
 */
const getMemberValidators = [
  param('id')
    .isUUID().withMessage('Member ID must be a valid UUID'),
];

module.exports = {
  createMemberValidators,
  approveMemberValidators,
  declineMemberValidators,
  listMembersValidators,
  getMemberValidators,
};