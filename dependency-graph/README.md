# dependency-graph

Graph layout utilities for D3.js-based dependency visualizations. Provides reusable algorithms extracted from the TIC Dependency Graph userscript.

## Install

[Install as userscript](https://github.com/Finkregh/userscripts/raw/main/dependency-graph/dependency-graph.user.js) (click to install in Tampermonkey/Greasemonkey)

## Usage

### As a userscript `@require`

```js
// @require https://github.com/Finkregh/userscripts/raw/main/dependency-graph/dependency-graph.user.js
```

Then call via the global:

```js
const { resolveCollisions, minimizeCrossings, assignBranchColors, initSplitPane } = dependencyGraph;
```

### As an ES module

```js
import {
  resolveCollisions,
  minimizeCrossings,
  assignBranchColors,
  initSplitPane,
} from './dependency-graph.user.js';
```

## API

### `resolveCollisions(items, getBBox, maxIter?)`

Resolve AABB (axis-aligned bounding box) collisions on a flat array of positioned items by pushing overlapping items apart iteratively.

| Parameter | Type       | Default  | Description                                                  |
| --------- | ---------- | -------- | ------------------------------------------------------------ |
| `items`   | `Array`    | required | Objects with mutable `x` and `y` properties                  |
| `getBBox` | `Function` | required | `(item) => { left, right, top, bottom }` offsets from (x, y) |
| `maxIter` | `number`   | `8`      | Maximum iteration count                                      |

Returns `true` if all collisions were resolved within `maxIter`.

```js
const nodes = [
  { x: 0, y: 0, label: 'A' },
  { x: 5, y: 0, label: 'B' },
];
resolveCollisions(nodes, () => ({ left: 10, right: 10, top: 5, bottom: 5 }));
// nodes[0].x and nodes[1].x are now pushed apart
```

### `minimizeCrossings(levels, opts?)`

Minimize edge crossings in a layered graph using the barycenter heuristic with adjacent exchange polishing. Operates in-place.

| Parameter            | Type           | Default  | Description                                    |
| -------------------- | -------------- | -------- | ---------------------------------------------- |
| `levels`             | `Array<Array>` | required | Layers of nodes, each node must have `.parent` |
| `opts.passes`        | `number`       | `4`      | Forward+backward barycenter passes             |
| `opts.exchangeIters` | `number`       | `3`      | Adjacent exchange polishing iterations         |

Returns a `Map<node, index>` with final positions within each layer.

### `assignBranchColors(root, opts?)`

Assign depth-aware branch colors to a d3.hierarchy tree. Top-level categories get maximally distinct hues; deeper levels subdivide their parent's hue band.

| Parameter         | Type       | Default         | Description         |
| ----------------- | ---------- | --------------- | ------------------- |
| `root`            | `object`   | required        | d3.hierarchy node   |
| `opts.chroma`     | `function` | global `chroma` | chroma.js reference |
| `opts.saturation` | `number`   | `0.65`          | HSL saturation      |
| `opts.lightness`  | `number`   | `0.5`           | HSL lightness       |
| `opts.rootColor`  | `string`   | `'#666'`        | Root node color     |

Colors are stored on `node.data.branchColor`.

### `initSplitPane(divider, leftPane, rightPane, opts?)`

Initialize a draggable split-pane divider between two flex elements.

| Parameter       | Type          | Default  | Description                   |
| --------------- | ------------- | -------- | ----------------------------- |
| `divider`       | `HTMLElement` | required | The divider element           |
| `leftPane`      | `HTMLElement` | required | Left pane (flex child)        |
| `rightPane`     | `HTMLElement` | required | Right pane (flex child)       |
| `opts.minRatio` | `number`      | `0.2`    | Minimum ratio for either pane |
| `opts.maxRatio` | `number`      | `0.8`    | Maximum ratio for left pane   |
| `opts.onResize` | `function`    | -        | Callback(ratio) during drag   |

Returns a cleanup function to remove event listeners.

## Dependencies

- **chroma.js** — required by `assignBranchColors` (pass explicitly or load globally)

## License

MIT
