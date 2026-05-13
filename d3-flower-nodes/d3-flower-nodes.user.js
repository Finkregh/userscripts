// ==UserScript==
// @name         d3-flower-nodes
// @namespace    https://github.com/Finkregh/userscripts
// @version      2.0.0
// @description  SVG flower petal nodes for D3.js graphs — parametric petals, random generation, overflower-style colors
// @author       Finkregh
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/Finkregh/userscripts/refs/heads/main/d3-flower-nodes/d3-flower-nodes.user.js
// @downloadURL  https://raw.githubusercontent.com/Finkregh/userscripts/refs/heads/main/d3-flower-nodes/d3-flower-nodes.user.js
// @require      https://unpkg.com/chroma-js@3.2.0/dist/chroma.min.cjs
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

  // ─── Petal shape defaults (backward-compatible with original hardcoded values) ───

  const DEFAULT_PETAL_PARAMS = {
    length: 12,
    width: null,
    curveStart: 0.3,
    curveEnd: 0.7,
    tipRoundness: 0,
    baseWidth: 0,
    asymmetry: 0,
  };

  // ─── Random parameter generation ───

  const GOLDEN_ANGLE = 137.508;

  function rndBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Generate random petal shape parameters.
   *
   * @param {object} [overrides] - Partial params to pin; unset fields are randomized
   * @returns {object} Complete petal parameter set
   */
  function randomPetalParams(overrides) {
    const o = overrides || {};
    const length = o.length != null ? o.length : rndBetween(8, 20);
    const curveStart = o.curveStart != null ? o.curveStart : rndBetween(0.15, 0.45);
    const curveEnd = o.curveEnd != null ? o.curveEnd : rndBetween(0.55, 0.85);
    const tipRoundness = o.tipRoundness != null ? o.tipRoundness : rndBetween(0, 0.6);
    const baseWidth = o.baseWidth != null ? o.baseWidth : rndBetween(0, 0.4);
    const asymmetry = o.asymmetry != null ? o.asymmetry : rndBetween(-0.3, 0.3);
    const width = o.width != null ? o.width : length * rndBetween(0.3, 0.7);

    return { length, width, curveStart, curveEnd, tipRoundness, baseWidth, asymmetry };
  }

  /**
   * Generate a complete random flower configuration (shape + layout).
   * Unlike randomPetalParams (which only varies the petal shape), this
   * randomizes petal count, rotation style, growth, jitter, and colors —
   * producing visually distinct flowers on each call.
   *
   * Inspired by bleeptrack's Overflower which uses golden-angle rotation,
   * progressive petal sizing, and per-petal variation.
   *
   * @param {object} [overrides] - Partial config to pin; unset fields are randomized
   * @returns {object} Full flower config suitable for createFlowerNode opts
   */
  function randomFlower(overrides) {
    const o = overrides || {};
    const petalCount = o.petalCount != null ? o.petalCount : Math.floor(rndBetween(5, 18));
    const radius = o.radius != null ? o.radius : rndBetween(10, 25);
    const centerRadius = o.centerRadius != null ? o.centerRadius : radius * rndBetween(0.15, 0.35);
    const opacity = o.opacity != null ? o.opacity : rndBetween(0.25, 0.6);

    // Rotation: golden angle produces natural phyllotaxis spirals
    const useGoldenAngle = o.useGoldenAngle != null ? o.useGoldenAngle : Math.random() > 0.3;
    // Angular jitter per petal (degrees)
    const angleJitter = o.angleJitter != null ? o.angleJitter : rndBetween(0, 8);
    // Progressive growth: later petals grow by this factor (0 = uniform, 1 = double)
    const growthFactor = o.growthFactor != null ? o.growthFactor : rndBetween(0, 0.6);
    // Per-petal size jitter (fraction, 0 = uniform, 0.3 = ±30%)
    const sizeJitter = o.sizeJitter != null ? o.sizeJitter : rndBetween(0, 0.25);

    const petalParams = o.petalParams || randomPetalParams(o.petalParamsOverrides);

    return {
      petalCount,
      radius,
      centerRadius,
      opacity,
      petalParams,
      useGoldenAngle,
      angleJitter,
      growthFactor,
      sizeJitter,
    };
  }

  /**
   * Generate an SVG path string for a single petal.
   * Accepts either (length, width) for backward compatibility,
   * or a params object for full control.
   *
   * @param {number|object} lengthOrParams - Petal length, or a petalParams object
   * @param {number} [width] - Max petal width (ignored if first arg is object)
   * @returns {string} SVG path data
   */
  function petalPath(lengthOrParams, width) {
    let p;
    if (typeof lengthOrParams === 'object' && lengthOrParams !== null) {
      p = Object.assign({}, DEFAULT_PETAL_PARAMS, lengthOrParams);
      if (p.width == null) p.width = p.length * 0.45;
    } else {
      p = Object.assign({}, DEFAULT_PETAL_PARAMS, {
        length: lengthOrParams,
        width: width,
      });
    }

    const len = p.length;
    const hw = p.width / 2;
    const baseHw = hw * p.baseWidth;
    const tipOffset = hw * p.asymmetry;

    // tipRoundness: 0 = original bulging shape (control points at hw), 1 = pointed (control points at 0)
    const tipCpX = hw * (1 - p.tipRoundness);

    // Right side control points
    const rc1x = hw;
    const rc1y = -len * p.curveStart;
    const rc2x = tipCpX + tipOffset;
    const rc2y = -len * p.curveEnd;

    // Left side control points (mirror with asymmetry)
    const lc1x = -(tipCpX - tipOffset);
    const lc1y = -len * p.curveEnd;
    const lc2x = -hw;
    const lc2y = -len * p.curveStart;

    const tipX = tipOffset;
    const tipY = -len;

    return [
      'M',
      baseHw,
      0,
      'C',
      rc1x,
      rc1y,
      rc2x,
      rc2y,
      tipX,
      tipY,
      'C',
      lc1x,
      lc1y,
      lc2x,
      lc2y,
      -baseHw,
      0,
      'Z',
    ].join(' ');
  }

  /**
   * Interpolate between two colors.
   *
   * @param {string} color1 - Start color (any CSS color string)
   * @param {string} color2 - End color (any CSS color string)
   * @param {number} t - Interpolation factor 0–1
   * @returns {string} Interpolated hex color
   */
  function lerpColor(color1, color2, t) {
    return chroma.mix(color1, color2, t, 'lab').hex();
  }

  /**
   * Append a flower glyph to each element in a D3 selection.
   *
   * @param {d3.Selection} selection - D3 selection of <g> elements to append flowers into
   * @param {object} opts - Configuration options
   * @param {function|number} opts.petalCount       - Number of petals (accessor or constant)
   * @param {function|string} opts.color            - Petal fill color (accessor or constant)
   * @param {function|string} [opts.strokeColor]    - Petal stroke color; if omitted, derived from color
   * @param {function|number} [opts.radius=12]      - Petal length (accessor or constant)
   * @param {function|number} [opts.petalWidth]     - Petal width; defaults to radius * 0.45
   * @param {number} [opts.opacity=0.35]            - Petal fill opacity
   * @param {function|number} [opts.centerRadius=3] - Center circle radius (accessor or constant)
   * @param {object} [opts.petalParams]             - Explicit petal shape params (from randomPetalParams)
   * @param {string} [opts.style='colored']         - 'colored' (fill+stroke) or 'lineart' (stroke only)
   * @param {Array} [opts.fillColors]               - [startColor, endColor] gradient across petals
   * @param {Array} [opts.strokeColors]             - [startColor, endColor] gradient across petals
   * @param {number} [opts.strokeWidth=0.5]         - Petal stroke width
   * @param {number} [opts.strokeOpacity=1]         - Petal stroke opacity
   * @param {boolean} [opts.useGoldenAngle=false]   - Use golden angle (~137.5°) instead of even spacing
   * @param {number} [opts.angleJitter=0]           - Random angular offset per petal (degrees)
   * @param {number} [opts.growthFactor=0]          - Progressive petal growth (0=uniform, 1=double last)
   * @param {number} [opts.sizeJitter=0]            - Random per-petal size variation (fraction, e.g. 0.2=±20%)
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
      petalParams: petalParamsOpt,
      style = 'colored',
      fillColors,
      strokeColors,
      strokeWidth: strokeWidthOpt = 0.5,
      strokeOpacity = 1,
      useGoldenAngle = false,
      angleJitter = 0,
      growthFactor = 0,
      sizeJitter = 0,
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
      const pp = typeof petalParamsOpt === 'function' ? petalParamsOpt(d, i) : petalParamsOpt;

      const count = Math.max(0, Math.min(n, 24));
      const isLineart = style === 'lineart';

      if (count > 0) {
        const angleStep = useGoldenAngle ? GOLDEN_ANGLE : 360 / count;
        for (let p = 0; p < count; p++) {
          const t = count > 1 ? p / (count - 1) : 0;

          // Progressive growth: later petals are longer (like Overflower's leaveFaktor)
          const growth = 1 + growthFactor * t;
          // Per-petal random size jitter
          const jitter = sizeJitter > 0 ? 1 + (Math.random() * 2 - 1) * sizeJitter : 1;
          const petalR = r * growth * jitter;
          const petalW = pw * growth * jitter;

          // Build per-petal path with adjusted size
          const path = pp
            ? petalPath(Object.assign({ length: petalR, width: petalW }, pp))
            : petalPath(petalR, petalW);

          // Angular jitter: small random offset per petal
          const aJitter = angleJitter > 0 ? (Math.random() * 2 - 1) * angleJitter : 0;
          const angle = p * angleStep + aJitter;

          // Per-petal colors via gradient or uniform
          const fillC = fillColors ? lerpColor(fillColors[0], fillColors[1], t) : c;
          const strokeC = strokeColors ? lerpColor(strokeColors[0], strokeColors[1], t) : sc;

          const petal = g
            .append('path')
            .attr('d', path)
            .attr('transform', `rotate(${angle})`)
            .attr('stroke', strokeC)
            .attr('stroke-width', strokeWidthOpt)
            .attr('stroke-opacity', strokeOpacity)
            .attr('class', 'flower-petal');

          if (isLineart) {
            petal.attr('fill', 'none');
          } else {
            petal.attr('fill', fillC).attr('fill-opacity', opacity);
          }
        }
      }

      // Center pistil
      const center = g
        .append('circle')
        .attr('r', cr)
        .attr('stroke', sc)
        .attr('stroke-width', strokeWidthOpt)
        .attr('class', 'flower-center');

      if (isLineart) {
        center.attr('fill', 'none');
      } else {
        center
          .attr('fill', fillColors ? fillColors[0] : c)
          .attr('fill-opacity', Math.min(1, opacity + 0.4));
      }

      // Store params as data attribute for extraction
      const storedParams = pp || {
        length: r,
        width: pw,
        curveStart: 0.3,
        curveEnd: 0.7,
        tipRoundness: 0,
        baseWidth: 0,
        asymmetry: 0,
      };
      g.attr('data-petal-params', JSON.stringify(storedParams));
    });

    return selection;
  }

  /**
   * Extract petal parameters from a flower node that was created with createFlowerNode.
   *
   * @param {d3.Selection|Element} nodeOrSelection - A <g> element or D3 selection containing a flower
   * @returns {object|null} The petal parameters, or null if not found
   */
  function getPetalParams(nodeOrSelection) {
    const el = nodeOrSelection.node ? nodeOrSelection.node() : nodeOrSelection;
    const raw = el.getAttribute('data-petal-params');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Darken a color for use as stroke.
   *
   * @param {string} color - Any CSS color string
   * @returns {string} Darkened hex color
   */
  function darkenColor(color) {
    return chroma(color || '#000')
      .darken(1.5)
      .hex();
  }

  // Public API
  return {
    createFlowerNode,
    petalPath,
    darkenColor,
    randomPetalParams,
    randomFlower,
    getPetalParams,
    lerpColor,
    DEFAULT_PETAL_PARAMS,
    GOLDEN_ANGLE,
  };
});
