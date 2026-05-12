import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadHelper } from './setup.js';

const { createLogger, LOG_LEVELS } = loadHelper('configurable-logger.user.js');

describe('configurable-logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('LOG_LEVELS', () => {
    it('defines all expected levels with correct ordering', () => {
      expect(LOG_LEVELS.none).toBe(0);
      expect(LOG_LEVELS.error).toBe(1);
      expect(LOG_LEVELS.warn).toBe(2);
      expect(LOG_LEVELS.info).toBe(3);
      expect(LOG_LEVELS.debug).toBe(4);
    });
  });

  describe('createLogger', () => {
    it('returns a logger with all expected methods', () => {
      const log = createLogger();
      expect(log.debug).toBeTypeOf('function');
      expect(log.info).toBeTypeOf('function');
      expect(log.warn).toBeTypeOf('function');
      expect(log.error).toBeTypeOf('function');
      expect(log.setLevel).toBeTypeOf('function');
      expect(log.getLevel).toBeTypeOf('function');
    });

    it('defaults to warn level', () => {
      const log = createLogger();
      expect(log.getLevel()).toBe('warn');
    });

    it('accepts custom log level', () => {
      const log = createLogger({ logLevel: 'debug' });
      expect(log.getLevel()).toBe('debug');
    });
  });

  describe('level filtering', () => {
    it('logs warn and error at default level', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const log = createLogger({ prefix: '[T]' });
      log.warn('warning');
      log.error('err');
      expect(spy).toHaveBeenCalledWith('[T]', 'warning');
      expect(errSpy).toHaveBeenCalledWith('[T]', 'err');
    });

    it('suppresses info and debug at warn level', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const log = createLogger({ logLevel: 'warn' });
      log.info('hidden');
      log.debug('hidden');
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('logs everything at debug level', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const log = createLogger({ logLevel: 'debug', prefix: '' });
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalled();
    });

    it('logs nothing at none level', () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger({ logLevel: 'none' });
      log.error('should not appear');
      expect(errSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    it('changes the active level', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const log = createLogger({ logLevel: 'warn' });

      log.debug('hidden');
      expect(debugSpy).not.toHaveBeenCalled();

      log.setLevel('debug');
      log.debug('visible');
      expect(debugSpy).toHaveBeenCalled();
      expect(log.getLevel()).toBe('debug');
    });

    it('ignores invalid levels', () => {
      const log = createLogger({ logLevel: 'info' });
      log.setLevel('banana');
      expect(log.getLevel()).toBe('info');
    });
  });

  describe('prefix', () => {
    it('prepends prefix to all messages', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger({ prefix: '[MyScript]', logLevel: 'error' });
      log.error('oops');
      expect(spy).toHaveBeenCalledWith('[MyScript]', 'oops');
    });

    it('uses empty prefix by default', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const log = createLogger();
      log.warn('msg');
      expect(spy).toHaveBeenCalledWith('', 'msg');
    });
  });
});
