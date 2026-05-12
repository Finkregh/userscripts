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
const nodes = svg.selectAll('g.node')
  .data(data)
  .join('g')
  .attr('class', 'node')
  .attr('transform', d => `translate(${d.x},${d.y})`);

createFlowerNode(nodes, {
  petalCount: d => d.children.length,
  color: d => d.color,
  radius: 12,
  opacity: 0.35,
});
```

## API

### `createFlowerNode(selection, options)`

Appends a flower glyph to each `<g>` element in the D3 selection.

| Option         | Type               | Default         | Description                             |
| -------------- | ------------------ | --------------- | --------------------------------------- |
| `petalCount`   | `function\|number` | required        | Number of petals (accessor or constant) |
| `color`        | `function\|string` | `'#888'`        | Petal fill color                        |
| `strokeColor`  | `function\|string` | auto            | Petal stroke; defaults to darkened fill |
| `radius`       | `number`           | `12`            | Petal length (flower radius)            |
| `petalWidth`   | `number`           | `radius * 0.45` | Petal width at widest point             |
| `opacity`      | `number`           | `0.35`          | Petal fill opacity                      |
| `centerRadius` | `number`           | `3`             | Center circle (pistil) radius           |

Returns the input selection for chaining.

### `petalPath(length, width)`

Returns an SVG path string for a single petal shape (cubic bezier, pointed tip).

### `darkenColor(color)`

Darkens a color for use as stroke. Uses chroma.js if available globally, otherwise falls back to simple hex manipulation.

## Dependencies

- **D3.js** (v5+) - for selections
- **chroma.js** (optional) - for better stroke color derivation

## Attribution

Inspired by:

- [D3 Flower](https://observablehq.com/@kevinfjbecker/d3-flower) by Kevin Becker
- [Film Flowers](https://shirleywu.studio/filmflowers/) by Shirley Wu
- [Overflower](https://overflower.bleeptrack.de/) by bleeptrack

## License

MIT
