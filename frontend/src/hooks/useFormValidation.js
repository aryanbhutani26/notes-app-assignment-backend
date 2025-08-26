import { useState, useCallback, useMemo } from 'react';
import { validateForm, createFieldValidator } from '../utils/validation';

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Object} options - Additional options
 * @returns {Object} Form validation state and methods
 */
export const useFormValidation = (
  initialValues = {},
  validationRules = {},
  options = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true
  } = options;

  // Form state
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Create field validator
  const fieldValidator = useMemo(
    () => createFieldValidator(validationRules),
    [validationRules]
  );

  // Validate single field
  const validateField = useCallback((fieldName, value, formValues = values) => {
    const error = fieldValidator(fieldName, value, formValues);
    return error;
  }, [fieldValidator, values]);

  // Validate all fields
  const validateAllFields = useCallback((formValues = values) => {
    const validation = validateForm(formValues, validationRules);
    return validation;
  }, [values, validationRules]);

  // Set field value
  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Validate on change if enabled
    if (validateOnChange && touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  }, [validateOnChange, touched, validateField]);

  // Set multiple values
  const setMultipleValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));

    // Validate changed fields if enabled
    if (validateOnChange) {
      const newErrors = { ...errors };
      Object.keys(newValues).forEach(fieldName => {
        if (touched[fieldName]) {
          const error = validateField(fieldName, newValues[fieldName], {
            ...values,
            ...newValues
          });
          newErrors[fieldName] = error;
        }
      });
      setErrors(newErrors);
    }
  }, [validateOnChange, touched, errors, validateField, values]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValue(name, fieldValue);
  }, [setValue]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate on blur if enabled
    if (validateOnBlur) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateOnBlur, validateField]);

  // Set field error
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValidating(false);
  }, [initialValues]);

  // Validate form
  const validate = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const validation = validateAllFields();
      setErrors(validation.errors);
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      
      return validation;
    } finally {
      setIsValidating(false);
    }
  }, [validateAllFields, values]);

  // Submit form
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitting(true);

      try {
        // Validate if enabled
        if (validateOnSubmit) {
          const validation = await validate();
          if (!validation.isValid) {
            return { success: false, errors: validation.errors };
          }
        }

        // Call submit handler
        const result = await onSubmit(values);
        return { success: true, result };
      } catch (error) {
        console.error('Form submission error:', error);
        return { success: false, error };
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [validateOnSubmit, validate, values]);

  // Get field props for easy integration
  const getFieldProps = useCallback((fieldName) => {
    return {
      name: fieldName,
      value: values[fieldName] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: errors[fieldName],
      touched: touched[fieldName]
    };
  }, [values, handleChange, handleBlur, errors, touched]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Get touched fields with errors
  const touchedErrors = useMemo(() => {
    const result = {};
    Object.keys(errors).forEach(key => {
      if (touched[key] && errors[key]) {
        result[key] = errors[key];
      }
    });
    return result;
  }, [errors, touched]);

  return {
    // State
    values,
    errors,
    touched,
    touchedErrors,
    isSubmitting,
    isValidating,
    isValid,
    isDirty,

    // Methods
    setValue,
    setValues: setMultipleValues,
    setFieldError,
    clearFieldError,
    clearErrors,
    reset,
    validate,
    validateField,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps
  };
};

export default useFormValidation;