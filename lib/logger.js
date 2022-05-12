const pino = require('pino');

let logger;

/**
 * Create the Logger
 * @return {*|pino.BaseLogger}
 */
function makeLogger() {
  if (typeof logger === 'undefined') {
    logger = pino({
      level: process.env.LOG_LEVEL || 'debug',
    });
  }
  return logger;
}

module.exports = makeLogger();
