'use strict';

const express           = require('express');
const resetController   = require('../controllers/resetController');
const authenticate      = require('../middlewares/authenticate');
const authorise         = require('../middlewares/authorise');
const validate          = require('../middlewares/validate');
const { resetLimiter }  = require('../middlewares/rateLimiter');
const {
  resetDayValidators,
  resetLogsValidators,
} = require('../validators/resetValidators');

const router = express.Router();

router.use(authenticate, authorise('ADMIN'));

/**
 * POST /api/v1/reset-day
 * Manual daily reset — re-enables meal buttons, expires stale members
 */
router.post(
  '/reset-day',
  resetLimiter,
  resetDayValidators,
  validate,
  resetController.resetDay,
);

/**
 * GET /api/v1/reset-logs
 * Paginated reset event history
 */
router.get(
  '/reset-logs',
  resetLogsValidators,
  validate,
  resetController.getResetLogs,
);

module.exports = router;