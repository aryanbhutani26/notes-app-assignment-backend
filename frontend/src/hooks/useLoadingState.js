import { useState, useCallback, useRef } from 'react';

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    loadingRef.current = true;
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  const setLoadingError = useCallback((error) => {
    setError(error);
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    loadingRef.current = false;
  }, []);

  // Wrapper for async operations
  const withLoading = useCallback(async (asyncOperation) => {
    startLoading();
    try {
      const result = await asyncOperation();
      stopLoading();
      return result;
    } catch (error) {
      setLoadingError(error);
      throw error;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset,
    withLoading,
    // Utility to check if currently loading (useful for cleanup)
    get isCurrentlyLoading() {
      return loadingRef.current;
    }
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = (keys = []) => {
  const [loadingStates, setLoadingStates] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );
  const [errors, setErrors] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
  );

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
    if (isLoading) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const reset = useCallback((key) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      setErrors(prev => ({ ...prev, [key]: null }));
    } else {
      setLoadingStates(keys.reduce((acc, k) => ({ ...acc, [k]: false }), {}));
      setErrors(keys.reduce((acc, k) => ({ ...acc, [k]: null }), {}));
    }
  }, [keys]);

  const withLoading = useCallback(async (key, asyncOperation) => {
    setLoading(key, true);
    try {
      const result = await asyncOperation();
      setLoading(key, false);
      return result;
    } catch (error) {
      setError(key, error);
      throw error;
    }
  }, [setLoading, setError]);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    reset,
    withLoading,
    // Utility getters
    isAnyLoading: Object.values(loadingStates).some(Boolean),
    hasAnyError: Object.values(errors).some(Boolean),
    getLoadingState: (key) => loadingStates[key] || false,
    getError: (key) => errors[key] || null
  };
};

// Hook for debounced loading states (useful for search)
export const useDebouncedLoadingState = (delay = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const startLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      setError(null);
    }, delay);
  }, [delay]);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((error) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setError(error);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

// Hook for managing async operations with automatic loading states
export const useAsyncOperation = (operation, dependencies = []) => {
  const { isLoading, error, withLoading, reset } = useLoadingState();
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      const result = await withLoading(() => operation(...args));
      setData(result);
      return result;
    } catch (error) {
      setData(null);
      throw error;
    }
  }, [withLoading, operation, ...dependencies]);

  const resetAll = useCallback(() => {
    reset();
    setData(null);
  }, [reset]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset: resetAll
  };
};

export default useLoadingState;