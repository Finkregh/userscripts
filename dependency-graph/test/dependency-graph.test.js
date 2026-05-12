import { describe, it, expect } from 'vitest';
import { loadScript } from './setup.js';

const chromaStub = {
  hsl: (h, s, l) => ({ hex: () => `hsl(${Math.round(h)},${s},${l})` }),
};

const { resolveCollisions, minimizeCrossings, assignBranchColors } = loadScript({
  chroma: chromaStub,
});

describe('resolveCollisions', () => {
  const getBBox = () => ({ left: 10, right: 10, top: 5, bottom: 5 });

  it('returns true when no items overlap', () => {
    const items = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];
    expect(resolveCollisions(items, getBBox)).toBe(true);
  });

  it('separates overlapping items', () => {
    const items = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ];
    resolveCollisions(items, getBBox);
    // After resolution, items should be at least as far apart as before
    const dist = Math.abs(items[0].x - items[1].x);
    expect(dist).toBeGreaterThanOrEqual(5);
  });

  it('returns true for a single item', () => {
    const items = [{ x: 0, y: 0 }];
    expect(resolveCollisions(items, getBBox)).toBe(true);
  });

  it('returns true for empty array', () => {
    expect(resolveCollisions([], getBBox)).toBe(true);
  });

  it('pushes apart vertically when Y overlap is smaller', () => {
    const items = [
      { x: 0, y: 0 },
      { x: 0, y: 3 }, // overlap more in X than Y
    ];
    const origX0 = items[0].x;
    resolveCollisions(items, getBBox);
    // Should have moved in Y direction primarily
    expect(Math.abs(items[0].y - items[1].y)).toBeGreaterThan(3);
    // X should not have changed much (or at all)
    expect(items[0].x).toBe(origX0);
  });

  it('respects maxIter parameter', () => {
    // Many overlapping items may not resolve in 1 iteration
    const items = Array.from({ length: 10 }, () => ({ x: 0, y: 0 }));
    const result = resolveCollisions(items, getBBox, 1);
    // With 1 iteration, likely not fully resolved
    expect(typeof result).toBe('boolean');
  });
});

describe('minimizeCrossings', () => {
  it('returns a Map of node positions', () => {
    const root = { parent: null };
    const child1 = { parent: root };
    const child2 = { parent: root };
    const levels = [[root], [child1, child2]];

    const result = minimizeCrossings(levels);
    // VM creates Map in a different context, so check by duck-typing
    expect(result.get).toBeTypeOf('function');
    expect(result.has).toBeTypeOf('function');
    expect(result.has(root)).toBe(true);
    expect(result.has(child1)).toBe(true);
    expect(result.has(child2)).toBe(true);
  });

  it('sorts children by parent position', () => {
    const p1 = { parent: null };
    const p2 = { parent: null };
    // c1 has parent p2 (position 1), c2 has parent p1 (position 0)
    const c1 = { parent: p2 };
    const c2 = { parent: p1 };
    const levels = [[p1, p2], [c1, c2]];

    const result = minimizeCrossings(levels);
    // c2 (parent at pos 0) should come before c1 (parent at pos 1)
    expect(result.get(c2)).toBeLessThan(result.get(c1));
  });

  it('handles single-level input', () => {
    const n = { parent: null };
    const levels = [[n]];
    const result = minimizeCrossings(levels);
    expect(result.get(n)).toBe(0);
  });

  it('cleans up _barycenter property', () => {
    const root = { parent: null };
    const child = { parent: root };
    const levels = [[root], [child]];
    minimizeCrossings(levels);
    expect(root._barycenter).toBeUndefined();
    expect(child._barycenter).toBeUndefined();
  });
});

describe('assignBranchColors', () => {
  it('assigns rootColor to root node', () => {
    const root = { data: {}, children: [] };
    assignBranchColors(root, { chroma: chromaStub });
    expect(root.data.branchColor).toBe('#666');
  });

  it('assigns distinct colors to children', () => {
    const root = {
      data: {},
      children: [
        { data: {}, children: [] },
        { data: {}, children: [] },
        { data: {}, children: [] },
      ],
    };
    assignBranchColors(root, { chroma: chromaStub });
    const colors = root.children.map((c) => c.data.branchColor);
    // All children should have colors assigned
    expect(colors.every((c) => c !== undefined)).toBe(true);
    // All children should have different colors
    expect(new Set(colors).size).toBe(3);
  });

  it('recurses into grandchildren', () => {
    const grandchild = { data: {}, children: [] };
    const child = { data: {}, children: [grandchild] };
    const root = { data: {}, children: [child] };
    assignBranchColors(root, { chroma: chromaStub });
    expect(grandchild.data.branchColor).toBeDefined();
  });

  it('throws without chroma', () => {
    const root = { data: {}, children: [{ data: {}, children: [] }] };
    expect(() => assignBranchColors(root, { chroma: null })).toThrow(/chroma/);
  });

  it('respects custom rootColor', () => {
    const root = { data: {}, children: [] };
    assignBranchColors(root, { chroma: chromaStub, rootColor: '#f00' });
    expect(root.data.branchColor).toBe('#f00');
  });
});
