'use strict';

require('dotenv').config();

const express           = require('express');
const cors              = require('cors');

// ── Security & NFR middleware ──────────────────────────────────────────────────
const helmetConfig      = require('./config/helmet');
const { corsConfig }    = require('./config/cors');
const sanitiseRequest   = require('./middlewares/sanitise');
const requestSizeGuard  = require('./middlewares/requestSizeGuard');
const { globalLimiter } = require('./middlewares/rateLimiter');
const errorHandler      = require('./middlewares/errorHandler');
const buildHttpLogger   = require('./utils/httpLogger');

// ── Routers ───────────────────────────────────────────────────────────────────
const healthRouter      = require('./routes/health');
const authRouter        = require('./routes/auth');
const memberRouter      = require('./routes/members');
const mealRouter        = require('./routes/meals');
const resetRouter       = require('./routes/reset');

const app = express();

// ════════════════════════════════════════════════════════════════════════════
// LAYER 1 — Security headers (helmet must be first)
// ════════════════════════════════════════════════════════════════════════════
app.use(helmetConfig);

// ════════════════════════════════════════════════════════════════════════════
// LAYER 2 — CORS
// ════════════════════════════════════════════════════════════════════════════
app.use(cors(corsConfig));
app.options('*', cors(corsConfig)); // pre-flight for all routes

// ════════════════════════════════════════════════════════════════════════════
// LAYER 3 — HTTP request logging
// ════════════════════════════════════════════════════════════════════════════
app.use(buildHttpLogger());

// ════════════════════════════════════════════════════════════════════════════
// LAYER 4 — Global rate limiter (IP-based, 100 req / 15 min)
// ════════════════════════════════════════════════════════════════════════════
app.use('/api', globalLimiter);

// ════════════════════════════════════════════════════════════════════════════
// LAYER 5 — Request parsing
// express.json limit is the primary body-size guard;
// requestSizeGuard rejects at the header level before body streams
// ════════════════════════════════════════════════════════════════════════════
app.use(requestSizeGuard);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ════════════════════════════════════════════════════════════════════════════
// LAYER 6 — Input sanitisation
// Strips NoSQL injection chars ($, .) and HTTP parameter pollution
// ════════════════════════════════════════════════════════════════════════════
app.use(sanitiseRequest);

// ════════════════════════════════════════════════════════════════════════════
// LAYER 7 — Routes
// ════════════════════════════════════════════════════════════════════════════
app.use('/api/v1',         healthRouter);
app.use('/api/v1/auth',    authRouter);
app.use('/api/v1/members', memberRouter);
app.use('/api/v1',         mealRouter);   // /members/:id/meal, /members/:id/meals, /meals/summary
app.use('/api/v1',         resetRouter);  // /reset-day, /reset-logs

// ════════════════════════════════════════════════════════════════════════════
// LAYER 8 — 404 catch-all (must come after all routes)
// ════════════════════════════════════════════════════════════════════════════
app.all('*', (req, res) => {
  res.status(404).json({
    status:  'fail',
    message: `Route ${req.method} ${req.originalUrl} not found on this server`,
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LAYER 9 — Global error handler (must be last — 4 params required)
// ════════════════════════════════════════════════════════════════════════════
app.use(errorHandler);

module.exports = app;