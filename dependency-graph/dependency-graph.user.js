// ==UserScript==
// @name         dependency-graph
// @namespace    https://github.com/Finkregh/userscripts
// @version      1.0.0
// @description  Graph layout utilities — AABB collision resolver, barycenter crossing minimizer, branch color assigner, and split-pane resizer
// @author       Finkregh
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/Finkregh/userscripts/refs/heads/main/dependency-graph/dependency-graph.user.js
// @downloadURL  https://raw.githubusercontent.com/Finkregh/userscripts/refs/heads/main/dependency-graph/dependency-graph.user.js
// @grant        none
// ==/UserScript==

/**
 * dependency-graph — Graph layout utilities for D3.js-based dependency visualizations.
 *
 * Provides reusable algorithms for:
 * - AABB collision resolution (push overlapping nodes apart)
 * - Barycenter crossing minimization (reduce edge crossings in layered layouts)
 * - Branch color assignment (depth-aware hue subdivision for tree hierarchies)
 * - Split-pane resizer (mouse-drag divider between two flex panes)
 *
 * These utilities are designed for use with D3 hierarchical and force-directed layouts
 * but are framework-agnostic in their core logic.
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
    root.dependencyGraph = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // AABB COLLISION RESOLVER
  // ---------------------------------------------------------------------------

  /**
   * Resolve axis-aligned bounding box collisions on a flat array of positioned items.
   * Items are pushed apart iteratively until no overlaps remain or maxIter is reached.
   *
   * @param {Array} items - Objects with mutable `x` and `y` properties
   * @param {Function} getBBox - (item) => { left, right, top, bottom } offsets from (x, y)
   * @param {number} [maxIter=8] - Maximum iteration count
   * @returns {boolean} True if all collisions were resolved
   */
  function resolveCollisions(items, getBBox, maxIter) {
    if (maxIter == null) maxIter = 8;
    for (let iter = 0; iter < maxIter; iter++) {
      let anyOverlap = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i],
            b = items[j];
          const ab = getBBox(a),
            bb = getBBox(b);
          const aX0 = a.x - ab.left,
            aX1 = a.x + ab.right;
          const bX0 = b.x - bb.left,
            bX1 = b.x + bb.right;
          const aY0 = a.y - ab.top,
            aY1 = a.y + ab.bottom;
          const bY0 = b.y - bb.top,
            bY1 = b.y + bb.bottom;

          if (aX0 >= bX1 || aX1 <= bX0 || aY0 >= bY1 || aY1 <= bY0) continue;

          anyOverlap = true;
          const overlapX = Math.min(aX1 - bX0, bX1 - aX0);
          const overlapY = Math.min(aY1 - bY0, bY1 - aY0);

          if (overlapY < overlapX) {
            const push = overlapY * 0.5;
            if (a.y < b.y) {
              a.y -= push;
              b.y += push;
            } else {
              a.y += push;
              b.y -= push;
            }
          } else {
            const push = overlapX * 0.5;
            if (a.x < b.x) {
              a.x -= push;
              b.x += push;
            } else {
              a.x += push;
              b.x -= push;
            }
          }
        }
      }
      if (!anyOverlap) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // BARYCENTER CROSSING MINIMIZER
  // ---------------------------------------------------------------------------

  /**
   * Minimize edge crossings in a layered graph using the barycenter heuristic
   * with adjacent exchange polishing.
   *
   * Operates in-place on `levels` — an array of arrays where each sub-array
   * is a layer of nodes sorted from top to bottom.
   *
   * Each node must have a `.parent` property pointing to its parent node (or null for roots).
   *
   * @param {Array<Array>} levels - Layers of nodes, outer sorted by depth (left-to-right)
   * @param {object} [opts] - Options
   * @param {number} [opts.passes=4] - Number of forward+backward barycenter passes
   * @param {number} [opts.exchangeIters=3] - Max adjacent-exchange polishing iterations per layer
   * @returns {Map} nodeYIndex — Map from node → final index within its layer
   */
  function minimizeCrossings(levels, opts) {
    const { passes = 4, exchangeIters = 3 } = opts || {};

    const nodeYIndex = new Map();
    for (const nodes of levels) {
      nodes.forEach((n, i) => nodeYIndex.set(n, i));
    }

    for (let pass = 0; pass < passes; pass++) {
      // Forward: sort each layer by parent's position in the previous layer
      for (let li = 1; li < levels.length; li++) {
        const nodes = levels[li];
        for (const n of nodes) {
          if (n.parent && nodeYIndex.has(n.parent)) {
            n._barycenter = nodeYIndex.get(n.parent);
          } else {
            n._barycenter = nodeYIndex.get(n) ?? 0;
          }
        }
        nodes.sort((a, b) => a._barycenter - b._barycenter);
        nodes.forEach((n, i) => nodeYIndex.set(n, i));
      }

      // Backward: sort each layer by average position of children in the next layer
      for (let li = levels.length - 2; li >= 0; li--) {
        const nodes = levels[li];
        const nextNodes = levels[li + 1];
        for (const n of nodes) {
          const childIndices = [];
          for (const c of nextNodes) {
            if (c.parent === n) childIndices.push(nodeYIndex.get(c) ?? 0);
          }
          if (childIndices.length > 0) {
            n._barycenter = childIndices.reduce((s, v) => s + v, 0) / childIndices.length;
          } else {
            n._barycenter = nodeYIndex.get(n) ?? 0;
          }
        }
        nodes.sort((a, b) => a._barycenter - b._barycenter);
        nodes.forEach((n, i) => nodeYIndex.set(n, i));
      }
    }

    // Adjacent exchange polishing: swap neighbors if it reduces crossings
    for (let li = 1; li < levels.length; li++) {
      const nodes = levels[li];
      let improved = true;
      for (let iter = 0; iter < exchangeIters && improved; iter++) {
        improved = false;
        for (let i = 0; i < nodes.length - 1; i++) {
          const a = nodes[i],
            b = nodes[i + 1];
          const aP = a.parent && nodeYIndex.has(a.parent) ? nodeYIndex.get(a.parent) : i;
          const bP = b.parent && nodeYIndex.has(b.parent) ? nodeYIndex.get(b.parent) : i + 1;
          if (aP > bP) {
            nodes[i] = b;
            nodes[i + 1] = a;
            nodeYIndex.set(b, i);
            nodeYIndex.set(a, i + 1);
            improved = true;
          }
        }
      }
    }

    // Clean up temp property
    for (const nodes of levels) {
      for (const n of nodes) {
        delete n._barycenter;
      }
    }

    return nodeYIndex;
  }

  // ---------------------------------------------------------------------------
  // BRANCH COLOR ASSIGNER
  // ---------------------------------------------------------------------------

  /**
   * Assign depth-aware branch colors to a d3.hierarchy tree.
   * Top-level categories get maximally distinct hues; each level subdivides
   * its parent's hue band among siblings.
   *
   * Requires chroma.js to be available globally or passed as an argument.
   *
   * Colors are stored on each node's `data.branchColor` property.
   *
   * @param {object} root - A d3.hierarchy node (must have .children and .data)
   * @param {object} [opts] - Options
   * @param {function} [opts.chroma] - chroma.js reference (defaults to global `chroma`)
   * @param {number} [opts.saturation=0.65] - HSL saturation for generated colors
   * @param {number} [opts.lightness=0.5] - HSL lightness for generated colors
   * @param {string} [opts.rootColor='#666'] - Color assigned to the root node
   */
  function assignBranchColors(root, opts) {
    const {
      chroma: chromaLib = typeof chroma !== 'undefined' ? chroma : null,
      saturation = 0.65,
      lightness = 0.5,
      rootColor = '#666',
    } = opts || {};

    if (!chromaLib) {
      throw new Error(
        'assignBranchColors requires chroma.js — pass it via opts.chroma or load globally'
      );
    }

    function assignRecursive(node, hueStart, hueEnd) {
      const children = node.children;
      if (!children || children.length === 0) return;
      const bandWidth = (hueEnd - hueStart) / children.length;
      for (let i = 0; i < children.length; i++) {
        const childHueStart = hueStart + i * bandWidth;
        const childHueEnd = childHueStart + bandWidth;
        const midHue = (childHueStart + childHueEnd) / 2;
        const color = chromaLib.hsl(midHue % 360, saturation, lightness).hex();
        children[i].data.branchColor = color;
        assignRecursive(children[i], childHueStart, childHueEnd);
      }
    }

    root.data.branchColor = rootColor;
    assignRecursive(root, 0, 360);
  }

  // ---------------------------------------------------------------------------
  // SPLIT-PANE RESIZER
  // ---------------------------------------------------------------------------

  /**
   * Initialize a draggable split-pane divider between two flex elements.
   *
   * @param {HTMLElement} divider - The divider element (cursor: col-resize)
   * @param {HTMLElement} leftPane - Left pane element (flex container child)
   * @param {HTMLElement} rightPane - Right pane element (flex container child)
   * @param {object} [opts] - Options
   * @param {number} [opts.minRatio=0.2] - Minimum ratio for either pane (0-1)
   * @param {number} [opts.maxRatio=0.8] - Maximum ratio for the left pane (0-1)
   * @param {function} [opts.onResize] - Callback(ratio) called during drag
   * @returns {function} Cleanup function to remove event listeners
   */
  function initSplitPane(divider, leftPane, rightPane, opts) {
    const { minRatio = 0.2, maxRatio = 0.8, onResize } = opts || {};
    let dragging = false;

    const onMouseDown = e => {
      e.preventDefault();
      dragging = true;
      document.body.style.cursor = 'col-resize';
    };

    const onMouseMove = e => {
      if (!dragging) return;
      const container = leftPane.parentElement;
      const rect = container.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const clamped = Math.max(minRatio, Math.min(maxRatio, ratio));
      leftPane.style.flex = String(clamped);
      rightPane.style.flex = String(1 - clamped);
      if (onResize) onResize(clamped);
    };

    const onMouseUp = () => {
      if (dragging) {
        dragging = false;
        document.body.style.cursor = '';
      }
    };

    divider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return function cleanup() {
      divider.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  return {
    resolveCollisions,
    minimizeCrossings,
    assignBranchColors,
    initSplitPane,
  };
});
