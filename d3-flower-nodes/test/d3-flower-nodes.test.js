import { describe, it, expect } from 'vitest';
import { loadScript } from './setup.js';

const { petalPath, darkenColor, createFlowerNode } = loadScript();

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
  it('darkens a 6-digit hex color', () => {
    const result = darkenColor('#ff8800');
    // Each channel reduced by 60: ff=255->195=c3, 88=136->76=4c, 00=0->0=00
    expect(result).toBe('#c34c00');
  });

  it('clamps channels at 0', () => {
    const result = darkenColor('#201010');
    // 32-60=0, 16-60=0, 16-60=0
    expect(result).toBe('#000000');
  });

  it('returns input unchanged for non-hex formats', () => {
    const result = darkenColor('rgb(100, 100, 100)');
    expect(result).toBe('rgb(100, 100, 100)');
  });

  it('handles lowercase hex', () => {
    const result = darkenColor('#aabbcc');
    // aa=170->110=6e, bb=187->127=7f, cc=204->144=90
    expect(result).toBe('#6e7f90');
  });
});

describe('createFlowerNode', () => {
  it('is exported as a function', () => {
    expect(createFlowerNode).toBeTypeOf('function');
  });
});
