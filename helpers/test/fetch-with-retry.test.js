import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load fetch-with-retry with a custom fetch stub.
 */
function loadWithFetch(fetchStub) {
  const scriptPath = resolve(__dirname, '..', 'fetch-with-retry.user.js');
  const code = readFileSync(scriptPath, 'utf-8');

  const exports = {};
  const module = { exports };

  const sandbox = {
    globalThis: {},
    console,
    setTimeout: (fn, _ms) => {
      // Immediately resolve timeouts in tests
      fn();
      return 0;
    },
    clearTimeout: () => {},
    Promise,
    fetch: fetchStub,
    module,
    exports,
    define: undefined,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(code, context, { filename: 'fetch-with-retry.user.js' });

  return sandbox.module.exports;
}

describe('fetch-with-retry', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('returns response on first successful attempt', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const { fetchRetry } = loadWithFetch(mockFetch);

    const resp = await fetchRetry('https://example.com/api');
    expect(resp.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network error and succeeds', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const { fetchRetry } = loadWithFetch(mockFetch);

    const resp = await fetchRetry('https://example.com/api', { maxRetries: 2 });
    expect(resp.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on HTTP 5xx error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const { fetchRetry } = loadWithFetch(mockFetch);

    const resp = await fetchRetry('https://example.com/api', { maxRetries: 2 });
    expect(resp.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    mockFetch.mockRejectedValue(new Error('always fails'));
    const { fetchRetry } = loadWithFetch(mockFetch);

    await expect(fetchRetry('https://example.com/api', { maxRetries: 2 })).rejects.toThrow(
      'always fails'
    );
    expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('calls onRetry callback before each retry', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('err1'))
      .mockRejectedValueOnce(new Error('err2'))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const { fetchRetry } = loadWithFetch(mockFetch);

    const onRetry = vi.fn();
    await fetchRetry('https://example.com/api', { maxRetries: 3, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error), expect.any(Number));
  });

  it('passes credentials option to fetch', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const { fetchRetry } = loadWithFetch(mockFetch);

    await fetchRetry('https://example.com/api', { credentials: 'include' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('caps delay at maxDelayMs', async () => {
    // With maxDelayMs=100 and attempt 10, delay should be capped
    mockFetch
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const { fetchRetry } = loadWithFetch(mockFetch);

    const onRetry = vi.fn();
    await fetchRetry('https://example.com/api', { maxRetries: 1, maxDelayMs: 100, onRetry });
    expect(onRetry.mock.calls[0][2]).toBeLessThanOrEqual(100);
  });
});
