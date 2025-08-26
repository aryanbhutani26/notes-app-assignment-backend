import React, { forwardRef } from 'react';
import { FieldError } from './ErrorDisplay';
import './FormField.css';

// Base form field component
export const FormField = forwardRef(({
  label,
  error,
  touched,
  required = false,
  hint,
  className = '',
  children,
  ...props
}, ref) => {
  const hasError = touched && error;

  return (
    <div className={`form-field ${className} ${hasError ? 'has-error' : ''}`}>
      {label && (
        <label 
          htmlFor={props.id || props.name} 
          className="form-field-label"
        >
          {label}
          {required && <span className="required-indicator" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="form-field-input">
        {children}
      </div>
      
      {hint && !hasError && (
        <div className="form-field-hint">{hint}</div>
      )}
      
      <FieldError error={error} show={touched} />
    </div>
  );
});

FormField.displayName = 'FormField';

// Text input field
export const TextField = forwardRef(({
  type = 'text',
  className = '',
  error,
  touched,
  ...props
}, ref) => {
  const hasError = touched && error;

  return (
    <input
      ref={ref}
      type={type}
      className={`form-control ${className} ${hasError ? 'error' : ''}`}
      {...props}
    />
  );
});

TextField.displayName = 'TextField';

// Textarea field
export const TextAreaField = forwardRef(({
  rows = 4,
  className = '',
  error,
  touched,
  ...props
}, ref) => {
  const hasError = touched && error;

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`form-control ${className} ${hasError ? 'error' : ''}`}
      {...props}
    />
  );
});

TextAreaField.displayName = 'TextAreaField';

// Select field
export const SelectField = forwardRef(({
  options = [],
  placeholder,
  className = '',
  error,
  touched,
  children,
  ...props
}, ref) => {
  const hasError = touched && error;

  return (
    <select
      ref={ref}
      className={`form-control ${className} ${hasError ? 'error' : ''}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );
});

SelectField.displayName = 'SelectField';

// Checkbox field
export const CheckboxField = forwardRef(({
  label,
  className = '',
  error,
  touched,
  ...props
}, ref) => {
  const hasError = touched && error;

  return (
    <div className={`checkbox-field ${className} ${hasError ? 'has-error' : ''}`}>
      <label className="checkbox-label">
        <input
          ref={ref}
          type="checkbox"
          className="checkbox-input"
          {...props}
        />
        <span className="checkbox-checkmark"></span>
        <span className="checkbox-text">{label}</span>
      </label>
      <FieldError error={error} show={touched} />
    </div>
  );
});

CheckboxField.displayName = 'CheckboxField';

// Radio field group
export const RadioGroup = ({
  name,
  options = [],
  value,
  onChange,
  error,
  touched,
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className={`radio-group ${className} ${hasError ? 'has-error' : ''}`}>
      {options.map((option, index) => (
        <label key={index} className="radio-label">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="radio-input"
            {...props}
          />
          <span className="radio-checkmark"></span>
          <span className="radio-text">{option.label}</span>
        </label>
      ))}
      <FieldError error={error} show={touched} />
    </div>
  );
};

// Password field with toggle
export const PasswordField = forwardRef(({
  showToggle = true,
  className = '',
  error,
  touched,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const hasError = touched && error;

  return (
    <div className="password-field">
      <div className="password-input-container">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`form-control ${className} ${hasError ? 'error' : ''}`}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>
    </div>
  );
});

PasswordField.displayName = 'PasswordField';

// Complete form field with validation
export const ValidatedField = ({
  component: Component = TextField,
  validate,
  ...props
}) => {
  const [localError, setLocalError] = React.useState('');
  const [localTouched, setLocalTouched] = React.useState(false);

  const handleBlur = (e) => {
    setLocalTouched(true);
    if (validate) {
      const error = validate(e.target.value);
      setLocalError(error || '');
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleChange = (e) => {
    if (localTouched && validate) {
      const error = validate(e.target.value);
      setLocalError(error || '');
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <FormField
      {...props}
      error={props.error || localError}
      touched={props.touched || localTouched}
    >
      <Component
        {...props}
        onBlur={handleBlur}
        onChange={handleChange}
        error={props.error || localError}
        touched={props.touched || localTouched}
      />
    </FormField>
  );
};

export default {
  FormField,
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  RadioGroup,
  PasswordField,
  ValidatedField
};