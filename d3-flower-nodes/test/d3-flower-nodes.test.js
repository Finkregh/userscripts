import { describe, it, expect } from 'vitest';
import { loadScript } from './setup.js';

const {
  petalPath,
  darkenColor,
  createFlowerNode,
  randomPetalParams,
  lerpColor,
  DEFAULT_PETAL_PARAMS,
} = loadScript();

describe('petalPath', () => {
  it('returns a valid SVG path string', () => {
    const path = petalPath(20, 8);
    expect(path).toContain('M');
    expect(path).toContain('C');
    expect(path).toContain('Z');
  });

  it('starts at origin', () => {
    const path = petalPath(10, 5);
    expect(path).toMatch(/^M 0 0/);
  });

  it('petal tip reaches specified length', () => {
    const path = petalPath(30, 10);
    // The path should contain -30 (negative Y = upward tip)
    expect(path).toContain('-30');
  });

  it('width affects control points', () => {
    const narrow = petalPath(20, 4);
    const wide = petalPath(20, 12);
    // Different widths should produce different paths
    expect(narrow).not.toBe(wide);
  });
});

describe('darkenColor', () => {
  it('darkens a 6-digit hex color via chroma.js', () => {
    const result = darkenColor('#ff8800');
    expect(result).toBe('#a94300');
  });

  it('clamps very dark colors to black', () => {
    const result = darkenColor('#201010');
    expect(result).toBe('#000000');
  });

  it('handles named CSS colors', () => {
    const result = darkenColor('red');
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('handles lowercase hex', () => {
    const result = darkenColor('#aabbcc');
    expect(result).toBe('#647484');
  });
});

describe('createFlowerNode', () => {
  it('is exported as a function', () => {
    expect(createFlowerNode).toBeTypeOf('function');
  });
});

describe('randomPetalParams', () => {
  it('returns an object with all required shape keys', () => {
    const params = randomPetalParams();
    expect(params).toHaveProperty('length');
    expect(params).toHaveProperty('width');
    expect(params).toHaveProperty('curveStart');
    expect(params).toHaveProperty('curveEnd');
    expect(params).toHaveProperty('tipRoundness');
    expect(params).toHaveProperty('baseWidth');
    expect(params).toHaveProperty('asymmetry');
  });

  it('respects overrides while randomizing the rest', () => {
    const params = randomPetalParams({ length: 42, curveStart: 0.2 });
    expect(params.length).toBe(42);
    expect(params.curveStart).toBe(0.2);
    expect(params.width).toBeGreaterThan(0);
    expect(params.curveEnd).toBeGreaterThanOrEqual(0.55);
    expect(params.curveEnd).toBeLessThanOrEqual(0.85);
  });

  it('generates different values on successive calls', () => {
    const a = randomPetalParams();
    const b = randomPetalParams();
    const aStr = JSON.stringify(a);
    const bStr = JSON.stringify(b);
    expect(aStr).not.toBe(bStr);
  });

  it('produces values within expected ranges', () => {
    for (let i = 0; i < 50; i++) {
      const p = randomPetalParams();
      expect(p.length).toBeGreaterThanOrEqual(8);
      expect(p.length).toBeLessThanOrEqual(20);
      expect(p.curveStart).toBeGreaterThanOrEqual(0.15);
      expect(p.curveStart).toBeLessThanOrEqual(0.45);
      expect(p.curveEnd).toBeGreaterThanOrEqual(0.55);
      expect(p.curveEnd).toBeLessThanOrEqual(0.85);
      expect(p.tipRoundness).toBeGreaterThanOrEqual(0);
      expect(p.tipRoundness).toBeLessThanOrEqual(0.6);
      expect(p.baseWidth).toBeGreaterThanOrEqual(0);
      expect(p.baseWidth).toBeLessThanOrEqual(0.4);
      expect(p.asymmetry).toBeGreaterThanOrEqual(-0.3);
      expect(p.asymmetry).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('petalPath with params object', () => {
  it('accepts a params object and returns valid SVG path', () => {
    const params = {
      length: 15,
      width: 6,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0,
    };
    const path = petalPath(params);
    expect(path).toContain('M');
    expect(path).toContain('C');
    expect(path).toContain('Z');
    expect(path).toContain('-15');
  });

  it('produces identical output for default params and legacy (length, width) call', () => {
    const legacy = petalPath(12, 5.4);
    const paramBased = petalPath({
      length: 12,
      width: 5.4,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0,
    });
    expect(paramBased).toBe(legacy);
  });

  it('tipRoundness spreads the tip', () => {
    const pointed = petalPath({
      length: 15,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0,
    });
    const rounded = petalPath({
      length: 15,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0.5,
      baseWidth: 0,
      asymmetry: 0,
    });
    expect(pointed).not.toBe(rounded);
  });

  it('asymmetry offsets the tip laterally', () => {
    const symmetric = petalPath({
      length: 15,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0,
    });
    const asymmetric = petalPath({
      length: 15,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0.5,
    });
    expect(symmetric).not.toBe(asymmetric);
  });

  it('baseWidth widens the base', () => {
    const narrowBase = petalPath({
      length: 15,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0,
    });
    const wideBase = petalPath({
      length: 15,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0.5,
      asymmetry: 0,
    });
    expect(narrowBase).toMatch(/^M 0 0/);
    expect(wideBase).not.toMatch(/^M 0 0/);
  });
});

describe('round-trip: random → extract → recreate', () => {
  it('same params produce identical petalPath output', () => {
    const params = randomPetalParams();
    const path1 = petalPath(params);
    const path2 = petalPath(params);
    expect(path1).toBe(path2);
  });

  it('serialized params can be deserialized and produce the same path', () => {
    const params = randomPetalParams();
    const path1 = petalPath(params);
    const serialized = JSON.stringify(params);
    const deserialized = JSON.parse(serialized);
    const path2 = petalPath(deserialized);
    expect(path1).toBe(path2);
  });
});

describe('lerpColor', () => {
  it('returns start color at t=0', () => {
    expect(lerpColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });

  it('returns end color at t=1', () => {
    expect(lerpColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });

  it('returns perceptual midpoint at t=0.5 (Lab space)', () => {
    const mid = lerpColor('#000000', '#ffffff', 0.5);
    expect(mid).toBe('#777777');
  });
});

describe('DEFAULT_PETAL_PARAMS', () => {
  it('is exported and has expected defaults', () => {
    expect(DEFAULT_PETAL_PARAMS.curveStart).toBe(0.3);
    expect(DEFAULT_PETAL_PARAMS.curveEnd).toBe(0.7);
    expect(DEFAULT_PETAL_PARAMS.tipRoundness).toBe(0);
    expect(DEFAULT_PETAL_PARAMS.baseWidth).toBe(0);
    expect(DEFAULT_PETAL_PARAMS.asymmetry).toBe(0);
  });
});

describe('backward compatibility — SVG path output unchanged', () => {
  // These are the exact SVG path strings the original v1.0.0 petalPath produced.
  // New parameters must be optional and must NOT alter these outputs.
  const REFERENCE_PATHS = [
    { args: [20, 8], expected: 'M 0 0 C 4 -6 4 -14 0 -20 C -4 -14 -4 -6 0 0 Z' },
    { args: [10, 5], expected: 'M 0 0 C 2.5 -3 2.5 -7 0 -10 C -2.5 -7 -2.5 -3 0 0 Z' },
    { args: [30, 10], expected: 'M 0 0 C 5 -9 5 -21 0 -30 C -5 -21 -5 -9 0 0 Z' },
    {
      args: [12, 5.4],
      expected:
        'M 0 0 C 2.7 -3.5999999999999996 2.7 -8.399999999999999 0 -12 C -2.7 -8.399999999999999 -2.7 -3.5999999999999996 0 0 Z',
    },
  ];

  REFERENCE_PATHS.forEach(({ args, expected }) => {
    it(`petalPath(${args.join(', ')}) matches v1.0.0 output`, () => {
      expect(petalPath(args[0], args[1])).toBe(expected);
    });
  });

  it('calling with default params object produces same result as (length, width)', () => {
    const legacy = petalPath(20, 8);
    const withDefaults = petalPath({
      length: 20,
      width: 8,
      curveStart: 0.3,
      curveEnd: 0.7,
      tipRoundness: 0,
      baseWidth: 0,
      asymmetry: 0,
    });
    expect(withDefaults).toBe(legacy);
  });

  it('omitting all new params from params object still matches legacy', () => {
    const legacy = petalPath(15, 7);
    const withObj = petalPath({ length: 15, width: 7 });
    expect(withObj).toBe(legacy);
  });
});
