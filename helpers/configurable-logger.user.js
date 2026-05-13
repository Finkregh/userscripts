// ==UserScript==
// @name         configurable-logger
// @namespace    https://github.com/Finkregh/userscripts
// @version      1.0.0
// @description  Configurable console logger with level filtering and prefix support
// @author       Finkregh
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/Finkregh/userscripts/refs/heads/main/helpers/configurable-logger.user.js
// @downloadURL  https://raw.githubusercontent.com/Finkregh/userscripts/refs/heads/main/helpers/configurable-logger.user.js
// @grant        none
// ==/UserScript==

/**
 * configurable-logger — Console logger with configurable level and prefix.
 *
 * Provides a simple logger that respects a configured log level (none/error/warn/info/debug)
 * and prefixes all output. Useful for userscripts that need structured logging without
 * polluting the console at lower verbosity settings.
 *
 * License: MIT
 */

// UMD wrapper
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.configurableLogger = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LOG_LEVELS = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };

  /**
   * Create a logger instance with a given prefix and initial log level.
   *
   * @param {object} [opts] - Configuration options
   * @param {string} [opts.prefix=''] - Prefix prepended to all log messages
   * @param {string} [opts.logLevel='warn'] - Initial log level (none|error|warn|info|debug)
   * @returns {object} Logger with debug/info/warn/error methods and setLevel/getLevel
   */
  function createLogger(opts) {
    const { prefix = '', logLevel = 'warn' } = opts || {};

    const config = { logLevel, prefix };

    function shouldLog(level) {
      const configured = LOG_LEVELS[config.logLevel] ?? LOG_LEVELS.warn;
      return configured >= LOG_LEVELS[level];
    }

    const logger = {
      debug: (...args) => {
        if (shouldLog('debug')) console.debug(config.prefix, ...args);
      },
      info: (...args) => {
        if (shouldLog('info')) console.info(config.prefix, ...args);
      },
      warn: (...args) => {
        if (shouldLog('warn')) console.warn(config.prefix, ...args);
      },
      error: (...args) => {
        if (shouldLog('error')) console.error(config.prefix, ...args);
      },
      setLevel: level => {
        if (level in LOG_LEVELS) config.logLevel = level;
      },
      getLevel: () => config.logLevel,
    };

    return logger;
  }

  return { createLogger, LOG_LEVELS };
});
