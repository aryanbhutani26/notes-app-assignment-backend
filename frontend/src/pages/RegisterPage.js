import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ROUTES } from '../config/routes';
import { toast } from 'react-toastify';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate password strength
  const validatePasswordStrength = (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      score: [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    };
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be 50 characters or less';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData.username.trim(), formData.password);
      
      // Show success message
      toast.success('Registration successful! Please sign in with your new account.');
      
      // Navigate to login page after successful registration
      navigate(ROUTES.LOGIN, { 
        state: { 
          message: 'Registration successful! Please sign in with your new account.',
          username: formData.username.trim() // Pre-fill username on login page
        } 
      });
    } catch (err) {
      // Error is handled by the auth context and displayed via toast
      console.error('Registration failed:', err);
      
      // Focus back to username field for retry
      document.getElementById('username')?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (isLoading) {
    return (
      <div className="register-loading">
        <LoadingSpinner />
        <p>Checking authentication...</p>
      </div>
    );
  }

  const passwordStrength = formData.password ? validatePasswordStrength(formData.password) : null;

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join Notes to start organizing your thoughts</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className={`form-control ${errors.username ? 'error' : ''}`}
              placeholder="Choose a username"
              disabled={isSubmitting}
              autoComplete="username"
              autoFocus
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
            <small className="form-hint">
              3-50 characters, letters, numbers, and underscores only
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Create a strong password"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
            
            {/* Password strength indicator */}
            {passwordStrength && formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill strength-${passwordStrength.score}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="strength-requirements">
                  <small className={passwordStrength.minLength ? 'valid' : 'invalid'}>
                    ✓ At least 6 characters
                  </small>
                  <small className={passwordStrength.hasUpperCase ? 'valid' : 'invalid'}>
                    ✓ Uppercase letter
                  </small>
                  <small className={passwordStrength.hasLowerCase ? 'valid' : 'invalid'}>
                    ✓ Lowercase letter
                  </small>
                  <small className={passwordStrength.hasNumbers ? 'valid' : 'invalid'}>
                    ✓ Number
                  </small>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary register-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;