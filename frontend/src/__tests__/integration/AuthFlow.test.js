import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import App from '../../App';
import authService from '../../services/auth';
import notesService from '../../services/notes';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  },
  ToastContainer: () => null
}));

jest.mock('../../services/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
  checkTokenExpiration: jest.fn()
}));

jest.mock('../../services/notes', () => ({
  getAllNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  getNoteById: jest.fn()
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Authentication Flow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated.mockReturnValue(false);
    authService.getCurrentUser.mockReturnValue(null);
    authService.checkTokenExpiration.mockReturnValue(false);
    notesService.getAllNotes.mockResolvedValue([]);
  });

  describe('User Registration Flow', () => {
    it('completes full registration workflow', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com'
      };

      authService.register.mockResolvedValue(mockUser);

      render(<App />);

      // Should start at login page (redirected from root)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Navigate to registration
      const registerLink = screen.getByRole('link', { name: /sign up/i });
      await user.click(registerLink);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      });

      // Fill out registration form
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');

      // Submit registration
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Verify registration was called
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123!'
        });
      });

      // Should show success message and redirect to login
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Registration successful')
      );
    });

    it('handles registration validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            errors: {
              username: ['Username is already taken'],
              email: ['Email is already registered']
            }
          }
        }
      };

      authService.register.mockRejectedValue(validationError);

      render(<App />);

      // Navigate to registration
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      const registerLink = screen.getByRole('link', { name: /sign up/i });
      await user.click(registerLink);

      // Fill and submit form
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should display validation errors
      await waitFor(() => {
        expect(screen.getByText('Username is already taken')).toBeInTheDocument();
        expect(screen.getByText('Email is already registered')).toBeInTheDocument();
      });
    });
  });

  describe('User Login Flow', () => {
    it('completes full login workflow', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      authService.login.mockResolvedValue({
        user: mockUser,
        token: 'mock-jwt-token'
      });

      // Mock authenticated state after login
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);

      render(<App />);

      // Should start at login page
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Fill out login form
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'Password123!');

      // Submit login
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Verify login was called
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'Password123!'
        });
      });

      // Should show success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Login successful')
      );
    });

    it('handles login authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };

      authService.login.mockRejectedValue(authError);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Fill and submit form with invalid credentials
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Should remain on login page
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('User Logout Flow', () => {
    it('completes logout workflow', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      // Start with authenticated state
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);
      authService.logout.mockResolvedValue(true);

      render(<App />);

      // Should show authenticated content
      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Verify logout was called
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      // Should show success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Logged out successfully')
      );
    });
  });

  describe('Session Management', () => {
    it('handles token expiration', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      // Start with authenticated state
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });

      // Simulate token expiration
      authService.checkTokenExpiration.mockReturnValue(false);
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockReturnValue(null);

      // Trigger a component re-render that would check token
      // This could be done by navigating or triggering an API call
      // For this test, we'll simulate the effect of token expiration

      // Should show warning and redirect to login
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining('session has expired')
      );
    });

    it('maintains authentication state across page refreshes', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      // Simulate having a valid token in storage
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);

      render(<App />);

      // Should automatically show authenticated content
      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });

      // Should not show login page
      expect(screen.queryByRole('heading', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });

  describe('Protected Route Access', () => {
    it('redirects unauthenticated users to login', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockReturnValue(null);

      render(<App />);

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('allows authenticated users to access protected routes', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);

      render(<App />);

      // Should show protected content
      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles authentication service errors gracefully', async () => {
      // Mock a critical error in auth service
      authService.isAuthenticated.mockImplementation(() => {
        throw new Error('Critical auth error');
      });

      render(<App />);

      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});