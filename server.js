require('dotenv').config();

const app                  = require('./src/app');
const sequelize            = require('./src/config/sequelize');
const logger               = require('./src/utils/logger');
const { startDailyResetJob } = require('./src/jobs/dailyReset');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
  try {
    // ── Test DB connection ───────────────────────────────────────────────────
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully');

    // ── Start HTTP server ────────────────────────────────────────────────────
    const server = app.listen(PORT, () => {
      logger.info(`MessMate API running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // ── Start daily reset cron job ───────────────────────────────────────────
    const resetJob = startDailyResetJob();

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);

      // Stop cron job first
      if (resetJob) {
        resetJob.stop();
        logger.info('Daily reset scheduler stopped');
      }

      server.close(async () => {
        await sequelize.close();
        logger.info('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // ── Unhandled rejections ─────────────────────────────────────────────────
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();