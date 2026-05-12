# helpers

Reusable utility modules for Tampermonkey/Greasemonkey userscripts.

## Modules

### configurable-logger

Console logger with configurable level filtering and prefix support.

[Install as userscript](https://github.com/Finkregh/userscripts/raw/main/helpers/configurable-logger.user.js)

```js
// @require https://github.com/Finkregh/userscripts/raw/main/helpers/configurable-logger.user.js
```

```js
const { createLogger } = configurableLogger;

const logger = createLogger({ prefix: '[MyScript]', logLevel: 'info' });
logger.debug('skipped at info level');
logger.info('visible');
logger.warn('visible');
logger.error('visible');

// Change level at runtime
logger.setLevel('debug');
```

#### `createLogger(opts?)`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `prefix` | `string` | `''` | Prefix prepended to all messages |
| `logLevel` | `string` | `'warn'` | Initial level: `none\|error\|warn\|info\|debug` |

Returns a logger with `debug`, `info`, `warn`, `error`, `setLevel(level)`, and `getLevel()`.

---

### fetch-with-retry

Fetch wrapper with exponential backoff retry for transient network errors.

[Install as userscript](https://github.com/Finkregh/userscripts/raw/main/helpers/fetch-with-retry.user.js)

```js
// @require https://github.com/Finkregh/userscripts/raw/main/helpers/fetch-with-retry.user.js
```

```js
const { fetchRetry } = fetchWithRetry;

const resp = await fetchRetry('/api/data', {
  maxRetries: 3,
  maxDelayMs: 5000,
  onRetry: (attempt, err, delay) => console.warn(`Retry ${attempt}: ${err.message}`),
});
const data = await resp.json();
```

#### `fetchRetry(url, opts?)`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `credentials` | `string` | `'same-origin'` | Fetch credentials mode |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `maxDelayMs` | `number` | `5000` | Cap on exponential backoff delay |
| `onRetry` | `function` | - | `(attempt, error, delayMs)` callback |

All other options are passed through to `fetch()`.

Returns a `Promise<Response>` on success, throws the last error after retries are exhausted.

## Dependencies

None. Both modules are standalone with no external dependencies.

## License

MIT
