import { useEffect, useState, useRef } from 'react';

/**
 * Hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that debounces a callback function
 * @param callback - The callback function to debounce
 * @param delay - The delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useRef(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T
  );

  return debouncedCallback.current;
}

/**
 * Hook for debounced search functionality
 * @param searchTerm - The search term to debounce
 * @param onSearch - The search callback function
 * @param delay - The delay in milliseconds (default: 300)
 */
export function useDebouncedSearch(
  searchTerm: string,
  onSearch: (term: string) => void,
  delay: number = 300
) {
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const previousSearchTerm = useRef<string>('');

  useEffect(() => {
    // Only trigger search if the term actually changed
    if (debouncedSearchTerm !== previousSearchTerm.current) {
      previousSearchTerm.current = debouncedSearchTerm;
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  return debouncedSearchTerm;
}

/**
 * Hook that provides throttled value updates
 * @param value - The value to throttle
 * @param limit - The throttle limit in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook for cancellable async operations
 * @returns Object with isCancelled ref and cancel function
 */
export function useCancellablePromise() {
  const isCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  const cancel = () => {
    isCancelledRef.current = true;
  };

  const makeCancellable = <T>(promise: Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      promise
        .then((result) => {
          if (!isCancelledRef.current) {
            resolve(result);
          }
        })
        .catch((error) => {
          if (!isCancelledRef.current) {
            reject(error);
          }
        });
    });
  };

  return {
    isCancelled: isCancelledRef,
    cancel,
    makeCancellable,
  };
}

/**
 * Hook for managing loading states with automatic cleanup
 * @param initialLoading - Initial loading state
 * @returns Object with loading state and setters
 */
export function useLoadingState(initialLoading: boolean = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const { makeCancellable, isCancelled } = useCancellablePromise();

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    if (!isCancelled.current) {
      setLoading(false);
    }
  };

  const setLoadingError = (errorMessage: string) => {
    if (!isCancelled.current) {
      setLoading(false);
      setError(errorMessage);
    }
  };

  const executeAsync = async <T>(
    asyncOperation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      startLoading();
      const result = await makeCancellable(asyncOperation());
      stopLoading();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setLoadingError(errorMessage);
      return null;
    }
  };

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    executeAsync,
    clearError: () => setError(null),
  };
}

/**
 * Hook for auto-refresh functionality with proper cleanup
 * @param callback - The callback to execute on each refresh
 * @param interval - The refresh interval in milliseconds
 * @param enabled - Whether auto-refresh is enabled
 * @param deps - Dependencies that should trigger a refresh
 */
export function useAutoRefresh(
  callback: () => void,
  interval: number,
  enabled: boolean = true,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    if (enabled) {
      // Execute immediately
      callbackRef.current();

      // Set up interval
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [enabled, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const forceRefresh = () => {
    callbackRef.current();
  };

  return { forceRefresh };
}
