'use strict';

const helmet = require('helmet');

/**
 * helmetConfig
 *
 * Fine-grained helmet configuration for production-grade security headers.
 * Each directive is documented so developers understand what it does.
 *
 * NFR-04: All data in transit must use HTTPS (enforced by HSTS in production).
 */
const helmetConfig = helmet({
  // ── Content Security Policy ────────────────────────────────────────────────
  // Restricts which resources the browser can load.
  // Adjust script-src / style-src when adding a frontend on the same origin.
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'"],
      imgSrc:         ["'self'", 'data:'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // ── HSTS ───────────────────────────────────────────────────────────────────
  // Tells browsers to always use HTTPS for this domain.
  // Only enable in production (causes issues with local HTTP dev).
  strictTransportSecurity: process.env.NODE_ENV === 'production'
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,

  // ── Referrer Policy ────────────────────────────────────────────────────────
  // Prevents leaking full URL in Referer header.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // ── X-Frame-Options ────────────────────────────────────────────────────────
  // Prevents clickjacking via <iframe> embedding.
  frameguard: { action: 'deny' },

  // ── X-Content-Type-Options ─────────────────────────────────────────────────
  // Prevents MIME-type sniffing.
  noSniff: true,

  // ── X-XSS-Protection ───────────────────────────────────────────────────────
  // Legacy header — modern browsers rely on CSP, but kept for older clients.
  xssFilter: true,

  // ── Hide X-Powered-By ──────────────────────────────────────────────────────
  // Removes "X-Powered-By: Express" from every response.
  hidePoweredBy: true,

  // ── DNS Prefetch Control ───────────────────────────────────────────────────
  dnsPrefetchControl: { allow: false },

  // ── Cross-Origin Embedder Policy ───────────────────────────────────────────
  crossOriginEmbedderPolicy: false, // set to true if using SharedArrayBuffer
});

module.exports = helmetConfig;