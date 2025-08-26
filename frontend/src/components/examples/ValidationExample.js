import React from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { fieldValidators, checkPasswordStrength } from '../../utils/validation';
import { FormField, TextField, PasswordField } from '../ui/FormField';
import { FormError, PasswordStrengthIndicator } from '../ui/ErrorDisplay';

// Example component demonstrating validation utilities
const ValidationExample = () => {
  // Define validation rules
  const validationRules = {
    username: [fieldValidators.username],
    password: [fieldValidators.password],
    confirmPassword: [(value, formData) => 
      fieldValidators.confirmPassword(value, formData.password)
    ]
  };

  // Initialize form validation
  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps
  } = useFormValidation(
    { username: '', password: '', confirmPassword: '' },
    validationRules,
    { validateOnChange: true, validateOnBlur: true }
  );

  // Handle form submission
  const onSubmit = async (formValues) => {
    console.log('Form submitted:', formValues);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  };

  return (
    <div className="validation-example">
      <h2>Form Validation Example</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Username field */}
        <FormField
          label="Username"
          required
          error={errors.username}
          touched={touched.username}
          hint="3-50 characters, letters, numbers, and underscores only"
        >
          <TextField
            {...getFieldProps('username')}
            placeholder="Enter your username"
            autoComplete="username"
          />
        </FormField>

        {/* Password field */}
        <FormField
          label="Password"
          required
          error={errors.password}
          touched={touched.password}
        >
          <PasswordField
            {...getFieldProps('password')}
            placeholder="Enter your password"
            autoComplete="new-password"
          />
        </FormField>

        {/* Password strength indicator */}
        {values.password && (
          <PasswordStrengthIndicator
            password={values.password}
            strengthChecker={checkPasswordStrength}
            showRequirements={true}
          />
        )}

        {/* Confirm password field */}
        <FormField
          label="Confirm Password"
          required
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
        >
          <PasswordField
            {...getFieldProps('confirmPassword')}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </FormField>

        {/* Form-level errors */}
        <FormError
          errors={Object.values(errors).filter(Boolean)}
          show={Object.keys(touched).length > 0 && !isValid}
        />

        {/* Submit button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid}
        >
          Submit
        </button>
      </form>

      {/* Debug info */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
        <h3>Debug Info</h3>
        <p><strong>Is Valid:</strong> {isValid ? 'Yes' : 'No'}</p>
        <p><strong>Values:</strong> {JSON.stringify(values, null, 2)}</p>
        <p><strong>Errors:</strong> {JSON.stringify(errors, null, 2)}</p>
        <p><strong>Touched:</strong> {JSON.stringify(touched, null, 2)}</p>
      </div>
    </div>
  );
};

export default ValidationExample;