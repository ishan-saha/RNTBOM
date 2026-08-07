const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] !== undefined ? LOG_LEVELS[process.env.LOG_LEVEL] : LOG_LEVELS.info;

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta) {
  const base = `[${formatTimestamp()}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    try {
      return `${base} ${JSON.stringify(meta)}`;
    } catch {
      return base;
    }
  }
  return base;
}

const logger = {
  error(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) console.error(formatMessage('error', message, meta));
  },
  warn(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) console.warn(formatMessage('warn', message, meta));
  },
  info(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) console.log(formatMessage('info', message, meta));
  },
  debug(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) console.log(formatMessage('debug', message, meta));
  },
};

module.exports = logger;
