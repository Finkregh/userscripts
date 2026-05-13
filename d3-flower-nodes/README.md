# d3-flower-nodes

SVG flower petal nodes for D3.js graphs. Each flower's petal count encodes a numeric value (e.g. number of child/related nodes).

## Install

[Install as userscript](https://github.com/Finkregh/userscripts/raw/main/d3-flower-nodes/d3-flower-nodes.user.js) (click to install in Tampermonkey/Greasemonkey)

## Usage

### As a userscript `@require`

```js
// @require https://github.com/Finkregh/userscripts/raw/main/d3-flower-nodes/d3-flower-nodes.user.js
```

Then call via the global:

```js
const { createFlowerNode } = d3FlowerNodes;
```

### As an ES module

```js
import { createFlowerNode } from './d3-flower-nodes.user.js';
```

### Basic example

```js
const nodes = svg
  .selectAll('g.node')
  .data(data)
  .join('g')
  .attr('class', 'node')
  .attr('transform', (d) => `translate(${d.x},${d.y})`);

createFlowerNode(nodes, {
  petalCount: (d) => d.children.length,
  color: (d) => d.color,
  radius: 12,
  opacity: 0.35,
});
```

### Random flowers (natural-looking variety)

```js
const { randomFlower, createFlowerNode } = d3FlowerNodes;

// Generate a fully random flower config
const flowerOpts = randomFlower();
createFlowerNode(nodes, { color: '#e86', ...flowerOpts });

// Or pin some values and randomize the rest
const flowerOpts2 = randomFlower({ petalCount: 8, growthFactor: 0.4 });
```

`randomFlower()` uses golden-angle rotation, progressive petal growth, and per-petal
jitter (inspired by [Overflower](https://overflower.bleeptrack.de/)) to produce
visually distinct flowers on every call.

## API

### `createFlowerNode(selection, options)`

Appends a flower glyph to each `<g>` element in the D3 selection.

| Option           | Type               | Default         | Description                                         |
| ---------------- | ------------------ | --------------- | --------------------------------------------------- |
| `petalCount`     | `function\|number` | required        | Number of petals (accessor or constant)             |
| `color`          | `function\|string` | `'#888'`        | Petal fill color                                    |
| `strokeColor`    | `function\|string` | auto            | Petal stroke color; defaults to darkened fill       |
| `radius`         | `number`           | `12`            | Petal length (flower radius)                        |
| `petalWidth`     | `number`           | `radius * 0.45` | Petal width at widest point                         |
| `opacity`        | `number`           | `0.35`          | Petal fill opacity                                  |
| `centerRadius`   | `number`           | `3`             | Center circle (pistil) radius                       |
| `petalParams`    | `object`           | —               | Petal shape params (from `randomPetalParams`)       |
| `useGoldenAngle` | `boolean`          | `false`         | Use golden angle (~137.5°) instead of even spacing  |
| `angleJitter`    | `number`           | `0`             | Random angular offset per petal (degrees)           |
| `growthFactor`   | `number`           | `0`             | Progressive petal sizing (0=uniform, 1=double last) |
| `sizeJitter`     | `number`           | `0`             | Random per-petal size variation (e.g. 0.2 = ±20%)  |
| `fillColors`     | `[string, string]` | —               | Start/end color gradient across petals              |
| `strokeColors`   | `[string, string]` | —               | Start/end stroke gradient across petals             |
| `style`          | `string`           | `'colored'`     | `'colored'` (fill+stroke) or `'lineart'` (no fill) |

Returns the input selection for chaining.

### `randomFlower(overrides?)`

Generates a complete random flower configuration including petal count, shape, rotation style, growth, and jitter. Returns an object suitable as `createFlowerNode` options.

| Key              | Range / Default   | Description                           |
| ---------------- | ----------------- | ------------------------------------- |
| `petalCount`     | 5–17              | Number of petals                      |
| `radius`         | 10–25             | Overall flower radius                 |
| `centerRadius`   | 15–35% of radius  | Pistil size                           |
| `opacity`        | 0.25–0.6          | Fill opacity                          |
| `useGoldenAngle` | true ~70%         | Golden angle creates natural spiral   |
| `angleJitter`    | 0–8°              | Per-petal angular offset              |
| `growthFactor`   | 0–0.6             | Inner petals short, outer petals long |
| `sizeJitter`     | 0–0.25            | Per-petal random size variation       |
| `petalParams`    | random            | Shape params (via `randomPetalParams`) |

### `randomPetalParams(overrides?)`

Generates random petal shape parameters (length, width, curves, tip, base, asymmetry).

### `petalPath(length, width)` / `petalPath(params)`

Returns an SVG path string for a single petal shape (cubic bezier). Accepts either `(length, width)` for backward compatibility or a params object for full control.

### `darkenColor(color)`

Darkens a color for use as stroke via chroma.js.

### `GOLDEN_ANGLE`

Constant `137.508` — the golden angle in degrees, used for natural phyllotaxis petal arrangement.

## Dependencies

- **D3.js** (v5+) - for selections
- **chroma.js** - for color manipulation

## Attribution

Inspired by:

- [D3 Flower](https://observablehq.com/@kevinfjbecker/d3-flower) by Kevin Becker
- [Film Flowers](https://shirleywu.studio/filmflowers/) by Shirley Wu
- [Overflower](https://overflower.bleeptrack.de/) by bleeptrack

## License

MIT
