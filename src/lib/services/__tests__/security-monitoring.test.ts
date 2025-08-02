import { SecurityMonitoringService } from '../security-monitoring';
import { threatDetectionService } from '../threat-detection';
import { securityAlertService } from '../security-alerts';
import { complianceReportingService } from '../compliance-reporting';
import {
  SecurityEventType,
  SecuritySeverity,
  ComplianceType
} from '@/types/security';

// Mock the services
jest.mock('../threat-detection');
jest.mock('../security-alerts');
jest.mock('../compliance-reporting');

describe('SecurityMonitoringService', () => {
  let service: SecurityMonitoringService;
  let mockThreatDetectionService: jest.Mocked<typeof threatDetectionService>;
  let mockSecurityAlertService: jest.Mocked<typeof securityAlertService>;
  let mockComplianceReportingService: jest.Mocked<typeof complianceReportingService>;

  beforeEach(() => {
    service = new SecurityMonitoringService();
    mockThreatDetectionService = threatDetectionService as jest.Mocked<typeof threatDetectionService>;
    mockSecurityAlertService = securityAlertService as jest.Mocked<typeof securityAlertService>;
    mockComplianceReportingService = complianceReportingService as jest.Mocked<typeof complianceReportingService>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('monitorLogin', () => {
    const mockLoginData = {
      success: true,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(),
      location: {
        city: 'New York',
        country: 'US',
        latitude: 40.7128,
        longitude: -74.0060
      }
    };

    it('should detect and handle suspicious login', async () => {
      const mockSuspiciousEvent = {
        id: 'event-1',
        userId: 'user-1',
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.HIGH,
        timestamp: new Date(),
        details: {
          description: 'Suspicious login detected',
          riskScore: 0.85,
          confidence: 0.9,
          affectedResources: ['user_account'],
          potentialImpact: 'Account compromise',
          recommendedActions: ['Verify identity'],
          metadata: {}
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      mockThreatDetectionService.detectSuspiciousLogin.mockResolvedValue(mockSuspiciousEvent);
      mockThreatDetectionService.analyzeUserBehavior.mockResolvedValue([]);
      mockThreatDetectionService.executeSecurityResponse.mockResolvedValue(undefined);
      mockSecurityAlertService.createAlert.mockResolvedValue({} as any);

      await service.monitorLogin('user-1', mockLoginData);

      expect(mockThreatDetectionService.detectSuspiciousLogin).toHaveBeenCalledWith('user-1', mockLoginData);
      expect(mockThreatDetectionService.analyzeUserBehavior).toHaveBeenCalledWith('user-1', mockLoginData);
      expect(mockThreatDetectionService.executeSecurityResponse).toHaveBeenCalledWith(mockSuspiciousEvent);
    });

    it('should handle behavior anomalies', async () => {
      const mockBehaviorAnomaly = {
        id: 'event-2',
        userId: 'user-1',
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.MEDIUM,
        timestamp: new Date(),
        details: {
          description: 'Unusual access pattern detected',
          riskScore: 0.7,
          confidence: 0.8,
          affectedResources: ['user_session'],
          potentialImpact: 'Unauthorized access',
          recommendedActions: ['Monitor session'],
          metadata: {}
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      mockThreatDetectionService.detectSuspiciousLogin.mockResolvedValue(null);
      mockThreatDetectionService.analyzeUserBehavior.mockResolvedValue([mockBehaviorAnomaly]);
      mockThreatDetectionService.executeSecurityResponse.mockResolvedValue(undefined);

      await service.monitorLogin('user-1', mockLoginData);

      expect(mockThreatDetectionService.executeSecurityResponse).toHaveBeenCalledWith(mockBehaviorAnomaly);
    });

    it('should not process events when monitoring is disabled', async () => {
      service.setMonitoringEnabled(false);

      await service.monitorLogin('user-1', mockLoginData);

      expect(mockThreatDetectionService.detectSuspiciousLogin).not.toHaveBeenCalled();
      expect(mockThreatDetectionService.analyzeUserBehavior).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockThreatDetectionService.detectSuspiciousLogin.mockRejectedValue(new Error('Detection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.monitorLogin('user-1', mockLoginData)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Error monitoring login:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('monitorDataAccess', () => {
    const mockAccessData = {
      resourceId: 'document-123',
      dataSize: 1024 * 1024,
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date()
    };

    it('should detect and handle data exfiltration attempts', async () => {
      const mockExfiltrationEvent = {
        id: 'event-3',
        userId: 'user-2',
        type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        timestamp: new Date(),
        details: {
          description: 'Data exfiltration attempt detected',
          riskScore: 0.9,
          confidence: 0.85,
          affectedResources: ['document-123'],
          potentialImpact: 'Data breach',
          recommendedActions: ['Limit access', 'Review permissions'],
          metadata: {}
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      mockThreatDetectionService.detectDataExfiltration.mockResolvedValue(mockExfiltrationEvent);
      mockThreatDetectionService.analyzeUserBehavior.mockResolvedValue([]);
      mockThreatDetectionService.executeSecurityResponse.mockResolvedValue(undefined);

      await service.monitorDataAccess('user-2', mockAccessData);

      expect(mockThreatDetectionService.detectDataExfiltration).toHaveBeenCalledWith('user-2', mockAccessData);
      expect(mockThreatDetectionService.executeSecurityResponse).toHaveBeenCalledWith(mockExfiltrationEvent);
    });

    it('should handle normal data access without alerts', async () => {
      mockThreatDetectionService.detectDataExfiltration.mockResolvedValue(null);
      mockThreatDetectionService.analyzeUserBehavior.mockResolvedValue([]);

      await service.monitorDataAccess('user-2', mockAccessData);

      expect(mockThreatDetectionService.detectDataExfiltration).toHaveBeenCalled();
      expect(mockThreatDetectionService.executeSecurityResponse).not.toHaveBeenCalled();
    });
  });

  describe('monitorApiRequest', () => {
    it('should detect SQL injection attempts', async () => {
      const mockRequestData = {
        endpoint: '/api/users',
        parameters: { search: "'; DROP TABLE users; --" },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0'
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockThreatDetectionService.executeSecurityResponse.mockResolvedValue(undefined);

      await service.monitorApiRequest('user-3', mockRequestData);

      expect(mockThreatDetectionService.executeSecurityResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SecurityEventType.SQL_INJECTION_ATTEMPT,
          severity: SecuritySeverity.HIGH
        })
      );

      consoleSpy.mockRestore();
    });

    it('should detect XSS attempts', async () => {
      const mockRequestData = {
        endpoint: '/api/comments',
        parameters: { comment: '<script>alert("xss")</script>' },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0'
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockThreatDetectionService.executeSecurityResponse.mockResolvedValue(undefined);

      await service.monitorApiRequest('user-4', mockRequestData);

      expect(mockThreatDetectionService.executeSecurityResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SecurityEventType.XSS_ATTEMPT,
          severity: SecuritySeverity.MEDIUM
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not flag clean API requests', async () => {
      const mockRequestData = {
        endpoint: '/api/users',
        parameters: { search: 'john doe' },
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0'
      };

      await service.monitorApiRequest('user-5', mockRequestData);

      expect(mockThreatDetectionService.executeSecurityResponse).not.toHaveBeenCalled();
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report and return report ID', async () => {
      const mockReport = {
        id: 'report-123',
        type: ComplianceType.GDPR,
        period: { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        generatedAt: new Date(),
        generatedBy: 'admin-1',
        data: {} as any,
        status: 'completed' as any
      };

      mockComplianceReportingService.generateComplianceReport.mockResolvedValue(mockReport);

      const reportId = await service.generateComplianceReport(
        ComplianceType.GDPR,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'admin-1'
      );

      expect(reportId).toBe('report-123');
      expect(mockComplianceReportingService.generateComplianceReport).toHaveBeenCalledWith(
        ComplianceType.GDPR,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
        'admin-1'
      );
    });
  });

  describe('getSecurityDashboard', () => {
    beforeEach(() => {
      mockSecurityAlertService.getUnacknowledgedAlerts.mockReturnValue([
        {
          id: 'alert-1',
          eventId: 'event-1',
          recipientId: 'user-1',
          type: 'in_app' as any,
          priority: 'high' as any,
          title: 'Security Alert',
          message: 'Test alert',
          sent: true,
          acknowledged: false,
          createdAt: new Date()
        }
      ]);

      mockSecurityAlertService.getAlertStatistics.mockReturnValue({
        total: 5,
        acknowledged: 2,
        unacknowledged: 3,
        byPriority: {
          urgent: 1,
          high: 2,
          medium: 1,
          low: 1
        } as any,
        byType: {
          email: 2,
          sms: 1,
          push: 1,
          in_app: 1,
          webhook: 0
        } as any
      });

      mockComplianceReportingService.getRecentReports.mockReturnValue([
        {
          id: 'report-1',
          type: ComplianceType.GDPR,
          period: { startDate: new Date(), endDate: new Date() },
          generatedAt: new Date(),
          generatedBy: 'admin-1',
          data: {} as any,
          status: 'completed' as any
        }
      ]);
    });

    it('should return comprehensive dashboard data', async () => {
      const dashboardData = await service.getSecurityDashboard('user-1');

      expect(dashboardData.unacknowledgedAlerts).toBe(1);
      expect(dashboardData.alertsByPriority).toBeDefined();
      expect(dashboardData.recentSecurityEvents).toBeDefined();
      expect(dashboardData.complianceStatus).toBeDefined();
      expect(dashboardData.recentReports).toBeDefined();
      expect(dashboardData.threatLevel).toBeDefined();
    });

    it('should calculate threat level correctly', async () => {
      // Mock critical alerts
      mockSecurityAlertService.getUnacknowledgedAlerts.mockReturnValue([
        {
          id: 'alert-1',
          priority: 'urgent' as any,
          eventId: 'event-1',
          recipientId: 'user-1',
          type: 'in_app' as any,
          title: 'Critical Alert',
          message: 'Test alert',
          sent: true,
          acknowledged: false,
          createdAt: new Date()
        }
      ]);

      const dashboardData = await service.getSecurityDashboard();

      expect(dashboardData.threatLevel).toBe('critical');
    });

    it('should include compliance status for all frameworks', async () => {
      const dashboardData = await service.getSecurityDashboard();

      expect(dashboardData.complianceStatus.gdpr).toBeDefined();
      expect(dashboardData.complianceStatus.hipaa).toBeDefined();
      expect(dashboardData.complianceStatus.sox).toBeDefined();
      expect(dashboardData.complianceStatus.iso27001).toBeDefined();
    });
  });

  describe('alert creation', () => {
    it('should create alerts for high-risk events', async () => {
      const mockHighRiskEvent = {
        id: 'event-high',
        userId: 'user-1',
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.HIGH,
        timestamp: new Date(),
        details: {
          description: 'High risk event',
          riskScore: 0.85,
          confidence: 0.9,
          affectedResources: ['user_account'],
          potentialImpact: 'Account compromise',
          recommendedActions: ['Verify identity'],
          metadata: {}
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      mockSecurityAlertService.createAlert.mockResolvedValue({} as any);

      await (service as any).createAlertsForEvent(mockHighRiskEvent);

      expect(mockSecurityAlertService.createAlert).toHaveBeenCalledTimes(2); // IN_APP and EMAIL
    });

    it('should create SMS alerts for critical events', async () => {
      const mockCriticalEvent = {
        id: 'event-critical',
        userId: 'user-1',
        type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        timestamp: new Date(),
        details: {
          description: 'Critical event',
          riskScore: 0.95,
          confidence: 0.9,
          affectedResources: ['sensitive_data'],
          potentialImpact: 'Data breach',
          recommendedActions: ['Block user', 'Investigate'],
          metadata: {}
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      mockSecurityAlertService.createAlert.mockResolvedValue({} as any);

      await (service as any).createAlertsForEvent(mockCriticalEvent);

      expect(mockSecurityAlertService.createAlert).toHaveBeenCalledTimes(3); // IN_APP, EMAIL, and SMS
    });

    it('should not create alerts for low-risk events', async () => {
      const mockLowRiskEvent = {
        id: 'event-low',
        userId: 'user-1',
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.LOW,
        timestamp: new Date(),
        details: {
          description: 'Low risk event',
          riskScore: 0.3,
          confidence: 0.5,
          affectedResources: ['user_session'],
          potentialImpact: 'Minimal',
          recommendedActions: [],
          metadata: {}
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      await (service as any).createAlertsForEvent(mockLowRiskEvent);

      expect(mockSecurityAlertService.createAlert).not.toHaveBeenCalled();
    });
  });

  describe('administrator notifications', () => {
    it('should notify administrators for critical events', async () => {
      const mockCriticalEvent = {
        id: 'event-critical',
        userId: 'user-1',
        type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        timestamp: new Date(),
        details: {
          description: 'Critical security event',
          riskScore: 0.95,
          confidence: 0.9,
          affectedResources: ['sensitive_data'],
          potentialImpact: 'Data breach',
          recommendedActions: ['Immediate action required'],
          metadata: {}
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        resolved: false
      };

      mockSecurityAlertService.createAlert.mockResolvedValue({} as any);

      await (service as any).notifyAdministrators(mockCriticalEvent);

      // Should create alerts for each admin (2 admins * 2 alert types = 4 calls)
      expect(mockSecurityAlertService.createAlert).toHaveBeenCalledTimes(4);
    });
  });

  describe('configuration management', () => {
    it('should enable and disable monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.setMonitoringEnabled(false);
      expect(consoleSpy).toHaveBeenCalledWith('Security monitoring disabled');

      service.setMonitoringEnabled(true);
      expect(consoleSpy).toHaveBeenCalledWith('Security monitoring enabled');

      consoleSpy.mockRestore();
    });

    it('should update alert thresholds', () => {
      service.setAlertThreshold(SecurityEventType.SUSPICIOUS_LOGIN, 0.9);

      // Verify threshold was updated by checking internal state
      const thresholds = (service as any).alertThresholds;
      expect(thresholds.get(SecurityEventType.SUSPICIOUS_LOGIN)).toBe(0.9);
    });
  });

  describe('pattern detection', () => {
    it('should detect SQL injection patterns', () => {
      const sqlInjectionData = {
        endpoint: '/api/search',
        parameters: { query: "'; DROP TABLE users; --" },
        body: ''
      };

      const result = (service as any).detectSqlInjection(sqlInjectionData);
      expect(result).toBe(true);
    });

    it('should detect XSS patterns', () => {
      const xssData = {
        endpoint: '/api/comment',
        parameters: { content: '<script>alert("xss")</script>' },
        body: ''
      };

      const result = (service as any).detectXssAttempt(xssData);
      expect(result).toBe(true);
    });

    it('should not flag clean requests', () => {
      const cleanData = {
        endpoint: '/api/search',
        parameters: { query: 'normal search term' },
        body: ''
      };

      const sqlResult = (service as any).detectSqlInjection(cleanData);
      const xssResult = (service as any).detectXssAttempt(cleanData);

      expect(sqlResult).toBe(false);
      expect(xssResult).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle data access monitoring errors', async () => {
      mockThreatDetectionService.detectDataExfiltration.mockRejectedValue(new Error('Detection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.monitorDataAccess('user-1', {} as any)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Error monitoring data access:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle API request monitoring errors', async () => {
      // Force an error by providing invalid data
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.monitorApiRequest('user-1', null as any)).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});