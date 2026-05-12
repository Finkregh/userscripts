// ==UserScript==
// @name         d3-flower-nodes
// @namespace    https://github.com/Finkregh/userscripts
// @version      1.0.0
// @description  SVG flower petal nodes for D3.js graphs — petal count encodes data values
// @author       Finkregh
// @license      MIT
// @updateURL    https://github.com/Finkregh/userscripts/raw/main/d3-flower-nodes/d3-flower-nodes.user.js
// @downloadURL  https://github.com/Finkregh/userscripts/raw/main/d3-flower-nodes/d3-flower-nodes.user.js
// @grant        none
// ==/UserScript==

/**
 * d3-flower-nodes — SVG flower petal nodes for D3.js graphs
 *
 * Renders data-driven flower glyphs where petal count encodes a numeric value
 * (e.g. number of child/related nodes). Designed for use with D3 selections.
 *
 * Attribution & Inspiration:
 *   - D3 Flower by Kevin Becker: https://observablehq.com/@kevinfjbecker/d3-flower
 *   - Film Flowers by Shirley Wu: https://shirleywu.studio/filmflowers/
 *   - Overflower by bleeptrack: https://overflower.bleeptrack.de/
 *
 * License: MIT
 */

// UMD wrapper — works as <script>, @require, or ESM import
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['d3'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('d3'));
  } else {
    root.d3FlowerNodes = factory(root.d3);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (d3) {
  'use strict';

  /**
   * Generate an SVG path string for a single petal.
   * The petal is oriented pointing upward (along negative Y) from origin.
   *
   * @param {number} length - Petal length (tip distance from center)
   * @param {number} width  - Max petal width at widest point
   * @returns {string} SVG path data
   */
  function petalPath(length, width) {
    const hw = width / 2;
    // Cubic bezier petal shape: narrow base, widens in middle, pointed tip
    return [
      'M',
      0,
      0,
      'C',
      hw,
      -length * 0.3,
      hw,
      -length * 0.7,
      0,
      -length,
      'C',
      -hw,
      -length * 0.7,
      -hw,
      -length * 0.3,
      0,
      0,
      'Z',
    ].join(' ');
  }

  /**
   * Append a flower glyph to each element in a D3 selection.
   *
   * @param {d3.Selection} selection - D3 selection of <g> elements to append flowers into
   * @param {object} opts - Configuration options
   * @param {function|number} opts.petalCount    - Number of petals (accessor or constant)
   * @param {function|string} opts.color         - Petal fill color (accessor or constant)
   * @param {function|string} [opts.strokeColor] - Petal stroke color; if omitted, derived from color
   * @param {function|number} [opts.radius=12]   - Petal length (accessor or constant)
   * @param {function|number} [opts.petalWidth]  - Petal width (accessor or constant); defaults to radius * 0.45
   * @param {number} [opts.opacity=0.35]         - Petal fill opacity
   * @param {function|number} [opts.centerRadius=3] - Center circle radius (accessor or constant)
   * @returns {d3.Selection} The input selection (for chaining)
   */
  function createFlowerNode(selection, opts) {
    const {
      petalCount,
      color,
      strokeColor,
      radius: radiusOpt = 12,
      petalWidth: petalWidthOpt,
      opacity = 0.35,
      centerRadius: centerRadiusOpt = 3,
    } = opts || {};

    selection.each(function (d, i) {
      const g = d3.select(this);
      const n = typeof petalCount === 'function' ? petalCount(d, i) : petalCount || 0;
      const c = typeof color === 'function' ? color(d, i) : color || '#888';
      const sc =
        typeof strokeColor === 'function' ? strokeColor(d, i) : strokeColor || darkenColor(c);
      const r = typeof radiusOpt === 'function' ? radiusOpt(d, i) : radiusOpt;
      const cr = typeof centerRadiusOpt === 'function' ? centerRadiusOpt(d, i) : centerRadiusOpt;
      const pw =
        typeof petalWidthOpt === 'function' ? petalWidthOpt(d, i) : petalWidthOpt || r * 0.45;

      const path = petalPath(r, pw);

      // Clamp petal count to a reasonable range
      const count = Math.max(0, Math.min(n, 24));

      if (count > 0) {
        const angleStep = 360 / count;
        for (let p = 0; p < count; p++) {
          g.append('path')
            .attr('d', path)
            .attr('transform', `rotate(${p * angleStep})`)
            .attr('fill', c)
            .attr('fill-opacity', opacity)
            .attr('stroke', sc)
            .attr('stroke-width', 0.5)
            .attr('class', 'flower-petal');
        }
      }

      // Center pistil
      g.append('circle')
        .attr('r', cr)
        .attr('fill', c)
        .attr('fill-opacity', Math.min(1, opacity + 0.4))
        .attr('stroke', sc)
        .attr('stroke-width', 0.5)
        .attr('class', 'flower-center');
    });

    return selection;
  }

  /**
   * Darken a hex/named color for use as stroke.
   * Uses simple luminance reduction if chroma.js is not available.
   *
   * @param {string} color - CSS color string
   * @returns {string} Darkened color
   */
  function darkenColor(color) {
    // Prefer chroma.js if available globally
    if (typeof chroma !== 'undefined') {
      try {
        return chroma(color).darken(1.5).hex();
      } catch {
        /* fall through */
      }
    }
    // Fallback: parse hex and reduce brightness
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 60);
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 60);
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 60);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  }

  // Public API
  return {
    createFlowerNode,
    petalPath,
    darkenColor,
  };
});
