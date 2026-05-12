/**
 * Test setup: loads UMD userscripts in a sandboxed VM context.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load a UMD helper script and return its exported module.
 *
 * @param {string} filename - Script filename relative to helpers/
 * @returns {object} The module's public API
 */
export function loadHelper(filename) {
  const scriptPath = resolve(__dirname, '..', filename);
  const code = readFileSync(scriptPath, 'utf-8');

  const exports = {};
  const module = { exports };

  const sandbox = {
    globalThis: {},
    console,
    setTimeout,
    clearTimeout,
    module,
    exports,
    define: undefined,
    fetch: undefined,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(code, context, { filename });

  // UMD writes to module.exports
  return sandbox.module.exports;
}
