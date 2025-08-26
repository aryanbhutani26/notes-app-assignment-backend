import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import './RetryButton.css';

const RetryButton = ({ 
  onRetry, 
  disabled = false, 
  className = '', 
  children = 'Retry',
  showIcon = true,
  variant = 'primary',
  maxRetries = 3,
  retryDelay = 1000
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  const handleRetry = async () => {
    if (isRetrying || disabled || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setLastError(null);

    try {
      // Add delay for better UX
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      setLastError(error);
      setRetryCount(prev => prev + 1);
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isMaxRetriesReached = retryCount >= maxRetries;

  return (
    <div className="retry-container">
      <button
        onClick={handleRetry}
        disabled={disabled || isRetrying || isMaxRetriesReached}
        className={`btn btn-${variant} retry-button ${className}`}
      >
        {isRetrying ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Retrying...</span>
          </>
        ) : (
          <>
            {showIcon && <RefreshCw size={16} />}
            <span>{children}</span>
          </>
        )}
      </button>

      {retryCount > 0 && !isMaxRetriesReached && (
        <div className="retry-info">
          <span className="retry-count">
            Attempt {retryCount} of {maxRetries}
          </span>
        </div>
      )}

      {isMaxRetriesReached && (
        <div className="retry-error">
          <span>Maximum retry attempts reached. Please refresh the page or contact support.</span>
        </div>
      )}

      {lastError && (
        <div className="retry-error-details">
          <small>Last error: {lastError.message}</small>
        </div>
      )}
    </div>
  );
};

// Hook for retry logic
export const useRetry = (asyncFunction, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = false
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);

  const retry = async (...args) => {
    setIsRetrying(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFunction(...args);
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (err) {
        setError(err);
        setRetryCount(attempt + 1);

        if (attempt === maxRetries) {
          setIsRetrying(false);
          throw err;
        }

        // Calculate delay with optional exponential backoff
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const reset = () => {
    setIsRetrying(false);
    setRetryCount(0);
    setError(null);
  };

  return {
    retry,
    reset,
    isRetrying,
    retryCount,
    error,
    isMaxRetriesReached: retryCount >= maxRetries
  };
};

export default RetryButton;