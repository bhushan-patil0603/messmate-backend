'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiters — tiered by endpoint sensitivity (NFR-02, NFR-04).
 *
 * All limiters use standard headers so clients can read
 * X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
 */

// ── Shared response factory ───────────────────────────────────────────────────
function makeLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    handler(req, res) {
      res.status(429).json({
        status:  'fail',
        message,
      });
    },
  });
}

// ── 1. Global limiter — 100 req / 15 min per IP ───────────────────────────────
const globalLimiter = makeLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX, 10)       || 100,
  'Too many requests from this IP. Please try again later.',
);

// ── 2. Auth limiter — 10 login attempts / 15 min per IP ──────────────────────
const authLimiter = makeLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please try again in 15 minutes.',
);

// ── 3. Meal-mark limiter — 200 marks / 15 min per IP ─────────────────────────
const mealMarkLimiter = makeLimiter(
  15 * 60 * 1000,
  200,
  'Too many meal-marking requests. Please slow down.',
);

// ── 4. Reset limiter — 10 resets / 60 min per IP ─────────────────────────────
const resetLimiter = makeLimiter(
  60 * 60 * 1000,
  10,
  'Too many reset requests in the last hour.',
);

module.exports = { globalLimiter, authLimiter, mealMarkLimiter, resetLimiter };