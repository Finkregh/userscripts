/**
 * Test setup: loads d3-flower-nodes UMD script in a sandboxed VM context
 * with a minimal d3 stub.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load the d3-flower-nodes script with a d3 stub.
 *
 * @param {object} [opts] - Options
 * @param {object} [opts.d3] - Custom d3 stub (defaults to a minimal chainable mock)
 * @returns {object} { createFlowerNode, petalPath, darkenColor }
 */
export function loadScript(opts = {}) {
  const scriptPath = resolve(__dirname, '..', 'd3-flower-nodes.user.js');
  const code = readFileSync(scriptPath, 'utf-8');

  const exports = {};
  const module = { exports };

  // Minimal d3 stub that tracks appended elements
  const d3Stub = opts.d3 || {
    select: el => createChainable(el),
  };

  const sandbox = {
    globalThis: {},
    console,
    require: name => {
      if (name === 'd3') return d3Stub;
      throw new Error(`Unexpected require: ${name}`);
    },
    module,
    exports,
    define: undefined,
    chroma: undefined,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(code, context, { filename: 'd3-flower-nodes.user.js' });

  return sandbox.module.exports;
}

/**
 * Creates a chainable D3 selection mock that records appended elements.
 */
export function createChainable(element) {
  const appended = [];
  const attrs = {};

  const obj = {
    appended,
    attrs,
    append: tag => {
      const child = { tag, attrs: {} };
      appended.push(child);
      const childObj = {
        attr: (k, v) => {
          child.attrs[k] = v;
          return childObj;
        },
      };
      return childObj;
    },
    attr: (k, v) => {
      attrs[k] = v;
      return obj;
    },
    each: fn => {
      if (element && Array.isArray(element)) {
        element.forEach((d, i) =>
          fn.call(
            {
              __mock: true,
              _appended: [],
              append: tag => {
                const child = { tag, attrs: {} };
                appended.push(child);
                const childObj = {
                  attr: (k, v) => {
                    child.attrs[k] = v;
                    return childObj;
                  },
                };
                return childObj;
              },
            },
            d,
            i
          )
        );
      }
      return obj;
    },
  };
  return obj;
}
