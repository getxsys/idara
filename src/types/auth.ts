export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  permissions: Permission[];
  aiContext: AIContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  timezone: string;
  language: string;
}

export interface UserPreferences {
  dashboard: DashboardConfig;
  notifications: NotificationSettings;
  aiAssistance: AISettings;
  theme: ThemeSettings;
}

export interface DashboardConfig {
  layout: 'grid' | 'list';
  widgets: string[];
  refreshInterval: number;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
}

export interface AISettings {
  enabled: boolean;
  suggestionLevel: 'minimal' | 'moderate' | 'aggressive';
  autoComplete: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  granted: boolean;
}

export interface AIContext {
  workContext: string[];
  preferences: Record<string, any>;
  learningData: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerification {
  token: string;
  backupCode?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setupMFA: () => Promise<MFASetup>;
  verifyMFA: (verification: MFAVerification) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

export type Role = 'admin' | 'manager' | 'user' | 'viewer';

export interface RolePermissions {
  [key: string]: Permission[];
}