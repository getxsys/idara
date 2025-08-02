import { SecurityAlertService } from '../security-alerts';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  AlertType,
  AlertPriority
} from '@/types/security';

describe('SecurityAlertService', () => {
  let service: SecurityAlertService;
  let mockSecurityEvent: SecurityEvent;

  beforeEach(() => {
    service = new SecurityAlertService();
    mockSecurityEvent = {
      id: 'event-test-1',
      userId: 'user-123',
      type: SecurityEventType.SUSPICIOUS_LOGIN,
      severity: SecuritySeverity.HIGH,
      timestamp: new Date(),
      details: {
        description: 'Suspicious login detected from unusual location',
        riskScore: 0.85,
        confidence: 0.9,
        affectedResources: ['user_account'],
        potentialImpact: 'Account compromise',
        recommendedActions: ['Verify identity', 'Change password'],
        metadata: {
          ipAddress: '192.168.1.100',
          location: 'Unknown'
        }
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      resolved: false
    };
  });

  describe('createAlert', () => {
    it('should create an alert with correct properties', async () => {
      const recipientId = 'admin-1';
      const alert = await service.createAlert(mockSecurityEvent, recipientId, AlertType.EMAIL);

      expect(alert.id).toBeDefined();
      expect(alert.eventId).toBe(mockSecurityEvent.id);
      expect(alert.recipientId).toBe(recipientId);
      expect(alert.type).toBe(AlertType.EMAIL);
      expect(alert.priority).toBe(AlertPriority.HIGH);
      expect(alert.title).toBe('Suspicious Login Detected');
      expect(alert.message).toContain('Suspicious login detected from unusual location');
      expect(alert.sent).toBe(true);
      expect(alert.sentAt).toBeDefined();
      expect(alert.acknowledged).toBe(false);
      expect(alert.createdAt).toBeDefined();
    });

    it('should determine correct priority based on event severity', async () => {
      const criticalEvent = { ...mockSecurityEvent, severity: SecuritySeverity.CRITICAL };
      const mediumEvent = { ...mockSecurityEvent, severity: SecuritySeverity.MEDIUM };
      const lowEvent = { ...mockSecurityEvent, severity: SecuritySeverity.LOW };

      const criticalAlert = await service.createAlert(criticalEvent, 'user-1', AlertType.IN_APP);
      const mediumAlert = await service.createAlert(mediumEvent, 'user-1', AlertType.IN_APP);
      const lowAlert = await service.createAlert(lowEvent, 'user-1', AlertType.IN_APP);

      expect(criticalAlert.priority).toBe(AlertPriority.URGENT);
      expect(mediumAlert.priority).toBe(AlertPriority.MEDIUM);
      expect(lowAlert.priority).toBe(AlertPriority.LOW);
    });

    it('should generate appropriate alert titles for different event types', async () => {
      const eventTypes = [
        { type: SecurityEventType.MULTIPLE_FAILED_LOGINS, expectedTitle: 'Multiple Failed Login Attempts' },
        { type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT, expectedTitle: 'Potential Data Exfiltration' },
        { type: SecurityEventType.UNUSUAL_ACCESS_PATTERN, expectedTitle: 'Unusual Access Pattern Detected' },
        { type: SecurityEventType.BRUTE_FORCE_ATTACK, expectedTitle: 'Brute Force Attack Detected' }
      ];

      for (const { type, expectedTitle } of eventTypes) {
        const event = { ...mockSecurityEvent, type };
        const alert = await service.createAlert(event, 'user-1', AlertType.IN_APP);
        expect(alert.title).toBe(expectedTitle);
      }
    });

    it('should include comprehensive information in alert message', async () => {
      const alert = await service.createAlert(mockSecurityEvent, 'user-1', AlertType.EMAIL);

      expect(alert.message).toContain('Security event detected for user user-123');
      expect(alert.message).toContain('Risk Score: 85%');
      expect(alert.message).toContain('Confidence: 90%');
      expect(alert.message).toContain('IP Address: 192.168.1.100');
      expect(alert.message).toContain('Recommended Actions:');
      expect(alert.message).toContain('1. Verify identity');
      expect(alert.message).toContain('2. Change password');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert correctly', async () => {
      const alert = await service.createAlert(mockSecurityEvent, 'user-1', AlertType.IN_APP);
      const acknowledgedBy = 'admin-1';

      await service.acknowledgeAlert(alert.id, acknowledgedBy);

      const updatedAlert = service.getAlertsForRecipient('user-1')[0];
      expect(updatedAlert.acknowledged).toBe(true);
      expect(updatedAlert.acknowledgedBy).toBe(acknowledgedBy);
      expect(updatedAlert.acknowledgedAt).toBeDefined();
    });

    it('should not affect non-existent alerts', async () => {
      await expect(service.acknowledgeAlert('non-existent-id', 'admin-1')).resolves.not.toThrow();
    });
  });

  describe('getAlertsForRecipient', () => {
    it('should return alerts for specific recipient', async () => {
      const recipientId = 'user-1';
      await service.createAlert(mockSecurityEvent, recipientId, AlertType.IN_APP);
      await service.createAlert(mockSecurityEvent, 'user-2', AlertType.IN_APP);

      const alerts = service.getAlertsForRecipient(recipientId);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].recipientId).toBe(recipientId);
    });

    it('should return alerts sorted by creation date (newest first)', async () => {
      const recipientId = 'user-1';
      
      // Create alerts with slight delay to ensure different timestamps
      const alert1 = await service.createAlert(mockSecurityEvent, recipientId, AlertType.IN_APP);
      await new Promise(resolve => setTimeout(resolve, 10));
      const alert2 = await service.createAlert(mockSecurityEvent, recipientId, AlertType.IN_APP);

      const alerts = service.getAlertsForRecipient(recipientId);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].createdAt.getTime()).toBeGreaterThan(alerts[1].createdAt.getTime());
    });

    it('should return empty array for recipient with no alerts', () => {
      const alerts = service.getAlertsForRecipient('non-existent-user');
      expect(alerts).toHaveLength(0);
    });
  });

  describe('getUnacknowledgedAlerts', () => {
    it('should return only unacknowledged alerts', async () => {
      const alert1 = await service.createAlert(mockSecurityEvent, 'user-1', AlertType.IN_APP);
      const alert2 = await service.createAlert(mockSecurityEvent, 'user-2', AlertType.IN_APP);
      
      await service.acknowledgeAlert(alert1.id, 'admin-1');

      const unacknowledged = service.getUnacknowledgedAlerts();

      expect(unacknowledged).toHaveLength(1);
      expect(unacknowledged[0].id).toBe(alert2.id);
      expect(unacknowledged[0].acknowledged).toBe(false);
    });

    it('should filter by recipient when specified', async () => {
      await service.createAlert(mockSecurityEvent, 'user-1', AlertType.IN_APP);
      await service.createAlert(mockSecurityEvent, 'user-2', AlertType.IN_APP);

      const unacknowledgedForUser1 = service.getUnacknowledgedAlerts('user-1');

      expect(unacknowledgedForUser1).toHaveLength(1);
      expect(unacknowledgedForUser1[0].recipientId).toBe('user-1');
    });

    it('should sort by priority (highest first)', async () => {
      const lowEvent = { ...mockSecurityEvent, severity: SecuritySeverity.LOW };
      const criticalEvent = { ...mockSecurityEvent, severity: SecuritySeverity.CRITICAL };

      await service.createAlert(lowEvent, 'user-1', AlertType.IN_APP);
      await service.createAlert(criticalEvent, 'user-1', AlertType.IN_APP);

      const alerts = service.getUnacknowledgedAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts[0].priority).toBe(AlertPriority.URGENT);
      expect(alerts[1].priority).toBe(AlertPriority.LOW);
    });
  });

  describe('createBulkAlerts', () => {
    it('should create alerts for multiple recipients', async () => {
      const recipientIds = ['user-1', 'user-2', 'user-3'];
      const alerts = await service.createBulkAlerts(mockSecurityEvent, recipientIds, AlertType.EMAIL);

      expect(alerts).toHaveLength(3);
      alerts.forEach((alert, index) => {
        expect(alert.recipientId).toBe(recipientIds[index]);
        expect(alert.eventId).toBe(mockSecurityEvent.id);
        expect(alert.type).toBe(AlertType.EMAIL);
      });
    });

    it('should handle empty recipient list', async () => {
      const alerts = await service.createBulkAlerts(mockSecurityEvent, [], AlertType.IN_APP);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('getAlertStatistics', () => {
    beforeEach(async () => {
      // Create test data
      const events = [
        { ...mockSecurityEvent, severity: SecuritySeverity.CRITICAL },
        { ...mockSecurityEvent, severity: SecuritySeverity.HIGH },
        { ...mockSecurityEvent, severity: SecuritySeverity.MEDIUM },
        { ...mockSecurityEvent, severity: SecuritySeverity.LOW }
      ];

      for (const event of events) {
        await service.createAlert(event, 'user-1', AlertType.IN_APP);
        await service.createAlert(event, 'user-1', AlertType.EMAIL);
      }

      // Acknowledge some alerts
      const alerts = service.getAlertsForRecipient('user-1');
      await service.acknowledgeAlert(alerts[0].id, 'admin-1');
      await service.acknowledgeAlert(alerts[1].id, 'admin-1');
    });

    it('should return correct overall statistics', () => {
      const stats = service.getAlertStatistics();

      expect(stats.total).toBe(8);
      expect(stats.acknowledged).toBe(2);
      expect(stats.unacknowledged).toBe(6);
    });

    it('should return correct statistics for specific user', () => {
      const stats = service.getAlertStatistics('user-1');

      expect(stats.total).toBe(8);
      expect(stats.acknowledged).toBe(2);
      expect(stats.unacknowledged).toBe(6);
    });

    it('should return correct priority breakdown', () => {
      const stats = service.getAlertStatistics('user-1');

      expect(stats.byPriority[AlertPriority.URGENT]).toBe(2);
      expect(stats.byPriority[AlertPriority.HIGH]).toBe(2);
      expect(stats.byPriority[AlertPriority.MEDIUM]).toBe(2);
      expect(stats.byPriority[AlertPriority.LOW]).toBe(2);
    });

    it('should return correct type breakdown', () => {
      const stats = service.getAlertStatistics('user-1');

      expect(stats.byType[AlertType.IN_APP]).toBe(4);
      expect(stats.byType[AlertType.EMAIL]).toBe(4);
      expect(stats.byType[AlertType.SMS]).toBe(0);
      expect(stats.byType[AlertType.PUSH]).toBe(0);
      expect(stats.byType[AlertType.WEBHOOK]).toBe(0);
    });
  });

  describe('alert handlers', () => {
    it('should handle email alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.createAlert(mockSecurityEvent, 'user-1', AlertType.EMAIL);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending email alert')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle SMS alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.createAlert(mockSecurityEvent, 'user-1', AlertType.SMS);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending SMS alert')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle push notification alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.createAlert(mockSecurityEvent, 'user-1', AlertType.PUSH);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending push alert')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle webhook alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.createAlert(mockSecurityEvent, 'user-1', AlertType.WEBHOOK);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending webhook alert')
      );
      
      consoleSpy.mockRestore();
    });

    it('should mark alerts as sent after successful delivery', async () => {
      const alert = await service.createAlert(mockSecurityEvent, 'user-1', AlertType.IN_APP);

      expect(alert.sent).toBe(true);
      expect(alert.sentAt).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle alert handler failures gracefully', async () => {
      // Mock a failing handler
      const originalHandler = (service as any).alertHandlers.get(AlertType.EMAIL);
      (service as any).alertHandlers.set(AlertType.EMAIL, jest.fn().mockRejectedValue(new Error('Email service down')));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const alert = await service.createAlert(mockSecurityEvent, 'user-1', AlertType.EMAIL);

      expect(alert.sent).toBe(false);
      expect(alert.sentAt).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send alert'),
        expect.any(Error)
      );

      // Restore original handler
      (service as any).alertHandlers.set(AlertType.EMAIL, originalHandler);
      consoleSpy.mockRestore();
    });
  });

  describe('alert message formatting', () => {
    it('should include location information when available', async () => {
      const eventWithLocation = {
        ...mockSecurityEvent,
        location: {
          city: 'New York',
          country: 'US',
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const alert = await service.createAlert(eventWithLocation, 'user-1', AlertType.EMAIL);

      expect(alert.message).toContain('Location: New York, US');
    });

    it('should handle events without location gracefully', async () => {
      const eventWithoutLocation = {
        ...mockSecurityEvent,
        location: undefined
      };

      const alert = await service.createAlert(eventWithoutLocation, 'user-1', AlertType.EMAIL);

      expect(alert.message).not.toContain('Location:');
      expect(alert.message).toContain('Risk Score: 85%');
    });

    it('should format recommended actions as numbered list', async () => {
      const alert = await service.createAlert(mockSecurityEvent, 'user-1', AlertType.EMAIL);

      expect(alert.message).toContain('Recommended Actions:');
      expect(alert.message).toContain('1. Verify identity');
      expect(alert.message).toContain('2. Change password');
    });
  });
});