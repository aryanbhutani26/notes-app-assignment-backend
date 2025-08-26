import axios from 'axios';
import { toast } from 'react-toastify';
import apiService from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Configuration', () => {
    it('should have correct base URL', () => {
      expect(apiService.defaults.baseURL).toBe('http://localhost:8000/api');
    });

    it('should have correct timeout', () => {
      expect(apiService.defaults.timeout).toBe(10000);
    });

    it('should have correct headers', () => {
      expect(apiService.defaults.headers.common['Content-Type']).toBe('application/json');
    });
  });

  describe('Token Management', () => {
    const mockToken = 'mock-jwt-token';

    it('should set auth token', () => {
      apiService.setAuthToken(mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(apiService.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should get auth token', () => {
      localStorageMock.getItem.mockReturnValue(mockToken);
      const token = apiService.getAuthToken();
      expect(token).toBe(mockToken);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    });

    it('should clear auth token', () => {
      apiService.clearAuthToken();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(apiService.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should initialize with stored token', () => {
      localStorageMock.getItem.mockReturnValue(mockToken);
      // Re-import to trigger initialization
      jest.resetModules();
      require('../api');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Request Interceptor', () => {
    it('should add auth token to requests when available', () => {
      const mockToken = 'test-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const config = { headers: {} };
      const interceptor = apiService.interceptors.request.handlers[0].fulfilled;
      const result = interceptor(config);
      
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should not add auth token when not available', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const config = { headers: {} };
      const interceptor = apiService.interceptors.request.handlers[0].fulfilled;
      const result = interceptor(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should return response data on success', () => {
      const mockResponse = { data: { message: 'success' } };
      const interceptor = apiService.interceptors.response.handlers[0].fulfilled;
      const result = interceptor(mockResponse);
      
      expect(result).toBe(mockResponse);
    });

    it('should handle network errors', () => {
      const networkError = { request: {}, message: 'Network Error' };
      const interceptor = apiService.interceptors.response.handlers[0].rejected;
      
      expect(() => interceptor(networkError)).rejects.toEqual({
        message: 'Network error',
        status: 0,
        data: null
      });
      
      expect(toast.error).toHaveBeenCalledWith('Network error. Please check your connection.');
    });

    it('should handle 401 errors without showing toast', () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      const interceptor = apiService.interceptors.response.handlers[0].rejected;
      
      expect(() => interceptor(authError)).rejects.toEqual({
        message: 'Unauthorized',
        status: 401,
        data: { message: 'Unauthorized' }
      });
      
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should handle other HTTP errors with toast', () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      const interceptor = apiService.interceptors.response.handlers[0].rejected;
      
      expect(() => interceptor(serverError)).rejects.toEqual({
        message: 'Internal Server Error',
        status: 500,
        data: { message: 'Internal Server Error' }
      });
      
      expect(toast.error).toHaveBeenCalledWith('Internal Server Error');
    });

    it('should handle errors without response data', () => {
      const genericError = {
        response: {
          status: 404
        }
      };
      const interceptor = apiService.interceptors.response.handlers[0].rejected;
      
      expect(() => interceptor(genericError)).rejects.toEqual({
        message: 'Request failed with status 404',
        status: 404,
        data: null
      });
      
      expect(toast.error).toHaveBeenCalledWith('Request failed with status 404');
    });
  });

  describe('HTTP Methods', () => {
    const mockData = { id: 1, name: 'test' };
    const mockResponse = { data: mockData };

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue(mockResponse);
      mockedAxios.post.mockResolvedValue(mockResponse);
      mockedAxios.put.mockResolvedValue(mockResponse);
      mockedAxios.patch.mockResolvedValue(mockResponse);
      mockedAxios.delete.mockResolvedValue(mockResponse);
    });

    it('should make GET requests', async () => {
      const result = await apiService.get('/test');
      expect(mockedAxios.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toBe(mockResponse);
    });

    it('should make POST requests', async () => {
      const postData = { name: 'new item' };
      const result = await apiService.post('/test', postData);
      expect(mockedAxios.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toBe(mockResponse);
    });

    it('should make PUT requests', async () => {
      const putData = { id: 1, name: 'updated item' };
      const result = await apiService.put('/test/1', putData);
      expect(mockedAxios.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toBe(mockResponse);
    });

    it('should make PATCH requests', async () => {
      const patchData = { name: 'patched item' };
      const result = await apiService.patch('/test/1', patchData);
      expect(mockedAxios.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
      expect(result).toBe(mockResponse);
    });

    it('should make DELETE requests', async () => {
      const result = await apiService.delete('/test/1');
      expect(mockedAxios.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toBe(mockResponse);
    });
  });
});