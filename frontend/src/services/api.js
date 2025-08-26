import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (!response) {
      // Network error
      toast.error('Network error. Please check your connection.');
      return Promise.reject({
        message: 'Network error',
        status: 0,
        data: null
      });
    }

    const { status, data } = response;
    let errorMessage = 'An error occurred';

    switch (status) {
      case 400:
        errorMessage = data?.detail || 'Invalid request data';
        break;
      case 401:
        errorMessage = 'Authentication required';
        // Clear token and redirect to login
        localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token');
        window.location.href = '/login';
        break;
      case 403:
        errorMessage = 'Access denied';
        break;
      case 404:
        errorMessage = 'Resource not found';
        break;
      case 409:
        errorMessage = data?.detail || 'Conflict occurred';
        break;
      case 422:
        errorMessage = 'Validation error';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        errorMessage = data?.detail || `Error ${status}`;
    }

    // Show toast for non-401 errors (401 redirects to login)
    if (status !== 401) {
      toast.error(errorMessage);
    }

    return Promise.reject({
      message: errorMessage,
      status,
      data: data || null
    });
  }
);

// API service methods
export const apiService = {
  // Generic request methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),

  // Utility methods
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token');
    }
  },

  getAuthToken: () => {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token');
  },

  clearAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'notes_app_token');
    return !!token;
  }
};

export default api;