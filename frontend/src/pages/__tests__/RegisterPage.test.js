import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import RegisterPage from '../RegisterPage';
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
  register: jest.fn(),
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

describe('RegisterPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated.mockReturnValue(false);
  });

  it('renders registration form correctly', () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates all required fields', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates username format', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
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
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    await user.type(passwordInput, 'weak');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    await user.type(passwordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');

    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockUser = { id: 1, username: 'newuser', email: 'new@example.com' };
    authService.register.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'newuser');
    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!'
      });
    });
  });

  it('handles registration error', async () => {
    const errorMessage = 'Username already exists';
    authService.register.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'existinguser');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    authService.register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'newuser');
    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('toggles password visibility', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i });

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  it('navigates to login page', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('handles server validation errors', async () => {
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

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'existinguser');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username is already taken')).toBeInTheDocument();
      expect(screen.getByText('Email is already registered')).toBeInTheDocument();
    });
  });

  it('clears form errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
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

  it('updates password confirmation validation when password changes', async () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');

    // Change password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'NewPassword123!');
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });
});