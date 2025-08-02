import { AuthService } from '../service';
import { LoginCredentials, RegisterData, MFAVerification } from '@/types/auth';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
  hashSync: jest.fn().mockReturnValue('hashedPassword'),
}));

// Mock otplib
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Business%20Dashboard'),
    verify: jest.fn().mockReturnValue(true),
  },
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'admin@example.com',
        password: 'Admin123!',
      };

      const result = await AuthService.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid email', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      // Mock bcrypt.compare to return false for invalid password
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValueOnce(false);

      const credentials: LoginCredentials = {
        email: 'admin@example.com',
        password: 'wrongpassword',
      };

      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'NewUser123!',
        confirmPassword: 'NewUser123!',
        firstName: 'New',
        lastName: 'User',
        acceptTerms: true,
      };

      const result = await AuthService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.profile.firstName).toBe(registerData.firstName);
      expect(result.user.profile.lastName).toBe(registerData.lastName);
    });

    it('should throw error for existing email', async () => {
      const registerData: RegisterData = {
        email: 'admin@example.com', // This email already exists
        password: 'NewUser123!',
        confirmPassword: 'NewUser123!',
        firstName: 'New',
        lastName: 'User',
        acceptTerms: true,
      };

      await expect(AuthService.register(registerData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('setupMFA', () => {
    it('should successfully setup MFA for existing user', async () => {
      const userId = '1'; // Admin user ID

      const result = await AuthService.setupMFA(userId);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('backupCodes');
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCode).toBe('data:image/png;base64,mockQRCode');
      expect(result.backupCodes).toHaveLength(8);
    });

    it('should throw error for non-existent user', async () => {
      const userId = 'nonexistent';

      await expect(AuthService.setupMFA(userId)).rejects.toThrow('User not found');
    });
  });

  describe('verifyMFA', () => {
    beforeEach(async () => {
      // Setup MFA for the test user first
      await AuthService.setupMFA('1');
    });

    it('should successfully verify valid TOTP token', async () => {
      const verification: MFAVerification = {
        token: '123456',
      };

      const result = await AuthService.verifyMFA('1', verification);

      expect(result).toBe(true);
    });

    it('should successfully verify valid backup code', async () => {
      const verification: MFAVerification = {
        backupCode: 'backup12',
      };

      const result = await AuthService.verifyMFA('1', verification);

      expect(result).toBe(true);
    });

    it('should fail verification for invalid token', async () => {
      // Mock otplib to return false for invalid token
      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValueOnce(false);

      const verification: MFAVerification = {
        token: '000000',
      };

      const result = await AuthService.verifyMFA('1', verification);

      expect(result).toBe(false);
    });

    it('should throw error for user without MFA setup', async () => {
      const verification: MFAVerification = {
        token: '123456',
      };

      await expect(AuthService.verifyMFA('999', verification)).rejects.toThrow('MFA not set up for this user');
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const userId = '1';
      const profileUpdate = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
      };

      const result = await AuthService.updateProfile(userId, profileUpdate);

      expect(result.profile.firstName).toBe(profileUpdate.firstName);
      expect(result.profile.lastName).toBe(profileUpdate.lastName);
      expect(result.profile.phone).toBe(profileUpdate.phone);
    });

    it('should throw error for non-existent user', async () => {
      const userId = 'nonexistent';
      const profileUpdate = { firstName: 'Test' };

      await expect(AuthService.updateProfile(userId, profileUpdate)).rejects.toThrow('User not found');
    });
  });

  describe('updatePreferences', () => {
    it('should successfully update user preferences', async () => {
      const userId = '1';
      const preferencesUpdate = {
        theme: {
          mode: 'dark' as const,
          primaryColor: '#ff0000',
        },
        notifications: {
          email: false,
          push: true,
        },
      };

      const result = await AuthService.updatePreferences(userId, preferencesUpdate);

      expect(result.preferences.theme.mode).toBe('dark');
      expect(result.preferences.theme.primaryColor).toBe('#ff0000');
      expect(result.preferences.notifications.email).toBe(false);
      expect(result.preferences.notifications.push).toBe(true);
    });

    it('should throw error for non-existent user', async () => {
      const userId = 'nonexistent';
      const preferencesUpdate = { theme: { mode: 'dark' as const } };

      await expect(AuthService.updatePreferences(userId, preferencesUpdate)).rejects.toThrow('User not found');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // First login to get tokens
      const loginResult = await AuthService.login({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

      const result = await AuthService.refreshToken(loginResult.tokens.refreshToken);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.id).toBe(loginResult.user.id);
    });

    it('should throw error for invalid refresh token', async () => {
      const invalidToken = 'invalid.refresh.token';

      await expect(AuthService.refreshToken(invalidToken)).rejects.toThrow('Invalid refresh token');
    });
  });
});