import { apiService } from './api';
import { toast } from 'react-toastify';

// JWT token utilities
const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

// Authentication service
export const authService = {
  // Login user
  login: async (username, password) => {
    try {
      const response = await apiService.post('/auth/login', {
        username,
        password
      });

      const { access_token } = response.data;
      
      if (access_token) {
        // Store token
        apiService.setAuthToken(access_token);
        
        // Get user info from token
        const user = authService.getCurrentUser();
        
        toast.success('Login successful!');
        return { user, token: access_token };
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (username, password) => {
    try {
      const response = await apiService.post('/auth/register', {
        username,
        password
      });

      toast.success('Registration successful! Please login.');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    try {
      apiService.clearAuthToken();
      toast.success('Logged out successfully');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },

  // Get current user from token
  getCurrentUser: () => {
    try {
      const token = apiService.getAuthToken();
      if (!token || isTokenExpired(token)) {
        return null;
      }

      const payload = parseJWT(token);
      if (!payload) return null;

      return {
        id: payload.user_id,
        username: payload.username,
        exp: payload.exp
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = apiService.getAuthToken();
    return token && !isTokenExpired(token);
  },

  // Get stored token
  getToken: () => {
    return apiService.getAuthToken();
  },

  // Validate token
  validateToken: () => {
    const token = apiService.getAuthToken();
    if (!token) return false;
    
    if (isTokenExpired(token)) {
      // Token expired, clear it
      authService.logout();
      return false;
    }
    
    return true;
  },

  // Initialize auth state (call on app startup)
  initializeAuth: () => {
    const token = apiService.getAuthToken();
    if (token && !isTokenExpired(token)) {
      // Token is valid, set it in axios headers
      apiService.setAuthToken(token);
      return authService.getCurrentUser();
    } else if (token) {
      // Token exists but is expired, clear it
      authService.logout();
    }
    return null;
  },

  // Check token expiration and auto-logout if needed
  checkTokenExpiration: () => {
    const token = apiService.getAuthToken();
    if (token && isTokenExpired(token)) {
      toast.warning('Your session has expired. Please login again.');
      authService.logout();
      return false;
    }
    return true;
  }
};

export default authService;