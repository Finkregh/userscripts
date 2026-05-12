/**
 * Test setup: loads dependency-graph UMD script in a sandboxed VM context.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load the dependency-graph script and return its exported API.
 *
 * @param {object} [opts] - Options
 * @param {object} [opts.chroma] - chroma.js stub (for assignBranchColors)
 * @param {object} [opts.document] - document stub (for initSplitPane)
 * @returns {object} { resolveCollisions, minimizeCrossings, assignBranchColors, initSplitPane }
 */
export function loadScript(opts = {}) {
  const scriptPath = resolve(__dirname, '..', 'dependency-graph.user.js');
  const code = readFileSync(scriptPath, 'utf-8');

  const exports = {};
  const module = { exports };

  const sandbox = {
    globalThis: {},
    console,
    setTimeout,
    clearTimeout,
    chroma: opts.chroma || undefined,
    document: opts.document || {
      addEventListener: () => {},
      removeEventListener: () => {},
      body: { style: {} },
    },
    module,
    exports,
    define: undefined,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(code, context, { filename: 'dependency-graph.user.js' });

  return sandbox.module.exports;
}
