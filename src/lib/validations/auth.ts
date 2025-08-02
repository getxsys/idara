import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const mfaVerificationSchema = z.object({
  token: z
    .string()
    .min(6, 'Token must be 6 digits')
    .max(6, 'Token must be 6 digits')
    .regex(/^\d{6}$/, 'Token must contain only numbers'),
  backupCode: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

export const preferencesUpdateSchema = z.object({
  dashboard: z
    .object({
      layout: z.enum(['grid', 'list']).optional(),
      widgets: z.array(z.string()).optional(),
      refreshInterval: z.number().min(5).max(300).optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional(),
      frequency: z.enum(['immediate', 'hourly', 'daily']).optional(),
    })
    .optional(),
  aiAssistance: z
    .object({
      enabled: z.boolean().optional(),
      suggestionLevel: z.enum(['minimal', 'moderate', 'aggressive']).optional(),
      autoComplete: z.boolean().optional(),
    })
    .optional(),
  theme: z
    .object({
      mode: z.enum(['light', 'dark', 'system']).optional(),
      primaryColor: z.string().optional(),
      fontSize: z.enum(['small', 'medium', 'large']).optional(),
    })
    .optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MFAVerificationData = z.infer<typeof mfaVerificationSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdateData = z.infer<typeof preferencesUpdateSchema>;