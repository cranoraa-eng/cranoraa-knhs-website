export interface RetryConfig {
  maxRetries?: number;
  delay?: number;
}

function isStaleChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('mime type') ||
    msg.includes('text/html') ||
    msg.includes('unexpected token') ||
    msg.includes('error loading dynamically imported module')
  );
}

function reloadOnceForStaleChunk(): void {
  const RELOAD_KEY = 'knhs_stale_chunk_reloaded';
  const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
  if (!alreadyReloaded) {
    console.warn('[lazyImport] Stale deployment detected — reloading…');
    sessionStorage.setItem(RELOAD_KEY, '1');
    window.location.reload();
  } else {
    sessionStorage.removeItem(RELOAD_KEY);
    console.error('[lazyImport] Still failing after reload — possible CDN issue.');
  }
}

export function retryImport<T>(
  importFn: () => Promise<{ default: T }>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<{ default: T }> {
  return importFn().catch((error) => {
    if (isStaleChunkError(error)) {
      reloadOnceForStaleChunk();
      return new Promise<{ default: T }>(() => {});
    }
    if (maxRetries === 0) {
      console.error('Failed to load module after all retries:', error);
      throw error;
    }
    console.warn(`Import failed, retrying… (${maxRetries} attempts remaining)`);
    return new Promise<{ default: T }>((resolve) => {
      setTimeout(() => {
        resolve(retryImport(importFn, maxRetries - 1, delay * 2));
      }, delay);
    });
  });
}

export function retryImportWithConfig<T>(
  importFn: () => Promise<{ default: T }>,
  config: RetryConfig = {}
): Promise<{ default: T }> {
  const { maxRetries = 3, delay = 1000 } = config;
  return retryImport(importFn, maxRetries, delay);
}
