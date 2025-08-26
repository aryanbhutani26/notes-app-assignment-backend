import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateNoteTitle,
  validateNoteContent,
  fieldValidators,
  checkPasswordStrength
} from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBeNull();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example',
        'user name@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBeTruthy();
      });
    });

    it('should handle null and undefined', () => {
      expect(validateEmail(null)).toBeTruthy();
      expect(validateEmail(undefined)).toBeTruthy();
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'C0mpl3x#P@ssw0rd',
        'Secure123$'
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBeNull();
      });
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        '',
        'short',
        'password', // no uppercase, numbers, or special chars
        'PASSWORD', // no lowercase, numbers, or special chars
        '12345678', // no letters or special chars
        'Password', // no numbers or special chars
        'Password123', // no special chars
        'password123!', // no uppercase
        'PASSWORD123!' // no lowercase
      ];

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBeTruthy();
      });
    });

    it('should handle null and undefined', () => {
      expect(validatePassword(null)).toBeTruthy();
      expect(validatePassword(undefined)).toBeTruthy();
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'user-name',
        'username',
        'user123_test',
        'a'.repeat(3), // minimum length
        'a'.repeat(30) // maximum length
      ];

      validUsernames.forEach(username => {
        expect(validateUsername(username)).toBeNull();
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '',
        'ab', // too short
        'a'.repeat(31), // too long
        'user name', // contains space
        'user@name', // contains @
        'user.name', // contains dot
        'user#name', // contains special char
        '123user', // starts with number
        '_username', // starts with underscore
        '-username' // starts with dash
      ];

      invalidUsernames.forEach(username => {
        expect(validateUsername(username)).toBeTruthy();
      });
    });

    it('should handle null and undefined', () => {
      expect(validateUsername(null)).toBeTruthy();
      expect(validateUsername(undefined)).toBeTruthy();
    });
  });

  describe('validateNoteTitle', () => {
    it('should validate correct note titles', () => {
      const validTitles = [
        'My Note',
        'A',
        'A'.repeat(200), // maximum length
        'Note with numbers 123',
        'Note with special chars!@#'
      ];

      validTitles.forEach(title => {
        expect(validateNoteTitle(title)).toBeNull();
      });
    });

    it('should reject invalid note titles', () => {
      const invalidTitles = [
        '',
        '   ', // only whitespace
        'A'.repeat(201) // too long
      ];

      invalidTitles.forEach(title => {
        expect(validateNoteTitle(title)).toBeTruthy();
      });
    });

    it('should handle null and undefined', () => {
      expect(validateNoteTitle(null)).toBeTruthy();
      expect(validateNoteTitle(undefined)).toBeTruthy();
    });
  });

  describe('validateNoteContent', () => {
    it('should validate correct note content', () => {
      const validContent = [
        '',
        'Short content',
        'A'.repeat(10000), // maximum length
        'Content with\nnew lines',
        'Content with special chars!@#$%^&*()'
      ];

      validContent.forEach(content => {
        expect(validateNoteContent(content)).toBeNull();
      });
    });

    it('should reject invalid note content', () => {
      const invalidContent = [
        'A'.repeat(10001) // too long
      ];

      invalidContent.forEach(content => {
        expect(validateNoteContent(content)).toBeTruthy();
      });
    });

    it('should handle null and undefined', () => {
      expect(validateNoteContent(null)).toBeNull();
      expect(validateNoteContent(undefined)).toBeNull();
    });
  });

  describe('fieldValidators', () => {
    it('should have all required validators', () => {
      expect(fieldValidators.email).toBeDefined();
      expect(fieldValidators.password).toBeDefined();
      expect(fieldValidators.username).toBeDefined();
      expect(fieldValidators.noteTitle).toBeDefined();
      expect(fieldValidators.noteContent).toBeDefined();
    });

    it('should work with field validator functions', () => {
      expect(fieldValidators.email('test@example.com')).toBeNull();
      expect(fieldValidators.email('invalid')).toBeTruthy();
      
      expect(fieldValidators.password('Password123!')).toBeNull();
      expect(fieldValidators.password('weak')).toBeTruthy();
      
      expect(fieldValidators.username('validuser')).toBeNull();
      expect(fieldValidators.username('invalid user')).toBeTruthy();
      
      expect(fieldValidators.noteTitle('Valid Title')).toBeNull();
      expect(fieldValidators.noteTitle('')).toBeTruthy();
      
      expect(fieldValidators.noteContent('Valid content')).toBeNull();
      expect(fieldValidators.noteContent('A'.repeat(10001))).toBeTruthy();
    });
  });

  describe('checkPasswordStrength', () => {
    it('should return weak for simple passwords', () => {
      const weakPasswords = [
        'password',
        '123456',
        'abc123',
        'password123'
      ];

      weakPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(result.level).toBe('weak');
        expect(result.score).toBeLessThan(3);
        expect(result.feedback.length).toBeGreaterThan(0);
      });
    });

    it('should return medium for moderate passwords', () => {
      const mediumPasswords = [
        'Password123',
        'MyPass123',
        'Test1234'
      ];

      mediumPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(['medium', 'strong']).toContain(result.level);
        expect(result.score).toBeGreaterThanOrEqual(2);
      });
    });

    it('should return strong for complex passwords', () => {
      const strongPasswords = [
        'MyStr0ng@Password!',
        'C0mpl3x#P@ssw0rd123',
        'Secure$Pass123!'
      ];

      strongPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(['strong', 'very-strong']).toContain(result.level);
        expect(result.score).toBeGreaterThanOrEqual(3);
      });
    });

    it('should return very-strong for very complex passwords', () => {
      const veryStrongPasswords = [
        'MyVery$tr0ng@P@ssw0rd123!',
        'Extremely#C0mpl3x$P@ssw0rd!2024'
      ];

      veryStrongPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(result.level).toBe('very-strong');
        expect(result.score).toBe(5);
        expect(result.feedback.length).toBe(0);
      });
    });

    it('should provide helpful feedback', () => {
      const result = checkPasswordStrength('weak');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add numbers');
      expect(result.feedback).toContain('Add special characters');
      expect(result.feedback).toContain('Use at least 8 characters');
    });

    it('should handle empty password', () => {
      const result = checkPasswordStrength('');
      expect(result.level).toBe('weak');
      expect(result.score).toBe(0);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long inputs', () => {
      const longString = 'a'.repeat(50000);
      
      expect(validateEmail(longString)).toBeTruthy();
      expect(validateUsername(longString)).toBeTruthy();
      expect(validateNoteTitle(longString)).toBeTruthy();
      expect(validateNoteContent(longString)).toBeTruthy();
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      expect(validateEmail(`test${specialChars}@example.com`)).toBeTruthy();
      expect(validateUsername(`user${specialChars}`)).toBeTruthy();
      expect(validateNoteTitle(`Title ${specialChars}`)).toBeNull();
      expect(validateNoteContent(`Content ${specialChars}`)).toBeNull();
    });

    it('should handle unicode characters', () => {
      const unicodeString = 'тест用户测试🎉';
      
      expect(validateNoteTitle(unicodeString)).toBeNull();
      expect(validateNoteContent(unicodeString)).toBeNull();
    });
  });
});