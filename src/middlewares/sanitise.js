'use strict';

const mongoSanitize = require('express-mongo-sanitize');
const hpp           = require('hpp');

/**
 * sanitiseRequest
 *
 * Two-layer input sanitisation applied to every request:
 *
 * 1. mongoSanitize — strips keys containing '$' or '.' from req.body,
 *    req.params, and req.query.  Prevents NoSQL injection even when
 *    Sequelize is used (defence in depth).
 *
 * 2. hpp (HTTP Parameter Pollution) — when a query string contains the
 *    same key multiple times (e.g. ?status=ACTIVE&status=PENDING),
 *    hpp keeps the LAST value and moves duplicates to req.query.{key}Array.
 *    Whitelist keys that legitimately accept arrays.
 */
const sanitiseRequest = [
  mongoSanitize({
    replaceWith: '_',     // replace offending chars instead of silent strip
    onSanitize: ({ req, key }) => {
      // Log sanitisation events for security audit
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[SANITISE] Potentially malicious key "${key}" sanitised on ${req.method} ${req.path}`);
      }
    },
  }),

  hpp({
    // Keys that are legitimately repeated in query strings
    whitelist: ['status', 'meal_type'],
  }),
];

module.exports = sanitiseRequest;