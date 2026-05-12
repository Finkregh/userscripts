// ==UserScript==
// @name         fetch-with-retry
// @namespace    https://github.com/Finkregh/userscripts
// @version      1.0.0
// @description  Fetch wrapper with exponential backoff retry for transient network errors
// @author       Finkregh
// @license      MIT
// @updateURL    https://github.com/Finkregh/userscripts/raw/main/helpers/fetch-with-retry.user.js
// @downloadURL  https://github.com/Finkregh/userscripts/raw/main/helpers/fetch-with-retry.user.js
// @grant        none
// ==/UserScript==

/**
 * fetch-with-retry — Fetch with exponential backoff retry.
 *
 * Wraps the native fetch API to automatically retry on transient failures
 * (network errors, HTTP 5xx) with exponential backoff capped at a configurable maximum.
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
    root.fetchWithRetry = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Fetch a URL with automatic retry on failure.
   *
   * @param {string} url - URL to fetch
   * @param {object} [options] - Options passed to fetch (plus retry config)
   * @param {string} [options.credentials='same-origin'] - Credentials mode
   * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
   * @param {number} [options.maxDelayMs=5000] - Maximum delay between retries in ms
   * @param {function} [options.onRetry] - Callback(attempt, error, delayMs) called before each retry
   * @returns {Promise<Response>} The fetch Response on success
   * @throws {Error} The last error after all retries are exhausted
   */
  async function fetchRetry(url, options) {
    const {
      credentials = 'same-origin',
      maxRetries = 3,
      maxDelayMs = 5000,
      onRetry,
      ...fetchOpts
    } = options || {};

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch(url, { credentials, ...fetchOpts });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        return resp;
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), maxDelayMs);
          if (onRetry) onRetry(attempt + 1, err, delayMs);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Failed to fetch after max retries');
  }

  return { fetchRetry };
});
