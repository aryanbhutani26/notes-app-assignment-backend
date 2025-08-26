import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

// Generic API hook for making HTTP requests with loading states
export const useApi = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Execute API request
  const execute = useCallback(async (apiCall) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await apiCall();
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset
  };
};

// Specific API hooks for common operations
export const useApiGet = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (customUrl = url, customOptions = options) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.get(customUrl, customOptions);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [url, options]);

  return {
    data,
    error,
    isLoading,
    execute
  };
};

export const useApiPost = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (url, postData = {}, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.post(url, postData, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    execute
  };
};

export const useApiPut = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (url, putData = {}, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.put(url, putData, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    execute
  };
};

export const useApiDelete = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (url, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.delete(url, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    execute
  };
};

export default useApi;