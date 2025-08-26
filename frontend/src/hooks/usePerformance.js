import { useEffect, useRef, useState, useCallback } from 'react';

// Hook for measuring component render performance
export const useRenderPerformance = (componentName) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        totalRenderTime.current += renderTime;

        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
          console.log(`${componentName} average render time: ${(totalRenderTime.current / renderCount.current).toFixed(2)}ms`);
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0
  };
};

// Hook for measuring API call performance
export const useApiPerformance = () => {
  const [metrics, setMetrics] = useState({});

  const measureApiCall = useCallback(async (apiCall, operationName) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      setMetrics(prev => ({
        ...prev,
        [operationName]: {
          ...prev[operationName],
          lastDuration: duration,
          totalCalls: (prev[operationName]?.totalCalls || 0) + 1,
          totalTime: (prev[operationName]?.totalTime || 0) + duration,
          successCount: (prev[operationName]?.successCount || 0) + 1
        }
      }));

      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${operationName}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      setMetrics(prev => ({
        ...prev,
        [operationName]: {
          ...prev[operationName],
          lastDuration: duration,
          totalCalls: (prev[operationName]?.totalCalls || 0) + 1,
          totalTime: (prev[operationName]?.totalTime || 0) + duration,
          errorCount: (prev[operationName]?.errorCount || 0) + 1
        }
      }));

      throw error;
    }
  }, []);

  const getMetrics = useCallback((operationName) => {
    const metric = metrics[operationName];
    if (!metric) return null;

    return {
      ...metric,
      averageDuration: metric.totalTime / metric.totalCalls,
      successRate: metric.successCount / metric.totalCalls,
      errorRate: (metric.errorCount || 0) / metric.totalCalls
    };
  }, [metrics]);

  return { measureApiCall, getMetrics, metrics };
};

// Hook for monitoring memory usage
export const useMemoryMonitor = (interval = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    if (!('memory' in performance)) {
      return;
    }

    const updateMemoryInfo = () => {
      const memory = performance.memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      });
    };

    updateMemoryInfo();
    const intervalId = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
};

// Hook for measuring page load performance
export const usePageLoadPerformance = () => {
  const [loadMetrics, setLoadMetrics] = useState(null);

  useEffect(() => {
    const measurePageLoad = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
          setLoadMetrics({
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            domInteractive: navigation.domInteractive - navigation.navigationStart,
            firstPaint: null,
            firstContentfulPaint: null
          });

          // Get paint metrics
          const paintEntries = performance.getEntriesByType('paint');
          const paintMetrics = {};
          
          paintEntries.forEach(entry => {
            paintMetrics[entry.name.replace('-', '')] = entry.startTime;
          });

          setLoadMetrics(prev => ({
            ...prev,
            ...paintMetrics
          }));
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, []);

  return loadMetrics;
};

// Hook for debouncing expensive operations
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling expensive operations
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

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
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
};

// Hook for measuring scroll performance
export const useScrollPerformance = () => {
  const [scrollMetrics, setScrollMetrics] = useState({
    isScrolling: false,
    scrollTop: 0,
    scrollDirection: null,
    scrollSpeed: 0
  });

  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const currentTime = Date.now();
      
      const scrollDistance = Math.abs(currentScrollTop - lastScrollTop.current);
      const scrollTime = currentTime - lastScrollTime.current;
      const scrollSpeed = scrollTime > 0 ? scrollDistance / scrollTime : 0;

      const scrollDirection = currentScrollTop > lastScrollTop.current ? 'down' : 'up';

      setScrollMetrics({
        isScrolling: true,
        scrollTop: currentScrollTop,
        scrollDirection,
        scrollSpeed
      });

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scroll end timeout
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollMetrics(prev => ({
          ...prev,
          isScrolling: false,
          scrollSpeed: 0
        }));
      }, 150);

      lastScrollTop.current = currentScrollTop;
      lastScrollTime.current = currentTime;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return scrollMetrics;
};

// Performance monitoring context
export const PerformanceContext = React.createContext({});

export const PerformanceProvider = ({ children }) => {
  const [performanceData, setPerformanceData] = useState({
    renderTimes: {},
    apiMetrics: {},
    memoryUsage: null,
    pageLoadMetrics: null
  });

  const updatePerformanceData = useCallback((type, data) => {
    setPerformanceData(prev => ({
      ...prev,
      [type]: { ...prev[type], ...data }
    }));
  }, []);

  return (
    <PerformanceContext.Provider value={{ performanceData, updatePerformanceData }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};