"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");
const { globalLimiter } = require("./middlewares/rateLimiter");
const healthRouter = require("./routes/health");

// ── Routers ───────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth"); // Part 2 ✓
const memberRouter = require('./routes/members');   // Part 3
const mealRouter   = require('./routes/meals');     // Part 4
// const resetRouter  = require('./routes/reset');     // Part 5

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Request logging (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use("/api", globalLimiter);

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);

app.use("/api/v1/members", memberRouter);
app.use("/api/v1/meals", mealRouter);
// app.use("/api/v1/reset", resetRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
