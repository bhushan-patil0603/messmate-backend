const express   = require('express');
const sequelize = require('../config/sequelize');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      database:  'connected',
      uptime:    `${Math.floor(process.uptime())}s`,
    });
  } catch {
    res.status(503).json({
      status:    'degraded',
      timestamp: new Date().toISOString(),
      database:  'disconnected',
    });
  }
});

module.exports = router;