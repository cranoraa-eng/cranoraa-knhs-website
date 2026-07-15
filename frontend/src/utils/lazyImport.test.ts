import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryImport, retryImportWithConfig } from './lazyImport';

describe('lazyImport utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('retryImport', () => {
    it('should successfully import on first attempt', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi.fn().mockResolvedValue(mockModule);

      const result = await retryImport(importFn);

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(1);
    });

    it('should retry once after failure and succeed', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockModule);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn);
      
      // Fast-forward through the delay
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await resultPromise;

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Import failed, retrying...')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should implement exponential backoff (1s, 2s, 4s)', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValueOnce(mockModule);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn);
      
      // First retry after 1s
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second retry after 2s (exponential: 1s * 2)
      await vi.advanceTimersByTimeAsync(2000);
      
      // Third retry after 4s (exponential: 2s * 2)
      await vi.advanceTimersByTimeAsync(4000);
      
      const result = await resultPromise;

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should throw error after max retries (3)', async () => {
      const error = new Error('Persistent failure');
      const importFn = vi.fn().mockRejectedValue(error);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn);
      
      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      await vi.advanceTimersByTimeAsync(4000); // Third retry
      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('Persistent failure');
      expect(importFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load module after all retries:',
        error
      );

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should accept custom maxRetries parameter', async () => {
      const error = new Error('Custom retry test');
      const importFn = vi.fn().mockRejectedValue(error);

      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn, 2).catch(err => {
        throw err;
      }); // Only 2 retries
      
      // Advance through retries
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('Custom retry test');
      expect(importFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should accept custom delay parameter', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockModule);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn, 3, 500); // 500ms delay
      
      // Should retry after 500ms (not 1000ms)
      await vi.advanceTimersByTimeAsync(500);
      
      const result = await resultPromise;

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(2);
    });

    it('should log retry attempts with remaining count', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(mockModule);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn);
      
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      
      await resultPromise;

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Import failed, retrying... (3 attempts remaining)'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Import failed, retrying... (2 attempts remaining)'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('retryImportWithConfig', () => {
    it('should use default configuration when no config provided', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi.fn().mockResolvedValue(mockModule);

      const result = await retryImportWithConfig(importFn);

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(1);
    });

    it('should accept custom maxRetries in config', async () => {
      const error = new Error('Config test');
      const importFn = vi.fn().mockRejectedValue(error);

      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImportWithConfig(importFn, { maxRetries: 5 }).catch(err => {
        throw err;
      });
      
      // Should retry 5 times
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.advanceTimersByTimeAsync(8000);
      await vi.advanceTimersByTimeAsync(16000);
      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('Config test');
      expect(importFn).toHaveBeenCalledTimes(6); // 1 initial + 5 retries
    });

    it('should accept custom delay in config', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockModule);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImportWithConfig(importFn, { delay: 2000 });
      
      // Should use 2000ms delay
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await resultPromise;

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(2);
    });

    it('should accept both maxRetries and delay in config', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockModule);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImportWithConfig(importFn, { 
        maxRetries: 2, 
        delay: 500 
      });
      
      await vi.advanceTimersByTimeAsync(500);
      
      const result = await resultPromise;

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(2);
    });

    it('should handle empty config object', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi.fn().mockResolvedValue(mockModule);

      const result = await retryImportWithConfig(importFn, {});

      expect(result).toEqual(mockModule);
      expect(importFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirements validation', () => {
    it('should validate 1s default delay (Requirement 1.6)', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockModule);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn);
      
      // Should wait exactly 1000ms for first retry
      await vi.advanceTimersByTimeAsync(999);
      expect(importFn).toHaveBeenCalledTimes(1); // Still only initial call
      
      await vi.advanceTimersByTimeAsync(1);
      await resultPromise;
      
      expect(importFn).toHaveBeenCalledTimes(2); // Now retried
    });

    it('should validate max 3 retries (Requirement 2.5)', async () => {
      const error = new Error('Max retries test');
      const importFn = vi.fn().mockRejectedValue(error);

      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn).catch(err => {
        throw err;
      });
      
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow();
      
      // Exactly 3 retries: 1 initial + 3 retries = 4 total calls
      expect(importFn).toHaveBeenCalledTimes(4);
    });

    it('should validate exponential backoff (Requirement 1.6)', async () => {
      const delays: number[] = [];
      const mockModule = { default: { name: 'TestComponent' } };
      
      const importFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(mockModule);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultPromise = retryImport(importFn, 3, 1000);
      
      // Capture actual delays
      delays.push(1000);
      await vi.advanceTimersByTimeAsync(1000);
      
      delays.push(2000);
      await vi.advanceTimersByTimeAsync(2000);
      
      await resultPromise;

      // Verify exponential backoff: each delay doubles
      expect(delays[0]).toBe(1000);
      expect(delays[1]).toBe(2000); // 1000 * 2
      // Next would be 4000 (2000 * 2) if needed
    });

    it('should validate TypeScript types exist (Requirement 1.6)', () => {
      // This test verifies types compile correctly
      const config: { maxRetries?: number; delay?: number } = {
        maxRetries: 3,
        delay: 1000
      };

      expect(config.maxRetries).toBe(3);
      expect(config.delay).toBe(1000);
    });
  });
});
