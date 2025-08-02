import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { describe } from 'node:test';
import {
  loginSchema,
  registerSchema,
  mfaVerificationSchema,
  profileUpdateSchema,
  preferencesUpdateSchema,
} from '../auth';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: true,
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'Password123!',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password', // No uppercase, number, or special character
        confirmPassword: 'password',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password must contain at least one uppercase letter');
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Passwords do not match');
      }
    });

    it('should reject short first name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'J',
        lastName: 'Doe',
        acceptTerms: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name must be at least 2 characters');
      }
    });

    it('should reject when terms not accepted', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: false,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('You must accept the terms and conditions');
      }
    });
  });

  describe('mfaVerificationSchema', () => {
    it('should validate correct MFA token', () => {
      const validData = {
        token: '123456',
      };

      const result = mfaVerificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with backup code', () => {
      const validData = {
        token: '123456',
        backupCode: 'backup12',
      };

      const result = mfaVerificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short token', () => {
      const invalidData = {
        token: '123',
      };

      const result = mfaVerificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Token must be 6 digits');
      }
    });

    it('should reject long token', () => {
      const invalidData = {
        token: '1234567',
      };

      const result = mfaVerificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Token must be 6 digits');
      }
    });

    it('should reject non-numeric token', () => {
      const invalidData = {
        token: 'abcdef',
      };

      const result = mfaVerificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Token must contain only numbers');
      }
    });
  });

  describe('profileUpdateSchema', () => {
    it('should validate correct profile update', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        timezone: 'America/New_York',
        language: 'en',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial profile update', () => {
      const validData = {
        firstName: 'John',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty phone', () => {
      const validData = {
        firstName: 'John',
        phone: '',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        firstName: 'John',
        phone: 'invalid-phone',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.issues.find(issue => issue.path.includes('phone'));
        expect(phoneError?.message).toContain('Invalid input');
      }
    });

    it('should reject short first name', () => {
      const invalidData = {
        firstName: 'J',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name must be at least 2 characters');
      }
    });
  });

  describe('preferencesUpdateSchema', () => {
    it('should validate correct preferences update', () => {
      const validData = {
        dashboard: {
          layout: 'grid' as const,
          widgets: ['kpi', 'projects'],
          refreshInterval: 30,
        },
        notifications: {
          email: true,
          push: false,
          inApp: true,
          frequency: 'daily' as const,
        },
        aiAssistance: {
          enabled: true,
          suggestionLevel: 'moderate' as const,
          autoComplete: false,
        },
        theme: {
          mode: 'dark' as const,
          primaryColor: '#ff0000',
          fontSize: 'large' as const,
        },
      };

      const result = preferencesUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial preferences update', () => {
      const validData = {
        theme: {
          mode: 'light' as const,
        },
      };

      const result = preferencesUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid refresh interval', () => {
      const invalidData = {
        dashboard: {
          refreshInterval: 2, // Too low (minimum is 5)
        },
      };

      const result = preferencesUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid layout option', () => {
      const invalidData = {
        dashboard: {
          layout: 'invalid' as any,
        },
      };

      const result = preferencesUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid theme mode', () => {
      const invalidData = {
        theme: {
          mode: 'invalid' as any,
        },
      };

      const result = preferencesUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});