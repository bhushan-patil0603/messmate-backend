const { body } = require('express-validator');

/**
 * Validators for POST /api/v1/auth/admin/login
 */
const adminLoginValidators = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

/**
 * Validators for POST /api/v1/auth/member/login
 * Member logs in with their MBR-XXXX id and password
 */
const memberLoginValidators = [
  body('member_uid')
    .trim()
    .notEmpty().withMessage('Member ID is required')
    .matches(/^MBR-\d{4,}$/).withMessage('Member ID must be in format MBR-XXXX'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = { adminLoginValidators, memberLoginValidators };