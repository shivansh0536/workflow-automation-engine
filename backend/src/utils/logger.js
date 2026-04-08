/**
 * Structured Logger Utility
 *
 * Provides consistent, structured logging throughout the application.
 * Replaces scattered console.log calls with a centralized, leveled logger.
 *
 * Levels: DEBUG < INFO < WARN < ERROR
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

class Logger {
  /**
   * @param {string} context - module or class name for log prefix
   * @param {string} [level='INFO'] - minimum log level
   */
  constructor(context, level = 'INFO') {
    this.context = context;
    this.level = LOG_LEVELS[level] ?? LOG_LEVELS.INFO;
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] >= this.level;
  }

  _format(level, message, meta) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    if (meta && Object.keys(meta).length > 0) {
      return `${prefix} ${message} | ${JSON.stringify(meta)}`;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Log a debug message.
   * @param {string} message
   * @param {Object} [meta]
   */
  debug(message, meta = {}) {
    if (this._shouldLog('DEBUG')) {
      console.debug(this._format('DEBUG', message, meta));
    }
  }

  /**
   * Log an info message.
   * @param {string} message
   * @param {Object} [meta]
   */
  info(message, meta = {}) {
    if (this._shouldLog('INFO')) {
      console.log(this._format('INFO', message, meta));
    }
  }

  /**
   * Log a warning message.
   * @param {string} message
   * @param {Object} [meta]
   */
  warn(message, meta = {}) {
    if (this._shouldLog('WARN')) {
      console.warn(this._format('WARN', message, meta));
    }
  }

  /**
   * Log an error message.
   * @param {string} message
   * @param {Object} [meta]
   */
  error(message, meta = {}) {
    if (this._shouldLog('ERROR')) {
      console.error(this._format('ERROR', message, meta));
    }
  }

  /**
   * Create a child logger with a sub-context.
   * @param {string} subContext
   * @returns {Logger}
   */
  child(subContext) {
    return new Logger(`${this.context}:${subContext}`, Object.keys(LOG_LEVELS)[this.level]);
  }
}

/**
 * Factory function to create a logger for a module.
 * @param {string} context
 * @returns {Logger}
 */
function createLogger(context) {
  const level = process.env.LOG_LEVEL || 'INFO';
  return new Logger(context, level);
}

module.exports = { Logger, createLogger };
