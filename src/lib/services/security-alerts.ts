import {
  SecurityAlert,
  SecurityEvent,
  SecurityEventType,
  AlertType,
  AlertPriority,
  SecuritySeverity
} from '@/types/security';

export class SecurityAlertService {
  private alerts: Map<string, SecurityAlert> = new Map();
  private alertHandlers: Map<AlertType, (alert: SecurityAlert) => Promise<void>> = new Map();

  constructor() {
    this.initializeAlertHandlers();
  }

  /**
   * Create and send security alert
   */
  async createAlert(
    event: SecurityEvent,
    recipientId: string,
    type: AlertType = AlertType.IN_APP
  ): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      eventId: event.id,
      recipientId,
      type,
      priority: this.determinePriority(event.severity),
      title: this.generateAlertTitle(event),
      message: this.generateAlertMessage(event),
      sent: false,
      acknowledged: false,
      createdAt: new Date()
    };

    this.alerts.set(alert.id, alert);
    await this.sendAlert(alert);

    return alert;
  }

  /**
   * Send alert using appropriate handler
   */
  private async sendAlert(alert: SecurityAlert): Promise<void> {
    const handler = this.alertHandlers.get(alert.type);
    if (handler) {
      try {
        await handler(alert);
        alert.sent = true;
        alert.sentAt = new Date();
      } catch (error) {
        console.error(`Failed to send alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
    }
  }

  /**
   * Get alerts for recipient
   */
  getAlertsForRecipient(recipientId: string): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.recipientId === recipientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(recipientId?: string): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => 
        !alert.acknowledged && 
        (!recipientId || alert.recipientId === recipientId)
      )
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Initialize alert handlers
   */
  private initializeAlertHandlers(): void {
    this.alertHandlers.set(AlertType.EMAIL, this.sendEmailAlert.bind(this));
    this.alertHandlers.set(AlertType.SMS, this.sendSMSAlert.bind(this));
    this.alertHandlers.set(AlertType.PUSH, this.sendPushAlert.bind(this));
    this.alertHandlers.set(AlertType.IN_APP, this.sendInAppAlert.bind(this));
    this.alertHandlers.set(AlertType.WEBHOOK, this.sendWebhookAlert.bind(this));
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    // Mock implementation - would integrate with email service
    console.log(`Sending email alert ${alert.id} to ${alert.recipientId}`);
    console.log(`Subject: ${alert.title}`);
    console.log(`Message: ${alert.message}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(alert: SecurityAlert): Promise<void> {
    // Mock implementation - would integrate with SMS service
    console.log(`Sending SMS alert ${alert.id} to ${alert.recipientId}`);
    console.log(`Message: ${alert.title} - ${alert.message}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Send push notification alert
   */
  private async sendPushAlert(alert: SecurityAlert): Promise<void> {
    // Mock implementation - would integrate with push notification service
    console.log(`Sending push alert ${alert.id} to ${alert.recipientId}`);
    console.log(`Title: ${alert.title}`);
    console.log(`Body: ${alert.message}`);
    
    // Simulate push notification delay
    await new Promise(resolve => setTimeout(resolve, 25));
  }

  /**
   * Send in-app alert
   */
  private async sendInAppAlert(alert: SecurityAlert): Promise<void> {
    // Mock implementation - would store in database for UI to display
    console.log(`Creating in-app alert ${alert.id} for ${alert.recipientId}`);
    
    // In a real implementation, this would store the alert in a database
    // and potentially use WebSocket to notify the client immediately
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: SecurityAlert): Promise<void> {
    // Mock implementation - would send HTTP POST to webhook URL
    console.log(`Sending webhook alert ${alert.id}`);
    
    const webhookPayload = {
      alertId: alert.id,
      eventId: alert.eventId,
      priority: alert.priority,
      title: alert.title,
      message: alert.message,
      timestamp: alert.createdAt.toISOString()
    };
    
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
  }

  /**
   * Determine alert priority based on event severity
   */
  private determinePriority(severity: SecuritySeverity): AlertPriority {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return AlertPriority.URGENT;
      case SecuritySeverity.HIGH:
        return AlertPriority.HIGH;
      case SecuritySeverity.MEDIUM:
        return AlertPriority.MEDIUM;
      case SecuritySeverity.LOW:
        return AlertPriority.LOW;
      default:
        return AlertPriority.LOW;
    }
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(event: SecurityEvent): string {
    const titles: Record<string, string> = {
      [SecurityEventType.SUSPICIOUS_LOGIN]: 'Suspicious Login Detected',
      [SecurityEventType.MULTIPLE_FAILED_LOGINS]: 'Multiple Failed Login Attempts',
      [SecurityEventType.UNUSUAL_ACCESS_PATTERN]: 'Unusual Access Pattern Detected',
      [SecurityEventType.DATA_EXFILTRATION_ATTEMPT]: 'Potential Data Exfiltration',
      [SecurityEventType.PRIVILEGE_ESCALATION]: 'Privilege Escalation Attempt',
      [SecurityEventType.ANOMALOUS_BEHAVIOR]: 'Anomalous User Behavior',
      [SecurityEventType.BRUTE_FORCE_ATTACK]: 'Brute Force Attack Detected',
      [SecurityEventType.SESSION_HIJACKING]: 'Session Hijacking Attempt',
      [SecurityEventType.MALICIOUS_FILE_UPLOAD]: 'Malicious File Upload Detected',
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 'SQL Injection Attempt',
      [SecurityEventType.XSS_ATTEMPT]: 'Cross-Site Scripting Attempt',
      [SecurityEventType.CSRF_ATTEMPT]: 'Cross-Site Request Forgery Attempt'
    };

    return titles[event.type] || 'Security Event Detected';
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(event: SecurityEvent): string {
    const baseMessage = `Security event detected for user ${event.userId}`;
    const details = event.details.description;
    const riskScore = Math.round(event.details.riskScore * 100);
    const confidence = Math.round(event.details.confidence * 100);
    
    let message = `${baseMessage}\n\n`;
    message += `Details: ${details}\n`;
    message += `Risk Score: ${riskScore}%\n`;
    message += `Confidence: ${confidence}%\n`;
    message += `Time: ${event.timestamp.toISOString()}\n`;
    
    if (event.ipAddress) {
      message += `IP Address: ${event.ipAddress}\n`;
    }
    
    if (event.location) {
      message += `Location: ${event.location.city}, ${event.location.country}\n`;
    }
    
    if (event.details.recommendedActions.length > 0) {
      message += `\nRecommended Actions:\n`;
      event.details.recommendedActions.forEach((action, index) => {
        message += `${index + 1}. ${action}\n`;
      });
    }
    
    return message;
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: AlertPriority): number {
    const weights: Record<AlertPriority, number> = {
      [AlertPriority.URGENT]: 4,
      [AlertPriority.HIGH]: 3,
      [AlertPriority.MEDIUM]: 2,
      [AlertPriority.LOW]: 1
    };
    
    return weights[priority] || 0;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Bulk create alerts for multiple recipients
   */
  async createBulkAlerts(
    event: SecurityEvent,
    recipientIds: string[],
    type: AlertType = AlertType.IN_APP
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    for (const recipientId of recipientIds) {
      const alert = await this.createAlert(event, recipientId, type);
      alerts.push(alert);
    }
    
    return alerts;
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(recipientId?: string): {
    total: number;
    acknowledged: number;
    unacknowledged: number;
    byPriority: Record<AlertPriority, number>;
    byType: Record<AlertType, number>;
  } {
    const alerts = recipientId 
      ? this.getAlertsForRecipient(recipientId)
      : Array.from(this.alerts.values());

    const stats = {
      total: alerts.length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      unacknowledged: alerts.filter(a => !a.acknowledged).length,
      byPriority: {
        [AlertPriority.URGENT]: 0,
        [AlertPriority.HIGH]: 0,
        [AlertPriority.MEDIUM]: 0,
        [AlertPriority.LOW]: 0
      },
      byType: {
        [AlertType.EMAIL]: 0,
        [AlertType.SMS]: 0,
        [AlertType.PUSH]: 0,
        [AlertType.IN_APP]: 0,
        [AlertType.WEBHOOK]: 0
      }
    };

    alerts.forEach(alert => {
      stats.byPriority[alert.priority]++;
      stats.byType[alert.type]++;
    });

    return stats;
  }
}

export const securityAlertService = new SecurityAlertService();