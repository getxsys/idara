import { threatDetectionService } from './threat-detection';
import { securityAlertService } from './security-alerts';
import { complianceReportingService } from './compliance-reporting';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  AlertType,
  ComplianceType,
  ReportPeriod
} from '@/types/security';

export class SecurityMonitoringService {
  private monitoringEnabled: boolean = true;
  private alertThresholds: Map<SecurityEventType, number> = new Map();
  private adminUsers: string[] = ['admin-1', 'admin-2']; // Mock admin user IDs

  constructor() {
    this.initializeAlertThresholds();
    this.startContinuousMonitoring();
  }

  /**
   * Monitor user login activity
   */
  async monitorLogin(userId: string, loginData: any): Promise<void> {
    if (!this.monitoringEnabled) return;

    try {
      // Detect suspicious login patterns
      const suspiciousLogin = await threatDetectionService.detectSuspiciousLogin(userId, loginData);
      if (suspiciousLogin) {
        await this.handleSecurityEvent(suspiciousLogin);
      }

      // Analyze user behavior
      const behaviorAnomalies = await threatDetectionService.analyzeUserBehavior(userId, loginData);
      for (const anomaly of behaviorAnomalies) {
        await this.handleSecurityEvent(anomaly);
      }
    } catch (error) {
      console.error('Error monitoring login:', error);
    }
  }

  /**
   * Monitor data access activity
   */
  async monitorDataAccess(userId: string, accessData: any): Promise<void> {
    if (!this.monitoringEnabled) return;

    try {
      // Detect potential data exfiltration
      const exfiltrationAttempt = await threatDetectionService.detectDataExfiltration(userId, accessData);
      if (exfiltrationAttempt) {
        await this.handleSecurityEvent(exfiltrationAttempt);
      }

      // Analyze access patterns
      const behaviorAnomalies = await threatDetectionService.analyzeUserBehavior(userId, accessData);
      for (const anomaly of behaviorAnomalies) {
        await this.handleSecurityEvent(anomaly);
      }
    } catch (error) {
      console.error('Error monitoring data access:', error);
    }
  }

  /**
   * Monitor API requests for suspicious activity
   */
  async monitorApiRequest(userId: string, requestData: any): Promise<void> {
    if (!this.monitoringEnabled) return;

    try {
      // Check for SQL injection attempts
      if (this.detectSqlInjection(requestData)) {
        const event = this.createSecurityEvent({
          userId,
          type: SecurityEventType.SQL_INJECTION_ATTEMPT,
          severity: SecuritySeverity.HIGH,
          details: {
            description: 'SQL injection attempt detected in API request',
            riskScore: 0.9,
            confidence: 0.85,
            affectedResources: [requestData.endpoint],
            potentialImpact: 'Database compromise',
            recommendedActions: ['Block request', 'Review input validation'],
            metadata: {
              endpoint: requestData.endpoint,
              parameters: requestData.parameters
            }
          },
          ipAddress: requestData.ipAddress,
          userAgent: requestData.userAgent
        });
        await this.handleSecurityEvent(event);
      }

      // Check for XSS attempts
      if (this.detectXssAttempt(requestData)) {
        const event = this.createSecurityEvent({
          userId,
          type: SecurityEventType.XSS_ATTEMPT,
          severity: SecuritySeverity.MEDIUM,
          details: {
            description: 'Cross-site scripting attempt detected',
            riskScore: 0.7,
            confidence: 0.8,
            affectedResources: [requestData.endpoint],
            potentialImpact: 'Client-side code execution',
            recommendedActions: ['Sanitize input', 'Review output encoding'],
            metadata: {
              endpoint: requestData.endpoint,
              payload: requestData.payload
            }
          },
          ipAddress: requestData.ipAddress,
          userAgent: requestData.userAgent
        });
        await this.handleSecurityEvent(event);
      }
    } catch (error) {
      console.error('Error monitoring API request:', error);
    }
  }

  /**
   * Handle security event
   */
  private async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    console.log(`Security event detected: ${event.type} (${event.severity})`);

    // Execute automated security response
    await threatDetectionService.executeSecurityResponse(event);

    // Create alerts based on severity and thresholds
    await this.createAlertsForEvent(event);

    // Log event for compliance
    await this.logSecurityEvent(event);

