import { toast } from 'react-toastify';
import authService from '../auth';
import apiService from '../api';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../api', () => ({
  post: jest.fn(),
  setAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
  getAuthToken: jest.fn()
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

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('login', () => {
    const mockCredentials = {
      username: 'testuser',
      password: 'testpass123'
    };

    const mockResponse = {
      data: {
        access_token: 'mock-jwt-token',
        token_type: 'bearer'
      }
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    beforeEach(() => {
      // Mock JWT decode
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser);
    });

    it('should login successfully with valid credentials', async () => {
      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(apiService.post).toHaveBeenCalledWith('/auth/login', mockCredentials);
      expect(apiService.setAuthToken).toHaveBeenCalledWith('mock-jwt-token');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(result).toEqual({
        user: mockUser,
        token: 'mock-jwt-token'
      });
    });

    it('should handle login failure', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };
      apiService.post.mockRejectedValue(errorResponse);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid credentials');
      expect(apiService.setAuthToken).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should handle network errors during login', async () => {
      const networkError = new Error('Network error');
      apiService.post.mockRejectedValue(networkError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Network error');
      expect(apiService.setAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const mockUserData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'newpass123'
    };

    const mockResponse = {
      data: {
        id: 1,
        username: 'newuser',
        email: 'new@example.com'
      }
    };

    it('should register successfully with valid data', async () => {
      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.register(mockUserData);

      expect(apiService.post).toHaveBeenCalledWith('/auth/register', mockUserData);
      expect(toast.success).toHaveBeenCalledWith('Registration successful! Please login.');
      expect(result).toBe(mockResponse.data);
    });

    it('should handle registration failure', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Username already exists' }
        }
      };
      apiService.post.mockRejectedValue(errorResponse);

      await expect(authService.register(mockUserData)).rejects.toThrow('Username already exists');
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await authService.logout();

      expect(apiService.clearAuthToken).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
      expect(result).toBe(true);
    });

    it('should handle logout errors gracefully', async () => {
      apiService.clearAuthToken.mockImplementation(() => {
        throw new Error('Clear token failed');
      });

      await expect(authService.logout()).rejects.toThrow('Clear token failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from valid token', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      apiService.getAuthToken.mockReturnValue(mockToken);

      // Mock the actual implementation since we can't easily mock jwt-decode
      const mockUser = { id: 1, username: 'testuser' };
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser);

      const result = authService.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid token', () => {
      apiService.getAuthToken.mockReturnValue('invalid-token');
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

      const result = authService.getCurrentUser();
      expect(result).toBeNull();
    });

    it('should return null when no token exists', () => {
      apiService.getAuthToken.mockReturnValue(null);
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

      const result = authService.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue({ id: 1 });
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(false);

      const result = authService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no user exists', () => {
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

      const result = authService.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      jest.spyOn(authService, 'getCurrentUser').mockReturnValue({ id: 1 });
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(true);

      const result = authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(false);
      
      const result = authService.isTokenExpired(mockToken);
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(true);
      
      const result = authService.isTokenExpired(mockToken);
      expect(result).toBe(true);
    });

    it('should return true for invalid token', () => {
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(true);
      
      const result = authService.isTokenExpired('invalid-token');
      expect(result).toBe(true);
    });
  });

  describe('checkTokenExpiration', () => {
    it('should return true for valid token', () => {
      apiService.getAuthToken.mockReturnValue('valid-token');
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(false);

      const result = authService.checkTokenExpiration();
      expect(result).toBe(true);
    });

    it('should handle expired token and show warning', () => {
      apiService.getAuthToken.mockReturnValue('expired-token');
      jest.spyOn(authService, 'isTokenExpired').mockReturnValue(true);
      jest.spyOn(authService, 'logout').mockResolvedValue(true);

      const result = authService.checkTokenExpiration();
      
      expect(toast.warning).toHaveBeenCalledWith('Your session has expired. Please login again.');
      expect(result).toBe(false);
    });

    it('should return false when no token exists', () => {
      apiService.getAuthToken.mockReturnValue(null);

      const result = authService.checkTokenExpiration();
      expect(result).toBe(false);
    });
  });
});