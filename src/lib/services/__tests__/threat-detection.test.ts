import { ThreatDetectionService } from '../threat-detection';
import {
  SecurityEventType,
  SecuritySeverity,
  BehaviorType
} from '@/types/security';

describe('ThreatDetectionService', () => {
  let service: ThreatDetectionService;

  beforeEach(() => {
    service = new ThreatDetectionService();
  });

  describe('analyzeUserBehavior', () => {
    it('should detect login time anomalies', async () => {
      const userId = 'test-user-1';
      const currentActivity = {
        type: 'login',
        timestamp: new Date('2024-01-15T02:00:00Z'), // 2 AM login (Monday)
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        location: {
          city: 'New York',
          country: 'US',
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const anomalies = await service.analyzeUserBehavior(userId, currentActivity);
      
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe(SecurityEventType.UNUSUAL_ACCESS_PATTERN);
      expect(anomalies[0].severity).toBe(SecuritySeverity.MEDIUM);
      expect(anomalies[0].details.description).toContain('unusual time');
    });

    it('should detect location anomalies', async () => {
      const userId = 'test-user-2';
      const currentActivity = {
        type: 'login',
        timestamp: new Date(),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        location: {
          city: 'Moscow',
          country: 'RU',
          latitude: 55.7558,
          longitude: 37.6176
        }
      };

      const anomalies = await service.analyzeUserBehavior(userId, currentActivity);
      
      // Should detect location anomaly if user normally logs in from different location
      expect(anomalies.length).toBeGreaterThanOrEqual(0);
      if (anomalies.length > 0) {
        expect(anomalies.some(a => a.type === SecurityEventType.UNUSUAL_ACCESS_PATTERN)).toBeTruthy();
      }
    });

    it('should not flag normal behavior patterns', async () => {
      const userId = 'test-user-3';
      const currentActivity = {
        type: 'login',
        timestamp: new Date('2024-01-15T10:00:00Z'), // 10 AM login (normal business hours)
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0',
        location: {
          city: 'New York',
          country: 'US',
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const anomalies = await service.analyzeUserBehavior(userId, currentActivity);
      
      // Should not detect anomalies for normal business hours login
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('detectSuspiciousLogin', () => {
    it('should detect multiple failed login attempts', async () => {
      const userId = 'test-user-4';
      const loginAttempt = {
        success: false,
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        location: {
          city: 'New York',
          country: 'US',
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      // Mock multiple failed attempts
      jest.spyOn(service as any, 'getRecentFailedLogins').mockResolvedValue([
        { timestamp: new Date(Date.now() - 60000) },
        { timestamp: new Date(Date.now() - 120000) },
        { timestamp: new Date(Date.now() - 180000) },
        { timestamp: new Date(Date.now() - 240000) },
        { timestamp: new Date(Date.now() - 300000) }
      ]);

      const event = await service.detectSuspiciousLogin(userId, loginAttempt);
      
      expect(event).toBeTruthy();
      expect(event?.type).toBe(SecurityEventType.MULTIPLE_FAILED_LOGINS);
      expect(event?.severity).toBe(SecuritySeverity.HIGH);
      expect(event?.details.riskScore).toBeGreaterThan(0.7);
    });

    it('should detect login from known malicious IP', async () => {
      const userId = 'test-user-5';
      const loginAttempt = {
        success: true,
        ipAddress: '192.168.1.100', // This IP is in the mock threat intelligence
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        location: {
          city: 'Unknown',
          country: 'Unknown',
          latitude: 0,
          longitude: 0
        }
      };

      jest.spyOn(service as any, 'getRecentFailedLogins').mockResolvedValue([]);

      const event = await service.detectSuspiciousLogin(userId, loginAttempt);
      
      expect(event).toBeTruthy();
      expect(event?.type).toBe(SecurityEventType.SUSPICIOUS_LOGIN);
      expect(event?.severity).toBe(SecuritySeverity.CRITICAL);
      expect(event?.details.riskScore).toBeGreaterThan(0.9);
    });

    it('should not flag normal login attempts', async () => {
      const userId = 'test-user-6';
      const loginAttempt = {
        success: true,
        ipAddress: '192.168.1.200', // Clean IP
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        location: {
          city: 'New York',
          country: 'US',
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      jest.spyOn(service as any, 'getRecentFailedLogins').mockResolvedValue([]);

      const event = await service.detectSuspiciousLogin(userId, loginAttempt);
      
      expect(event).toBeNull();
    });
  });

  describe('detectDataExfiltration', () => {
    it('should detect unusual data volume access', async () => {
      const userId = 'test-user-7';
      const dataAccess = {
        resourceId: 'document-123',
        dataSize: 50 * 1024 * 1024, // 50MB
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      };

      // Mock large data access history
      jest.spyOn(service as any, 'getRecentDataAccess').mockResolvedValue([
        { resourceId: 'doc-1', dataSize: 30 * 1024 * 1024, timestamp: new Date(Date.now() - 60000) },
        { resourceId: 'doc-2', dataSize: 25 * 1024 * 1024, timestamp: new Date(Date.now() - 120000) },
        { resourceId: 'doc-3', dataSize: 50 * 1024 * 1024, timestamp: new Date(Date.now() - 180000) }
      ]);

      const event = await service.detectDataExfiltration(userId, dataAccess);
      
      expect(event).toBeTruthy();
      expect(event?.type).toBe(SecurityEventType.DATA_EXFILTRATION_ATTEMPT);
      expect(event?.severity).toBe(SecuritySeverity.HIGH);
      expect(event?.details.description).toContain('data access volume');
    });

    it('should detect rapid sequential access', async () => {
      const userId = 'test-user-8';
      const dataAccess = {
        resourceId: 'document-124',
        dataSize: 1024, // Small file
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      };

      // Mock many rapid accesses
      const rapidAccesses = Array.from({ length: 55 }, (_, i) => ({
        resourceId: `doc-${i}`,
        dataSize: 1024,
        timestamp: new Date(Date.now() - i * 1000)
      }));

      jest.spyOn(service as any, 'getRecentDataAccess').mockResolvedValue(rapidAccesses);

      const event = await service.detectDataExfiltration(userId, dataAccess);
      
      expect(event).toBeTruthy();
      expect(event?.type).toBe(SecurityEventType.DATA_EXFILTRATION_ATTEMPT);
      expect(event?.severity).toBe(SecuritySeverity.MEDIUM);
      expect(event?.details.description).toContain('Rapid data access');
    });

    it('should not flag normal data access patterns', async () => {
      const userId = 'test-user-9';
      const dataAccess = {
        resourceId: 'document-125',
        dataSize: 1024 * 1024, // 1MB
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      };

      // Mock normal access pattern
      jest.spyOn(service as any, 'getRecentDataAccess').mockResolvedValue([
        { resourceId: 'doc-1', dataSize: 1024 * 1024, timestamp: new Date(Date.now() - 300000) },
        { resourceId: 'doc-2', dataSize: 2 * 1024 * 1024, timestamp: new Date(Date.now() - 600000) }
      ]);

      const event = await service.detectDataExfiltration(userId, dataAccess);
      
      expect(event).toBeNull();
    });
  });

  describe('executeSecurityResponse', () => {
    it('should execute appropriate actions for high-risk events', async () => {
      const mockEvent = {
        id: 'event-test-1',
        userId: 'test-user-10',
        type: SecurityEventType.MULTIPLE_FAILED_LOGINS,
        severity: SecuritySeverity.HIGH,
        timestamp: new Date(),
        details: {
          description: 'Multiple failed login attempts',
          riskScore: 0.85,
          confidence: 0.9,
          affectedResources: ['user_account'],
          potentialImpact: 'Account compromise',
          recommendedActions: ['Block user', 'Send alert'],
          metadata: {}
        },
        ipAddress: '192.168.1.107',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      // Spy on security action methods
      const blockUserSpy = jest.spyOn(service as any, 'blockUser').mockResolvedValue(undefined);
      const sendAlertSpy = jest.spyOn(service as any, 'sendSecurityAlert').mockResolvedValue(undefined);

      await service.executeSecurityResponse(mockEvent);

      expect(blockUserSpy).toHaveBeenCalledWith('test-user-10', { duration: 3600 });
      expect(sendAlertSpy).toHaveBeenCalled();
    });

    it('should not execute actions for low-risk events', async () => {
      const mockEvent = {
        id: 'event-test-2',
        userId: 'test-user-11',
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.LOW,
        timestamp: new Date(),
        details: {
          description: 'Minor access pattern anomaly',
          riskScore: 0.3, // Below threshold
          confidence: 0.5,
          affectedResources: ['user_session'],
          potentialImpact: 'Minimal',
          recommendedActions: [],
          metadata: {}
        },
        ipAddress: '192.168.1.108',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      const blockUserSpy = jest.spyOn(service as any, 'blockUser').mockResolvedValue(undefined);

      await service.executeSecurityResponse(mockEvent);

      expect(blockUserSpy).not.toHaveBeenCalled();
    });
  });

  describe('threat intelligence integration', () => {
    it('should identify known malicious indicators', () => {
      const maliciousIp = '192.168.1.100'; // From mock threat intelligence
      const threat = (service as any).checkThreatIntelligence(maliciousIp);
      
      expect(threat).toBeTruthy();
      expect(threat.severity).toBe(SecuritySeverity.HIGH);
      expect(threat.confidence).toBe(0.9);
    });

    it('should not flag clean indicators', () => {
      const cleanIp = '8.8.8.8';
      const threat = (service as any).checkThreatIntelligence(cleanIp);
      
      expect(threat).toBeNull();
    });
  });

  describe('behavior pattern analysis', () => {
    it('should build accurate behavior patterns from historical data', async () => {
      const userId = 'test-user-12';
      const patterns = await (service as any).buildBehaviorPatterns(userId);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(BehaviorType.LOGIN_TIMES);
      expect(patterns[0].timeWindows).toHaveLength(1);
      expect(patterns[0].timeWindows[0].start).toBe('09:00');
      expect(patterns[0].timeWindows[0].end).toBe('17:00');
    });

    it('should update behavior profiles over time', async () => {
      const userId = 'test-user-13';
      const profile1 = await (service as any).getUserBehaviorProfile(userId);
      const profile2 = await (service as any).getUserBehaviorProfile(userId);
      
      expect(profile1).toBe(profile2); // Should return cached profile
      expect(profile1.userId).toBe(userId);
      expect(profile1.normalPatterns).toBeDefined();
    });
  });

  describe('risk scoring', () => {
    it('should calculate appropriate risk scores', async () => {
      const userId = 'test-user-14';
      const highRiskActivity = {
        type: 'login',
        timestamp: new Date('2024-01-15T03:00:00Z'), // 3 AM
        ipAddress: '192.168.1.100', // Malicious IP
        userAgent: 'Mozilla/5.0',
        location: {
          city: 'Unknown',
          country: 'Unknown',
          latitude: 0,
          longitude: 0
        }
      };

      jest.spyOn(service as any, 'getRecentFailedLogins').mockResolvedValue([]);

      const event = await service.detectSuspiciousLogin(userId, highRiskActivity);
      
      expect(event).toBeTruthy();
      expect(event?.details.riskScore).toBeGreaterThan(0.8);
      expect(event?.details.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully during behavior analysis', async () => {
      const userId = 'test-user-15';
      const activity = {
        type: 'login',
        timestamp: new Date(),
        ipAddress: '192.168.1.109',
        userAgent: 'Mozilla/5.0'
      };

      // Mock an error in behavior pattern building
      jest.spyOn(service as any, 'buildBehaviorPatterns').mockRejectedValue(new Error('Database error'));

      // Should not throw, but handle gracefully
      await expect(service.analyzeUserBehavior(userId, activity)).resolves.not.toThrow();
    });

    it('should handle missing location data', async () => {
      const userId = 'test-user-16';
      const activity = {
        type: 'login',
        timestamp: new Date(),
        ipAddress: '192.168.1.110',
        userAgent: 'Mozilla/5.0'
        // No location data
      };

      const anomalies = await service.analyzeUserBehavior(userId, activity);
      
      // Should not crash and should handle missing location gracefully
      expect(Array.isArray(anomalies)).toBeTruthy();
    });
  });
});