import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import authService from '../../services/auth';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../services/auth', () => ({
  login: jest.fn(),
  isAuthenticated: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated.mockReturnValue(false);
  });

  it('renders login form correctly', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates username format', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'invalid username');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/username can only contain/i)).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'weak');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    authService.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'Password123!'
      });
    });
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    authService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('toggles password visibility', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to register page', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const registerLink = screen.getByRole('link', { name: /sign up/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('handles keyboard navigation', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Tab through form elements
    await user.tab();
    expect(usernameInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  it('clears form errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 't');

    await waitFor(() => {
      expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
    });
  });

  it('handles form submission with Enter key', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    authService.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
    });
  });

  it('displays server validation errors', async () => {
    const validationError = {
      response: {
        status: 422,
        data: {
          errors: {
            username: ['Username not found'],
            password: ['Password is incorrect']
          }
        }
      }
    };
    authService.login.mockRejectedValue(validationError);

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username not found')).toBeInTheDocument();
      expect(screen.getByText('Password is incorrect')).toBeInTheDocument();
    });
  });
});