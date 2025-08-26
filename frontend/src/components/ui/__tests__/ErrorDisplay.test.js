import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorMessage,
  FieldError,
  FormError,
  SuccessMessage,
  WarningMessage,
  InfoMessage,
  ValidationSummary
} from '../ErrorDisplay';

describe('ErrorDisplay Components', () => {
  describe('ErrorMessage', () => {
    it('renders error message correctly', () => {
      const message = 'Something went wrong';
      render(<ErrorMessage message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
      render(<ErrorMessage message="Error" show={false} />);
      
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('does not render when message is empty', () => {
      render(<ErrorMessage message="" />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders without icon when icon is false', () => {
      render(<ErrorMessage message="Error" icon={false} />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<ErrorMessage message="Error" className="custom-error" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveClass('custom-error');
    });
  });

  describe('FieldError', () => {
    it('renders field error correctly', () => {
      const error = 'Field is required';
      render(<FieldError error={error} fieldName="username" />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('does not render when error is null', () => {
      render(<FieldError error={null} fieldName="username" />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not render when show is false', () => {
      render(<FieldError error="Error" fieldName="username" show={false} />);
      
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  describe('FormError', () => {
    it('renders single error correctly', () => {
      const error = 'Form submission failed';
      render(<FormError error={error} />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders multiple errors correctly', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      render(<FormError errors={errors} />);
      
      errors.forEach(error => {
        expect(screen.getByText(error)).toBeInTheDocument();
      });
      expect(screen.getByText(/please correct the following errors/i)).toBeInTheDocument();
    });

    it('renders dismissible error with close button', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();
      
      render(<FormError error="Error" dismissible onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      expect(dismissButton).toBeInTheDocument();
      
      await user.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('does not render when no error or errors provided', () => {
      render(<FormError />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('uses custom title', () => {
      const customTitle = 'Custom error title';
      render(<FormError errors={['Error 1']} title={customTitle} />);
      
      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });
  });

  describe('SuccessMessage', () => {
    it('renders success message correctly', () => {
      const message = 'Operation successful';
      render(<SuccessMessage message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders dismissible success message', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();
      
      render(<SuccessMessage message="Success" dismissible onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss message/i });
      await user.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });

    it('renders without icon when icon is false', () => {
      render(<SuccessMessage message="Success" icon={false} />);
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.queryByText('✅')).not.toBeInTheDocument();
    });
  });

  describe('WarningMessage', () => {
    it('renders warning message correctly', () => {
      const message = 'This is a warning';
      render(<WarningMessage message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders dismissible warning message', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();
      
      render(<WarningMessage message="Warning" dismissible onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss warning/i });
      await user.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('InfoMessage', () => {
    it('renders info message correctly', () => {
      const message = 'This is information';
      render(<InfoMessage message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders dismissible info message', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();
      
      render(<InfoMessage message="Info" dismissible onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss info/i });
      await user.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('ValidationSummary', () => {
    it('renders validation errors correctly', () => {
      const errors = {
        username: 'Username is required',
        email: 'Email is invalid',
        password: 'Password is too weak'
      };
      
      render(<ValidationSummary errors={errors} />);
      
      Object.values(errors).forEach(error => {
        expect(screen.getByText(error)).toBeInTheDocument();
      });
    });

    it('does not render when no errors', () => {
      render(<ValidationSummary errors={{}} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('filters out falsy error values', () => {
      const errors = {
        username: 'Username is required',
        email: null,
        password: '',
        confirmPassword: undefined
      };
      
      render(<ValidationSummary errors={errors} />);
      
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });

    it('uses custom title', () => {
      const customTitle = 'Fix these issues:';
      const errors = { username: 'Required' };
      
      render(<ValidationSummary errors={errors} title={customTitle} />);
      
      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
      const errors = { username: 'Required' };
      render(<ValidationSummary errors={errors} show={false} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all components have proper ARIA roles', () => {
      render(
        <div>
          <ErrorMessage message="Error" />
          <SuccessMessage message="Success" />
          <WarningMessage message="Warning" />
          <InfoMessage message="Info" />
          <FormError error="Form error" />
        </div>
      );
      
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(5);
    });

    it('dismiss buttons have proper labels', () => {
      render(
        <div>
          <FormError error="Error" dismissible onDismiss={() => {}} />
          <SuccessMessage message="Success" dismissible onDismiss={() => {}} />
          <WarningMessage message="Warning" dismissible onDismiss={() => {}} />
          <InfoMessage message="Info" dismissible onDismiss={() => {}} />
        </div>
      );
      
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss message/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss warning/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss info/i })).toBeInTheDocument();
    });
  });
});