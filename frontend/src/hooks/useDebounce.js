import { useState, useEffect, useCallback } from 'react';

// Custom hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay is reached
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for debounced callback
export const useDebounceCallback = (callback, delay, dependencies = []) => {
  const memoizedCallback = useCallback(callback, [callback]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      memoizedCallback();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [memoizedCallback, delay, ...dependencies]);
};

export default useDebounce;