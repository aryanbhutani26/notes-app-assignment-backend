import React from 'react';
import './ErrorDisplay.css';

// Generic error message component
export const ErrorMessage = ({ 
  message, 
  className = '', 
  show = true,
  icon = true 
}) => {
  if (!show || !message) return null;

  return (
    <div className={`error-message ${className}`} role="alert">
      {icon && <span className="error-icon" aria-hidden="true">⚠️</span>}
      <span className="error-text">{message}</span>
    </div>
  );
};

// Field-specific error component
export const FieldError = ({ 
  error, 
  fieldName,
  className = '',
  show = true 
}) => {
  if (!show || !error) return null;

  return (
    <ErrorMessage 
      message={error} 
      className={`field-error ${className}`}
      show={show}
    />
  );
};

// Form-level error display
export const FormError = ({ 
  error, 
  errors = [], 
  title = 'Please correct the following errors:',
  className = '',
  show = true,
  dismissible = false,
  onDismiss
}) => {
  if (!show || (!error && errors.length === 0)) return null;

  const errorList = error ? [error] : errors;

  return (
    <div className={`form-error ${className}`} role="alert">
      {dismissible && (
        <button 
          className="form-error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
      
      <div className="form-error-icon" aria-hidden="true">
        ⚠️
      </div>
      
      <div className="form-error-content">
        {errorList.length > 1 ? (
          <>
            <div className="form-error-title">{title}</div>
            <ul className="form-error-list">
              {errorList.map((err, index) => (
                <li key={index} className="form-error-item">
                  {err}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="form-error-message">
            {errorList[0]}
          </div>
        )}
      </div>
    </div>
  );
};

// Success message component
export const SuccessMessage = ({ 
  message, 
  className = '', 
  show = true,
  icon = true,
  dismissible = false,
  onDismiss
}) => {
  if (!show || !message) return null;

  return (
    <div className={`success-message ${className}`} role="alert">
      {dismissible && (
        <button 
          className="success-message-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
      
      {icon && <span className="success-icon" aria-hidden="true">✅</span>}
      <span className="success-text">{message}</span>
    </div>
  );
};

// Warning message component
export const WarningMessage = ({ 
  message, 
  className = '', 
  show = true,
  icon = true,
  dismissible = false,
  onDismiss
}) => {
  if (!show || !message) return null;

  return (
    <div className={`warning-message ${className}`} role="alert">
      {dismissible && (
        <button 
          className="warning-message-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss warning"
        >
          ×
        </button>
      )}
      
      {icon && <span className="warning-icon" aria-hidden="true">⚠️</span>}
      <span className="warning-text">{message}</span>
    </div>
  );
};

// Info message component
export const InfoMessage = ({ 
  message, 
  className = '', 
  show = true,
  icon = true,
  dismissible = false,
  onDismiss
}) => {
  if (!show || !message) return null;

  return (
    <div className={`info-message ${className}`} role="alert">
      {dismissible && (
        <button 
          className="info-message-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss info"
        >
          ×
        </button>
      )}
      
      {icon && <span className="info-icon" aria-hidden="true">ℹ️</span>}
      <span className="info-text">{message}</span>
    </div>
  );
};

// Validation summary component
export const ValidationSummary = ({ 
  errors = {}, 
  className = '',
  show = true,
  title = 'Please correct the following errors:'
}) => {
  const errorMessages = Object.values(errors).filter(Boolean);
  
  if (!show || errorMessages.length === 0) return null;

  return (
    <FormError 
      errors={errorMessages}
      title={title}
      className={`validation-summary ${className}`}
      show={show}
    />
  );
};

// Password strength indicator
export const PasswordStrengthIndicator = ({ 
  password, 
  strengthChecker,
  className = '',
  show = true,
  showRequirements = true
}) => {
  if (!show || !password) return null;

  const strength = strengthChecker(password);
  
  return (
    <div className={`password-strength ${className}`}>
      <div className="strength-bar">
        <div 
          className={`strength-fill strength-${strength.level}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
          aria-label={`Password strength: ${strength.level}`}
        />
      </div>
      
      <div className="strength-label">
        Password strength: <span className={`strength-text strength-${strength.level}`}>
          {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
        </span>
      </div>
      
      {showRequirements && strength.feedback.length > 0 && (
        <div className="strength-requirements">
          <div className="strength-requirements-title">Requirements:</div>
          <ul className="strength-requirements-list">
            {strength.feedback.map((requirement, index) => (
              <li key={index} className="strength-requirement">
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Inline validation component
export const InlineValidation = ({ 
  value, 
  validator, 
  className = '',
  show = true,
  showSuccess = false
}) => {
  if (!show) return null;

  const error = validator ? validator(value) : null;
  const isValid = !error && value;

  return (
    <div className={`inline-validation ${className}`}>
      {error && (
        <ErrorMessage message={error} className="inline-error" />
      )}
      {showSuccess && isValid && (
        <SuccessMessage message="Valid" className="inline-success" icon={false} />
      )}
    </div>
  );
};

export default {
  ErrorMessage,
  FieldError,
  FormError,
  SuccessMessage,
  WarningMessage,
  InfoMessage,
  ValidationSummary,
  PasswordStrengthIndicator,
  InlineValidation
};