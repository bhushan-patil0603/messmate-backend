'use strict';

const cron                = require('node-cron');
const { performReset }    = require('../services/resetService');
const logger              = require('../utils/logger');

// ── Config ────────────────────────────────────────────────────────────────────
// Default: "0 0 * * *" = every day at 00:00
// Override with DAILY_RESET_CRON in .env
const CRON_EXPRESSION = process.env.DAILY_RESET_CRON     || '0 0 * * *';
const TIMEZONE        = process.env.SCHEDULER_TIMEZONE    || 'Asia/Kolkata';
const MAX_RETRIES     = 3;
const RETRY_DELAY_MS  = 5_000; // 5 seconds between retries

// ── Retry helper ──────────────────────────────────────────────────────────────
/**
 * sleep
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * runResetWithRetry
 *
 * Attempts performReset up to MAX_RETRIES times.
 * Waits RETRY_DELAY_MS between each attempt.
 * Logs every attempt and final outcome.
 * Satisfies NFR-05: scheduler must have retry logic with up to 3 attempts.
 */
async function runResetWithRetry() {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Daily reset scheduler: attempt ${attempt} of ${MAX_RETRIES}`);

      const result = await performReset('SCHEDULER');

      logger.info(
        `Daily reset scheduler: SUCCESS on attempt ${attempt}. ` +
        `Members reset: ${result.membersAffected}, ` +
        `Expired: ${result.expiredCount}`,
      );
      return; // success — stop retrying

    } catch (err) {
      lastError = err;
      logger.error(
        `Daily reset scheduler: attempt ${attempt} FAILED — ${err.message}`,
      );

      if (attempt < MAX_RETRIES) {
        logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s…`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  // All retries exhausted
  logger.error(
    `Daily reset scheduler: ALL ${MAX_RETRIES} attempts failed. ` +
    `Last error: ${lastError?.message}`,
  );
}

// ── Schedule ──────────────────────────────────────────────────────────────────
/**
 * startDailyResetJob
 *
 * Registers the cron task. Called once from server.js on startup.
 * Returns the task reference so it can be stopped in tests or graceful shutdown.
 *
 * @returns {cron.ScheduledTask}
 */
function startDailyResetJob() {
  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`Invalid cron expression: "${CRON_EXPRESSION}". Job not started.`);
    return null;
  }

  const task = cron.schedule(
    CRON_EXPRESSION,
    () => {
      logger.info(`Daily reset scheduler triggered — ${new Date().toISOString()}`);
      runResetWithRetry();
    },
    {
      timezone: TIMEZONE,
    },
  );

  logger.info(
    `Daily reset scheduler started. ` +
    `Expression: "${CRON_EXPRESSION}" | Timezone: ${TIMEZONE}`,
  );

  return task;
}

module.exports = { startDailyResetJob, runResetWithRetry };