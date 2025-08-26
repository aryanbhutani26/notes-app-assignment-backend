// Form validation utilities for the Notes App

// Validation rules constants
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    PATTERN_MESSAGE: 'Username can only contain letters, numbers, and underscores'
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
    STRENGTH_PATTERNS: {
      UPPERCASE: /[A-Z]/,
      LOWERCASE: /[a-z]/,
      NUMBERS: /\d/,
      SPECIAL_CHARS: /[!@#$%^&*(),.?":{}|<>]/
    }
  },
  NOTE_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  NOTE_CONTENT: {
    MAX_LENGTH: 10000
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

// Generic validation functions
export const validators = {
  /**
   * Check if a value is required (not empty)
   */
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Check minimum length
   */
  minLength: (value, minLength, fieldName = 'Field') => {
    if (value && value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
  },

  /**
   * Check maximum length
   */
  maxLength: (value, maxLength, fieldName = 'Field') => {
    if (value && value.length > maxLength) {
      return `${fieldName} must be ${maxLength} characters or less`;
    }
    return null;
  },

  /**
   * Check if value matches a pattern
   */
  pattern: (value, pattern, message = 'Invalid format') => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * Check if two values match
   */
  matches: (value, compareValue, fieldName = 'Field') => {
    if (value !== compareValue) {
      return `${fieldName} do not match`;
    }
    return null;
  },

  /**
   * Check email format
   */
  email: (value) => {
    if (value && !VALIDATION_RULES.EMAIL.PATTERN.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }
};

// Specific field validators
export const fieldValidators = {
  /**
   * Validate username
   */
  username: (value) => {
    const errors = [];
    
    // Required check
    const requiredError = validators.required(value, 'Username');
    if (requiredError) {
      errors.push(requiredError);
      return errors[0]; // Return first error for required field
    }

    // Length checks
    const minLengthError = validators.minLength(
      value, 
      VALIDATION_RULES.USERNAME.MIN_LENGTH, 
      'Username'
    );
    if (minLengthError) errors.push(minLengthError);

    const maxLengthError = validators.maxLength(
      value, 
      VALIDATION_RULES.USERNAME.MAX_LENGTH, 
      'Username'
    );
    if (maxLengthError) errors.push(maxLengthError);

    // Pattern check
    const patternError = validators.pattern(
      value, 
      VALIDATION_RULES.USERNAME.PATTERN, 
      VALIDATION_RULES.USERNAME.PATTERN_MESSAGE
    );
    if (patternError) errors.push(patternError);

    return errors[0] || null; // Return first error or null
  },

  /**
   * Validate password
   */
  password: (value) => {
    const errors = [];
    
    // Required check
    const requiredError = validators.required(value, 'Password');
    if (requiredError) {
      errors.push(requiredError);
      return errors[0];
    }

    // Length checks
    const minLengthError = validators.minLength(
      value, 
      VALIDATION_RULES.PASSWORD.MIN_LENGTH, 
      'Password'
    );
    if (minLengthError) errors.push(minLengthError);

    const maxLengthError = validators.maxLength(
      value, 
      VALIDATION_RULES.PASSWORD.MAX_LENGTH, 
      'Password'
    );
    if (maxLengthError) errors.push(maxLengthError);

    return errors[0] || null;
  },

  /**
   * Validate password confirmation
   */
  confirmPassword: (value, originalPassword) => {
    const requiredError = validators.required(value, 'Password confirmation');
    if (requiredError) return requiredError;

    const matchError = validators.matches(value, originalPassword, 'Passwords');
    if (matchError) return matchError;

    return null;
  },

  /**
   * Validate note title
   */
  noteTitle: (value) => {
    const errors = [];
    
    const requiredError = validators.required(value, 'Note title');
    if (requiredError) {
      errors.push(requiredError);
      return errors[0];
    }

    const maxLengthError = validators.maxLength(
      value, 
      VALIDATION_RULES.NOTE_TITLE.MAX_LENGTH, 
      'Note title'
    );
    if (maxLengthError) errors.push(maxLengthError);

    return errors[0] || null;
  },

  /**
   * Validate note content
   */
  noteContent: (value) => {
    // Content is optional, but check max length if provided
    if (value) {
      const maxLengthError = validators.maxLength(
        value, 
        VALIDATION_RULES.NOTE_CONTENT.MAX_LENGTH, 
        'Note content'
      );
      if (maxLengthError) return maxLengthError;
    }

    return null;
  },

  /**
   * Validate email
   */
  email: (value) => {
    const requiredError = validators.required(value, 'Email');
    if (requiredError) return requiredError;

    const emailError = validators.email(value);
    if (emailError) return emailError;

    return null;
  }
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      level: 'none',
      feedback: []
    };
  }

  const checks = {
    minLength: password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH,
    hasUppercase: VALIDATION_RULES.PASSWORD.STRENGTH_PATTERNS.UPPERCASE.test(password),
    hasLowercase: VALIDATION_RULES.PASSWORD.STRENGTH_PATTERNS.LOWERCASE.test(password),
    hasNumbers: VALIDATION_RULES.PASSWORD.STRENGTH_PATTERNS.NUMBERS.test(password),
    hasSpecialChars: VALIDATION_RULES.PASSWORD.STRENGTH_PATTERNS.SPECIAL_CHARS.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  let level = 'weak';
  if (score >= 4) level = 'strong';
  else if (score >= 3) level = 'medium';
  else if (score >= 2) level = 'fair';

  const feedback = [];
  if (!checks.minLength) feedback.push(`At least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`);
  if (!checks.hasUppercase) feedback.push('Uppercase letter');
  if (!checks.hasLowercase) feedback.push('Lowercase letter');
  if (!checks.hasNumbers) feedback.push('Number');
  if (!checks.hasSpecialChars) feedback.push('Special character');

  return {
    score,
    level,
    feedback,
    checks
  };
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(fieldName => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];
    
    for (const rule of rules) {
      let error = null;
      
      if (typeof rule === 'function') {
        error = rule(value);
      } else if (typeof rule === 'object') {
        const { validator, ...params } = rule;
        error = validator(value, ...Object.values(params));
      }
      
      if (error) {
        errors[fieldName] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time validation helper
export const createFieldValidator = (validationRules) => {
  return (fieldName, value, formData = {}) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;
    
    for (const rule of rules) {
      let error = null;
      
      if (typeof rule === 'function') {
        error = rule(value, formData);
      } else if (typeof rule === 'object') {
        const { validator, ...params } = rule;
        error = validator(value, ...Object.values(params));
      }
      
      if (error) {
        return error;
      }
    }
    
    return null;
  };
};

// Sanitization helpers
export const sanitizers = {
  /**
   * Trim whitespace and normalize spaces
   */
  normalizeText: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' ');
  },

  /**
   * Remove HTML tags (basic sanitization)
   */
  stripHtml: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '');
  },

  /**
   * Normalize username (lowercase, trim)
   */
  normalizeUsername: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  }
};

// Individual validator functions for direct import
export const validateEmail = (value) => fieldValidators.email ? fieldValidators.email(value) : validators.email(value);
export const validatePassword = (value) => fieldValidators.password(value);
export const validateUsername = (value) => fieldValidators.username(value);
export const validateNoteTitle = (value) => fieldValidators.noteTitle(value);
export const validateNoteContent = (value) => fieldValidators.noteContent(value);

// Export default validation object
const validationUtils = {
  validators,
  fieldValidators,
  checkPasswordStrength,
  validateForm,
  createFieldValidator,
  sanitizers,
  VALIDATION_RULES
};

export default validationUtils;