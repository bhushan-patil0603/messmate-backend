/**
 * Lightweight logger.
 * In development, uses console with colour prefixes.
 * In production this is the stub point to swap in Winston / Pino.
 */

const isDev = (process.env.NODE_ENV || 'development') === 'development';

const logger = {
  info:  (...args) => isDev && console.log('[INFO]',  ...args),
  warn:  (...args) => console.warn('[WARN]',  ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => isDev && console.debug('[DEBUG]', ...args),
};

module.exports = logger;