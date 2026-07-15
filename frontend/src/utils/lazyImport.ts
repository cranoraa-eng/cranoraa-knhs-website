/**
 * Retry configuration for lazy imports
 */
export interface RetryConfig {
  maxRetries?: number;
  delay?: number;
}

/**
 * Retry a dynamic import with exponential backoff
 * 
 * @template T - The type of the module being imported
 * @param importFn - Function that returns a dynamic import promise
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds before retrying (default: 1000ms)
 * @returns Promise that resolves to the imported module
 * 
 * @example
 * ```tsx
 * const Dashboard = lazy(() => 
 *   retryImport(() => import('../pages/Dashboard'))
 * );
 * ```
 */
export function retryImport<T>(
  importFn: () => Promise<{ default: T }>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<{ default: T }> {
  return importFn().catch((error) => {
    // If we've exhausted all retries, throw the error
    if (maxRetries === 0) {
      console.error('Failed to load module after all retries:', error);
      throw error;
    }
    
    // Log retry attempt
    console.warn(`Import failed, retrying... (${maxRetries} attempts remaining)`);
    
    // Wait for the delay period, then retry with exponential backoff
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(retryImport(importFn, maxRetries - 1, delay * 2));
      }, delay);
    });
  });
}

/**
 * Create a lazy import with custom retry configuration
 * 
 * @template T - The type of the component being imported
 * @param importFn - Function that returns a dynamic import promise
 * @param config - Retry configuration options
 * @returns Promise that resolves to the imported module
 * 
 * @example
 * ```tsx
 * const HeavyComponent = lazy(() => 
 *   retryImportWithConfig(
 *     () => import('../components/HeavyComponent'),
 *     { maxRetries: 5, delay: 500 }
 *   )
 * );
 * ```
 */
export function retryImportWithConfig<T>(
  importFn: () => Promise<{ default: T }>,
  config: RetryConfig = {}
): Promise<{ default: T }> {
  const { maxRetries = 3, delay = 1000 } = config;
  return retryImport(importFn, maxRetries, delay);
}
