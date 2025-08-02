import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  MFASetup,
  MFAVerification,
  UserProfile,
  UserPreferences,
} from '@/types/auth';
import { JWTManager } from './jwt';

// Mock database - In a real app, this would be replaced with actual database calls
class MockDatabase {
  private users: Map<string, User> = new Map();
  private mfaSecrets: Map<string, string> = new Map();

  constructor() {
    // Initialize with a default admin user
    this.createDefaultUsers();
  }

  private createDefaultUsers() {
    const adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        timezone: 'UTC',
        language: 'en',
      },
      preferences: {
        dashboard: {
          layout: 'grid',
          widgets: ['kpi', 'projects', 'clients'],
          refreshInterval: 30,
        },
        notifications: {
          email: true,
          push: true,
          inApp: true,
          frequency: 'immediate',
        },
        aiAssistance: {
          enabled: true,
          suggestionLevel: 'moderate',
          autoComplete: true,
        },
        theme: {
          mode: 'system',
          primaryColor: '#3b82f6',
          fontSize: 'medium',
        },
      },
      permissions: [
        { id: '1', resource: 'system', action: 'admin', granted: true },
        { id: '2', resource: 'users', action: 'manage', granted: true },
        { id: '3', resource: 'projects', action: 'manage', granted: true },
        { id: '4', resource: 'clients', action: 'manage', granted: true },
        { id: '5', resource: 'analytics', action: 'view', granted: true },
        { id: '6', resource: 'settings', action: 'manage', granted: true },
      ],
      aiContext: {
        workContext: [],
        preferences: {},
        learningData: {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store with hashed password
    this.users.set('admin@example.com', {
      ...adminUser,
      // In real implementation, password would be hashed during registration
      password: bcrypt.hashSync('Admin123!', 10),
    } as any);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = this.users.get(email);
    if (!user) return null;

    // Remove password from returned user object
    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  async findUserById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        const { password, ...userWithoutPassword } = user as any;
        return userWithoutPassword;
      }
    }
    return null;
  }

  async createUser(userData: RegisterData & { id: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser: User = {
      id: userData.id,
      email: userData.email,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        timezone: 'UTC',
        language: 'en',
      },
      preferences: {
        dashboard: {
          layout: 'grid',
          widgets: ['kpi', 'projects'],
          refreshInterval: 30,
        },
        notifications: {
          email: true,
          push: false,
          inApp: true,
          frequency: 'daily',
        },
        aiAssistance: {
          enabled: true,
          suggestionLevel: 'moderate',
          autoComplete: false,
        },
        theme: {
          mode: 'system',
          primaryColor: '#3b82f6',
          fontSize: 'medium',
        },
      },
      permissions: [
        { id: Date.now().toString(), resource: 'projects', action: 'view', granted: true },
        { id: (Date.now() + 1).toString(), resource: 'clients', action: 'view', granted: true },
        { id: (Date.now() + 2).toString(), resource: 'profile', action: 'manage', granted: true },
      ],
      aiContext: {
        workContext: [],
        preferences: {},
        learningData: {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userData.email, {
      ...newUser,
      password: hashedPassword,
    } as any);

    return newUser;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = this.users.get(email) as any;
    if (!user) return false;

    return bcrypt.compare(password, user.password);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.findUserById(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(user.email, updatedUser as any);
    return updatedUser;
  }

  setMFASecret(userId: string, secret: string): void {
    this.mfaSecrets.set(userId, secret);
  }

  getMFASecret(userId: string): string | null {
    return this.mfaSecrets.get(userId) || null;
  }
}

const db = new MockDatabase();

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Find user by email
    const user = await db.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await db.verifyPassword(email, password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = JWTManager.generateTokens(user);

    return { user, tokens };
  }

  static async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await db.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const userId = Date.now().toString();
    const user = await db.createUser({ ...data, id: userId });

    // Generate tokens
    const tokens = JWTManager.generateTokens(user);

    return { user, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Verify refresh token
    const payload = JWTManager.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Find user
    const user = await db.findUserById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const tokens = JWTManager.generateTokens(user);

    return { user, tokens };
  }

  static async setupMFA(userId: string): Promise<MFASetup> {
    const user = await db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate MFA secret using otplib
    const secret = authenticator.generateSecret();
    const qrCode = await this.generateQRCode(user.email, secret);
    const backupCodes = this.generateBackupCodes();

    // Store secret
    db.setMFASecret(userId, secret);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  static async verifyMFA(userId: string, verification: MFAVerification): Promise<boolean> {
    const secret = db.getMFASecret(userId);
    if (!secret) {
      throw new Error('MFA not set up for this user');
    }

    // Verify TOTP token using otplib
    if (verification.token) {
      try {
        const isValid = authenticator.verify({
          token: verification.token,
          secret: secret,
        });
        return isValid;
      } catch (error) {
        console.error('TOTP verification error:', error);
        return false;
      }
    }

    // Verify backup code (in real app, check against stored backup codes and mark as used)
    if (verification.backupCode) {
      // For demo purposes, accept any 8-character backup code
      // In production, you'd check against stored backup codes
      return verification.backupCode.length === 8;
    }

    return false;
  }

  static async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<User> {
    const user = await db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await db.updateUser(userId, {
      profile: { ...user.profile, ...profile },
    });

    if (!updatedUser) {
      throw new Error('Failed to update profile');
    }

    return updatedUser;
  }

  static async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedPreferences = {
      ...user.preferences,
      ...preferences,
      dashboard: { ...user.preferences.dashboard, ...preferences.dashboard },
      notifications: { ...user.preferences.notifications, ...preferences.notifications },
      aiAssistance: { ...user.preferences.aiAssistance, ...preferences.aiAssistance },
      theme: { ...user.preferences.theme, ...preferences.theme },
    };

    const updatedUser = await db.updateUser(userId, {
      preferences: updatedPreferences,
    });

    if (!updatedUser) {
      throw new Error('Failed to update preferences');
    }

    return updatedUser;
  }

  private static async generateQRCode(email: string, secret: string): Promise<string> {
    const otpAuthUrl = authenticator.keyuri(email, 'Business Dashboard', secret);
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      // Fallback to the URL itself
      return otpAuthUrl;
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    return await db.findUserById(userId);
  }

  private static generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substring(2, 10));
    }
    return codes;
  }
}