    // Notify administrators for critical events
    if (event.severity === SecuritySeverity.CRITICAL) {
      await this.notifyAdministrators(event);
    }
  }

  /**
   * Create alerts for security event
   */
  private async createAlertsForEvent(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type) || 0.5;
    
    if (event.details.riskScore >= threshold) {
      // Create alert for the affected user
      await securityAlertService.createAlert(event, event.userId, AlertType.IN_APP);

      // Create email alert for high severity events
      if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
        await securityAlertService.createAlert(event, event.userId, AlertType.EMAIL);
      }

      // Create SMS alert for critical events
      if (event.severity === SecuritySeverity.CRITICAL) {
        await securityAlertService.createAlert(event, event.userId, AlertType.SMS);
      }
    }
  }

  /**
   * Notify administrators about critical events
   */
  private async notifyAdministrators(event: SecurityEvent): Promise<void> {
    for (const adminId of this.adminUsers) {
      await securityAlertService.createAlert(event, adminId, AlertType.EMAIL);
      await securityAlertService.createAlert(event, adminId, AlertType.IN_APP);
    }
  }

  /**
   * Log security event for compliance
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // In a real implementation, this would store the event in a database
    // for compliance reporting and audit trails
    console.log(`Logging security event ${event.id} for compliance`);
  }

  /**
   * Generate compliance reports
   */
  async generateComplianceReport(
    type: ComplianceType,
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<string> {
    const period: ReportPeriod = { startDate, endDate };
    const report = await complianceReportingService.generateComplianceReport(type, period, generatedBy);
    return report.id;
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(userId?: string): Promise<SecurityDashboardData> {
    const alerts = securityAlertService.getUnacknowledgedAlerts(userId);
    const alertStats = securityAlertService.getAlertStatistics(userId);
    const recentReports = complianceReportingService.getRecentReports(5);

    return {
      unacknowledgedAlerts: alerts.length,
      alertsByPriority: alertStats.byPriority,
      recentSecurityEvents: await this.getRecentSecurityEvents(10),
      complianceStatus: this.getComplianceStatus(),
      recentReports: recentReports.map(r => ({
        id: r.id,
        type: r.type,
        status: r.status,
        generatedAt: r.generatedAt
      })),
      threatLevel: this.calculateThreatLevel()
    };
  }

  /**
   * Get recent security events
   */
  private async getRecentSecurityEvents(limit: number): Promise<SecurityEventSummary[]> {
    // Mock implementation - would query actual events from database
    return [
      {
        id: 'event-1',
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.HIGH,
        timestamp: new Date(Date.now() - 3600000),
        userId: 'user-1',
        resolved: false
      },
      {
        id: 'event-2',
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.MEDIUM,
        timestamp: new Date(Date.now() - 7200000),
        userId: 'user-2',
        resolved: true
      }
    ];
  }

  /**
   * Get compliance status
   */
  private getComplianceStatus(): ComplianceStatus {
    return {
      gdpr: { compliant: true, lastAssessment: new Date(Date.now() - 86400000 * 30) },
      hipaa: { compliant: true, lastAssessment: new Date(Date.now() - 86400000 * 45) },
      sox: { compliant: false, lastAssessment: new Date(Date.now() - 86400000 * 60) },
      iso27001: { compliant: true, lastAssessment: new Date(Date.now() - 86400000 * 20) }
    };
  }

  /**
   * Calculate current threat level
   */
  private calculateThreatLevel(): ThreatLevel {
    const unacknowledgedAlerts = securityAlertService.getUnacknowledgedAlerts();
    const criticalAlerts = unacknowledgedAlerts.filter(a => a.priority === 'urgent').length;
    const highAlerts = unacknowledgedAlerts.filter(a => a.priority === 'high').length;

    if (criticalAlerts > 0) return 'critical';
    if (highAlerts > 2) return 'high';
    if (unacknowledgedAlerts.length > 5) return 'medium';
    return 'low';
  }

  /**
   * Detect SQL injection attempts
   */
  private detectSqlInjection(requestData: any): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b.*\b(FROM|INTO|WHERE|VALUES)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'.*(\bOR\b|\bAND\b).*\')/i,
      /(;.*--)|(\/\*.*\*\/)/,
      /(\bUNION\b.*\bSELECT\b)/i
    ];

    const payload = JSON.stringify(requestData.parameters || {}) + (requestData.body || '');
    return sqlPatterns.some(pattern => pattern.test(payload));
  }

  /**
   * Detect XSS attempts
   */
  private detectXssAttempt(requestData: unknown): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
    ];

    const payload = JSON.stringify(requestData.parameters || {}) + (requestData.body || '');
    return xssPatterns.some(pattern => pattern.test(payload));
  }

  /**
   * Create security event
   */
  private createSecurityEvent(eventData: Partial<SecurityEvent>): SecurityEvent {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false,
      ...eventData
    } as SecurityEvent;
  }

  /**
   * Initialize alert thresholds
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds.set(SecurityEventType.SUSPICIOUS_LOGIN, 0.7);
    this.alertThresholds.set(SecurityEventType.MULTIPLE_FAILED_LOGINS, 0.8);
    this.alertThresholds.set(SecurityEventType.DATA_EXFILTRATION_ATTEMPT, 0.85);
    this.alertThresholds.set(SecurityEventType.UNUSUAL_ACCESS_PATTERN, 0.6);
    this.alertThresholds.set(SecurityEventType.SQL_INJECTION_ATTEMPT, 0.9);
    this.alertThresholds.set(SecurityEventType.XSS_ATTEMPT, 0.7);
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    // In a real implementation, this would set up background processes
    // to continuously monitor system health, update threat intelligence, etc.
    console.log('Security monitoring service started');
  }

  /**
   * Enable/disable monitoring
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    console.log(`Security monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update alert threshold for event type
   */
  setAlertThreshold(eventType: SecurityEventType, threshold: number): void {
    this.alertThresholds.set(eventType, threshold);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Types for dashboard data
interface SecurityDashboardData {
  unacknowledgedAlerts: number;
  alertsByPriority: Record<string, number>;
  recentSecurityEvents: SecurityEventSummary[];
  complianceStatus: ComplianceStatus;
  recentReports: ReportSummary[];
  threatLevel: ThreatLevel;
}

interface SecurityEventSummary {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId: string;
  resolved: boolean;
}

interface ComplianceStatus {
  gdpr: { compliant: boolean; lastAssessment: Date };
  hipaa: { compliant: boolean; lastAssessment: Date };
  sox: { compliant: boolean; lastAssessment: Date };
  iso27001: { compliant: boolean; lastAssessment: Date };
}

interface ReportSummary {
  id: string;
  type: ComplianceType;
  status: string;
  generatedAt: Date;
}

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export const securityMonitoringService = new SecurityMonitoringService();