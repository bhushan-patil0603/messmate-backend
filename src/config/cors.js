'use strict';

/**
 * corsConfig
 *
 * Centralises CORS policy so it is not scattered across app.js.
 * Supports multiple allowed origins via a comma-separated env var.
 *
 * .env example:
 *   ALLOWED_ORIGINS=http://localhost:3000,https://messmate.yourdomain.com
 *
 * Falls back to a single ALLOWED_ORIGIN for backward compatibility.
 */

function buildAllowedOrigins() {
  // Support comma-separated list first
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  // Backward-compat single value
  if (process.env.ALLOWED_ORIGIN) {
    return [process.env.ALLOWED_ORIGIN.trim()];
  }
  // Dev fallback
  return ['http://localhost:3000'];
}

const allowedOrigins = buildAllowedOrigins();

const corsConfig = {
  origin(origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge:         86_400, // 24h preflight cache
};

module.exports = { corsConfig, allowedOrigins };