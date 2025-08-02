import { JWTManager, TokenStorage } from '../jwt';
import { User } from '@/types/auth';

// Mock localStorage for TokenStorage tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('JWTManager', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      timezone: 'UTC',
      language: 'en',
    },
    preferences: {
      dashboard: { layout: 'grid', widgets: [], refreshInterval: 30 },
      notifications: { email: true, push: false, inApp: true, frequency: 'daily' },
      aiAssistance: { enabled: true, suggestionLevel: 'moderate', autoComplete: false },
      theme: { mode: 'system', primaryColor: '#3b82f6', fontSize: 'medium' },
    },
    permissions: [
      { id: '1', resource: 'projects', action: 'view', granted: true },
      { id: '2', resource: 'system', action: 'admin', granted: true },
    ],
    aiContext: { workContext: [], preferences: {}, learningData: {} },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = JWTManager.generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresAt');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.expiresAt).toBeInstanceOf(Date);
    });

    it('should set expiration time to 15 minutes from now', () => {
      const beforeGeneration = new Date();
      const tokens = JWTManager.generateTokens(mockUser);
      const afterGeneration = new Date();

      const expectedMinTime = new Date(beforeGeneration.getTime() + 14 * 60 * 1000); // 14 minutes
      const expectedMaxTime = new Date(afterGeneration.getTime() + 16 * 60 * 1000); // 16 minutes

      expect(tokens.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinTime.getTime());
      expect(tokens.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxTime.getTime());
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = JWTManager.generateTokens(mockUser);
      const payload = JWTManager.verifyAccessToken(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.email).toBe(mockUser.email);
      expect(payload?.role).toBe('admin'); // Based on permissions
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const payload = JWTManager.verifyAccessToken(invalidToken);

      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const payload = JWTManager.verifyAccessToken(malformedToken);

      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = JWTManager.generateTokens(mockUser);
      const payload = JWTManager.verifyRefreshToken(tokens.refreshToken);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(mockUser.id);
    });

    it('should return null for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      const payload = JWTManager.verifyRefreshToken(invalidToken);

      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const tokens = JWTManager.generateTokens(mockUser);
      const isExpired = JWTManager.isTokenExpired(tokens.accessToken);

      expect(isExpired).toBe(false);
    });

    it('should return true for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const isExpired = JWTManager.isTokenExpired(malformedToken);

      expect(isExpired).toBe(true);
    });

    it('should return true for token without expiration', () => {
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIn0.invalid';
      const isExpired = JWTManager.isTokenExpired(tokenWithoutExp);

      expect(isExpired).toBe(true);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should return correct expiration time for valid token', () => {
      const tokens = JWTManager.generateTokens(mockUser);
      const expirationTime = JWTManager.getTokenExpirationTime(tokens.accessToken);

      expect(expirationTime).toBeInstanceOf(Date);
      // JWT expiration times are in seconds, so there might be some precision difference
      const timeDifference = Math.abs((expirationTime?.getTime() || 0) - tokens.expiresAt.getTime());
      expect(timeDifference).toBeLessThan(2000); // Within 2 seconds
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const expirationTime = JWTManager.getTokenExpirationTime(malformedToken);

      expect(expirationTime).toBeNull();
    });
  });
});

describe('TokenStorage', () => {
  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    expiresAt: new Date('2024-12-31T23:59:59Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('setTokens', () => {
    it('should store tokens in localStorage', () => {
      TokenStorage.setTokens(mockTokens);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_access_token', mockTokens.accessToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_refresh_token', mockTokens.refreshToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_expires_at', mockTokens.expiresAt.toISOString());
    });
  });

  describe('getTokens', () => {
    it('should retrieve tokens from localStorage', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken)
        .mockReturnValueOnce(mockTokens.expiresAt.toISOString());

      const tokens = TokenStorage.getTokens();

      expect(tokens).toEqual(mockTokens);
    });

    it('should return null when tokens are missing', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const tokens = TokenStorage.getTokens();

      expect(tokens).toBeNull();
    });

    it('should return null when only some tokens are present', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(null) // Missing refresh token
        .mockReturnValueOnce(mockTokens.expiresAt.toISOString());

      const tokens = TokenStorage.getTokens();

      expect(tokens).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove all tokens from localStorage', () => {
      TokenStorage.clearTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_expires_at');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(mockTokens.accessToken);

      const token = TokenStorage.getAccessToken();

      expect(token).toBe(mockTokens.accessToken);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_access_token');
    });

    it('should return null when access token is not present', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const token = TokenStorage.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(mockTokens.refreshToken);

      const token = TokenStorage.getRefreshToken();

      expect(token).toBe(mockTokens.refreshToken);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_refresh_token');
    });

    it('should return null when refresh token is not present', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const token = TokenStorage.getRefreshToken();

      expect(token).toBeNull();
    });
  });
});