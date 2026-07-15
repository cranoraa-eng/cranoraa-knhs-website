import { useState, useEffect } from 'react';
import { subscribeToLoadingState, getActiveRequestsCount } from '../utils/api';

/**
 * Hook to track global API loading state
 * Returns true when any API request is in progress (with 200ms delay)
 * 
 * @returns {boolean} isLoading - Whether any API requests are active
 * 
 * @example
 * function MyComponent() {
 *   const isLoading = useApiLoading();
 *   
 *   return (
 *     <>
 *       {isLoading && <LoadingIndicator />}
 *       <button disabled={isLoading}>Submit</button>
 *     </>
 *   );
 * }
 */
export const useApiLoading = () => {
  const [isLoading, setIsLoading] = useState(getActiveRequestsCount() > 0);

  useEffect(() => {
    const unsubscribe = subscribeToLoadingState(setIsLoading);
    return unsubscribe;
  }, []);

  return isLoading;
};

export default useApiLoading;
