import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  UserBehaviorProfile,
  BehaviorPattern,
  BehaviorType,
  ThreatDetectionRule,
  SecurityAction,
  SecurityActionType,
  ThreatIntelligence,
  ThreatIndicator,
  IndicatorType
} from '@/types/security';

export class ThreatDetectionService {
  private behaviorProfiles: Map<string, UserBehaviorProfile> = new Map();
  private detectionRules: ThreatDetectionRule[] = [];
  private threatIntelligence: ThreatIntelligence[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.loadThreatIntelligence();
  }

  /**
   * Analyze user behavior for anomalies
   */
  async analyzeUserBehavior(
    userId: string,
    currentActivity: any
  ): Promise<SecurityEvent[]> {
    try {
      const profile = await this.getUserBehaviorProfile(userId);
      const anomalies: SecurityEvent[] = [];

      // Check for login time anomalies
      const loginTimeAnomaly = this.detectLoginTimeAnomaly(profile, currentActivity);
      if (loginTimeAnomaly) {
        anomalies.push(loginTimeAnomaly);
      }

      // Check for location anomalies
      const locationAnomaly = this.detectLocationAnomaly(profile, currentActivity);
      if (locationAnomaly) {
        anomalies.push(locationAnomaly);
      }

      // Check for access pattern anomalies
      const accessAnomaly = this.detectAccessPatternAnomaly(profile, currentActivity);
      if (accessAnomaly) {
        anomalies.push(accessAnomaly);
      }

      // Check for data usage anomalies
      const dataUsageAnomaly = this.detectDataUsageAnomaly(profile, currentActivity);
      if (dataUsageAnomaly) {
        anomalies.push(dataUsageAnomaly);
      }

      return anomalies;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return [];
    }
  }

  /**
   * Detect suspicious login patterns
   */
  async detectSuspiciousLogin(
    userId: string,
    loginAttempt: any
  ): Promise<SecurityEvent | null> {
    const recentFailedAttempts = await this.getRecentFailedLogins(userId, 15); // 15 minutes
    
    if (recentFailedAttempts.length >= 5) {
      return this.createSecurityEvent({
        userId,
        type: SecurityEventType.MULTIPLE_FAILED_LOGINS,
        severity: SecuritySeverity.HIGH,
        details: {
          description: `Multiple failed login attempts detected: ${recentFailedAttempts.length} attempts in 15 minutes`,
          riskScore: 0.8,
          confidence: 0.9,
          affectedResources: ['user_account'],
          potentialImpact: 'Account compromise attempt',
          recommendedActions: ['Block IP address', 'Require MFA', 'Notify user'],
          metadata: {
            failedAttempts: recentFailedAttempts.length,
            timeWindow: 15,
            ipAddress: loginAttempt.ipAddress
          }
        },
        ipAddress: loginAttempt.ipAddress,
        userAgent: loginAttempt.userAgent,
        location: loginAttempt.location
      });
    }

    // Check against threat intelligence
    const threatMatch = this.checkThreatIntelligence(loginAttempt.ipAddress);
    if (threatMatch) {
      return this.createSecurityEvent({
        userId,
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.CRITICAL,
        details: {
          description: `Login attempt from known malicious IP address`,
          riskScore: 0.95,
          confidence: threatMatch.confidence,
          affectedResources: ['user_account'],
          potentialImpact: 'Account compromise',
          recommendedActions: ['Block IP immediately', 'Force password reset', 'Notify security team'],
          metadata: {
            threatSource: threatMatch.source,
            ipAddress: loginAttempt.ipAddress
          }
        },
        ipAddress: loginAttempt.ipAddress,
        userAgent: loginAttempt.userAgent,
        location: loginAttempt.location
      });
    }

    return null;
  }

  /**
   * Detect data exfiltration attempts
   */
  async detectDataExfiltration(
    userId: string,
    dataAccess: any
  ): Promise<SecurityEvent | null> {
    const recentAccess = await this.getRecentDataAccess(userId, 60); // 1 hour
    const totalDataSize = recentAccess.reduce((sum, access) => sum + access.dataSize, 0);
    const accessCount = recentAccess.length;

    // Check for unusual data volume
    if (totalDataSize > 100 * 1024 * 1024) { // 100MB threshold
      return this.createSecurityEvent({
        userId,
        type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        details: {
          description: `Unusual data access volume detected: ${(totalDataSize / 1024 / 1024).toFixed(2)}MB in 1 hour`,
          riskScore: 0.85,
          confidence: 0.8,
          affectedResources: recentAccess.map(a => a.resourceId),
          potentialImpact: 'Data breach',
          recommendedActions: ['Limit data access', 'Review user permissions', 'Monitor closely'],
          metadata: {
            dataSize: totalDataSize,
            accessCount,
            timeWindow: 60
          }
        },
        ipAddress: dataAccess.ipAddress,
        userAgent: dataAccess.userAgent
      });
    }

    // Check for rapid sequential access
    if (accessCount > 50) { // 50 accesses in 1 hour
      return this.createSecurityEvent({
        userId,
        type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        severity: SecuritySeverity.MEDIUM,
        details: {
          description: `Rapid data access pattern detected: ${accessCount} accesses in 1 hour`,
          riskScore: 0.7,
          confidence: 0.75,
          affectedResources: recentAccess.map(a => a.resourceId),
          potentialImpact: 'Automated data scraping',
          recommendedActions: ['Rate limit user', 'Require additional authentication'],
          metadata: {
            accessCount,
            timeWindow: 60
          }
        },
        ipAddress: dataAccess.ipAddress,
        userAgent: dataAccess.userAgent
      });
    }

    return null;
  }

  /**
   * Execute automated security response
   */
  async executeSecurityResponse(event: SecurityEvent): Promise<void> {
    const applicableRules = this.detectionRules.filter(rule => 
      rule.type === event.type && rule.enabled
    );

    for (const rule of applicableRules) {
      if (event.details.riskScore >= rule.threshold / 100) {
        for (const action of rule.actions) {
          await this.executeSecurityAction(event, action);
        }
      }
    }
  }

  /**
   * Execute individual security action
   */
  private async executeSecurityAction(
    event: SecurityEvent,
    action: SecurityAction
  ): Promise<void> {
    if (action.delay) {
      await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
    }

    switch (action.type) {
      case SecurityActionType.BLOCK_USER:
        await this.blockUser(event.userId, action.parameters);
        break;
      case SecurityActionType.REQUIRE_MFA:
        await this.requireMFA(event.userId);
        break;
      case SecurityActionType.FORCE_PASSWORD_RESET:
        await this.forcePasswordReset(event.userId);
        break;
      case SecurityActionType.LIMIT_ACCESS:
        await this.limitAccess(event.userId, action.parameters);
        break;
      case SecurityActionType.SEND_ALERT:
        await this.sendSecurityAlert(event, action.parameters);
        break;
      case SecurityActionType.QUARANTINE_SESSION:
        await this.quarantineSession(event.userId);
        break;
      case SecurityActionType.NOTIFY_ADMIN:
        await this.notifyAdmin(event);
        break;
      case SecurityActionType.INCREASE_MONITORING:
        await this.increaseMonitoring(event.userId, action.parameters);
        break;
    }
  }

  /**
   * Get or create user behavior profile
   */
  private async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    if (this.behaviorProfiles.has(userId)) {
      return this.behaviorProfiles.get(userId)!;
    }

    // Load from database or create new profile
    const profile: UserBehaviorProfile = {
      userId,
      normalPatterns: await this.buildBehaviorPatterns(userId),
      lastUpdated: new Date(),
      riskScore: 0.1,
      anomalyThreshold: 0.7
    };

    this.behaviorProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Build behavior patterns from historical data
   */
  private async buildBehaviorPatterns(userId: string): Promise<BehaviorPattern[]> {
    // This would typically analyze historical data
    // For now, return default patterns
    return [
      {
        type: BehaviorType.LOGIN_TIMES,
        frequency: 0.8,
        timeWindows: [{ start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }],
        locations: ['office', 'home'],
        devices: ['desktop', 'mobile'],
        confidence: 0.8 // Higher than anomaly threshold to trigger detection
      }
    ];
  }

  /**
   * Detect login time anomalies
   */
  private detectLoginTimeAnomaly(
    profile: UserBehaviorProfile,
    activity: any
  ): SecurityEvent | null {
    const loginPattern = profile.normalPatterns.find(p => p.type === BehaviorType.LOGIN_TIMES);
    if (!loginPattern) return null;

    const currentTime = activity.timestamp || new Date();
    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay();

    const isNormalTime = loginPattern.timeWindows.some(window => {
      const startHour = parseInt(window.start.split(':')[0]);
      const endHour = parseInt(window.end.split(':')[0]);
      return window.days.includes(currentDay) && 
             currentHour >= startHour && 
             currentHour <= endHour;
    });

    if (!isNormalTime && loginPattern.confidence > profile.anomalyThreshold) {
      return this.createSecurityEvent({
        userId: profile.userId,
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.MEDIUM,
        details: {
          description: `Login at unusual time: ${currentTime.toISOString()}`,
          riskScore: 0.6,
          confidence: loginPattern.confidence,
          affectedResources: ['user_session'],
          potentialImpact: 'Unauthorized access',
          recommendedActions: ['Verify user identity', 'Monitor session'],
          metadata: {
            loginTime: currentTime.toISOString(),
            normalWindows: loginPattern.timeWindows
          }
        },
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        location: activity.location
      });
    }

    return null;
  }

  /**
   * Detect location anomalies
   */
  private detectLocationAnomaly(
    profile: UserBehaviorProfile,
    activity: any
  ): SecurityEvent | null {
    if (!activity.location) return null;

    const locationPattern = profile.normalPatterns.find(p => p.type === BehaviorType.LOCATION_PATTERNS);
    if (!locationPattern) return null;

    const currentLocation = `${activity.location.city}, ${activity.location.country}`;
    const isNormalLocation = locationPattern.locations.some(loc => 
      loc.toLowerCase().includes(activity.location.city.toLowerCase()) ||
      loc.toLowerCase().includes(activity.location.country.toLowerCase())
    );

    if (!isNormalLocation && locationPattern.confidence > profile.anomalyThreshold) {
      return this.createSecurityEvent({
        userId: profile.userId,
        type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
        severity: SecuritySeverity.HIGH,
        details: {
          description: `Login from unusual location: ${currentLocation}`,
          riskScore: 0.75,
          confidence: locationPattern.confidence,
          affectedResources: ['user_session'],
          potentialImpact: 'Account compromise',
          recommendedActions: ['Require MFA', 'Verify user identity'],
          metadata: {
            currentLocation,
            normalLocations: locationPattern.locations
          }
        },
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        location: activity.location
      });
    }

    return null;
  }

  /**
   * Detect access pattern anomalies
   */
  private detectAccessPatternAnomaly(
    profile: UserBehaviorProfile,
    activity: any
  ): SecurityEvent | null {
    // Implementation would analyze access patterns
    // This is a simplified version
    return null;
  }

  /**
   * Detect data usage anomalies
   */
  private detectDataUsageAnomaly(
    profile: UserBehaviorProfile,
    activity: any
  ): SecurityEvent | null {
    // Implementation would analyze data usage patterns
    // This is a simplified version
    return null;
  }

  /**
   * Check against threat intelligence
   */
  private checkThreatIntelligence(ipAddress: string): ThreatIntelligence | null {
    return this.threatIntelligence.find(threat => 
      threat.indicators.some(indicator => 
        indicator.type === IndicatorType.IP_ADDRESS && 
        indicator.value === ipAddress
      )
    ) || null;
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
   * Initialize default detection rules
   */
  private initializeDefaultRules(): void {
    this.detectionRules = [
      {
        id: 'rule-001',
        name: 'Multiple Failed Logins',
        description: 'Detect multiple failed login attempts',
        type: SecurityEventType.MULTIPLE_FAILED_LOGINS,
        severity: SecuritySeverity.HIGH,
        enabled: true,
        conditions: [],
        actions: [
          { type: SecurityActionType.BLOCK_USER, parameters: { duration: 3600 } },
          { type: SecurityActionType.SEND_ALERT, parameters: { type: 'email' } }
        ],
        threshold: 80,
        timeWindow: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule-002',
        name: 'Data Exfiltration Detection',
        description: 'Detect potential data exfiltration attempts',
        type: SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        enabled: true,
        conditions: [],
        actions: [
          { type: SecurityActionType.LIMIT_ACCESS, parameters: { restrictions: ['data_export'] } },
          { type: SecurityActionType.NOTIFY_ADMIN, parameters: {} },
          { type: SecurityActionType.INCREASE_MONITORING, parameters: { duration: 86400 } }
        ],
        threshold: 85,
        timeWindow: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Load threat intelligence data
   */
  private loadThreatIntelligence(): void {
    // This would typically load from external threat intelligence feeds
    this.threatIntelligence = [
      {
        id: 'threat-001',
        type: 'malicious_ip' as any,
        indicators: [
          { type: IndicatorType.IP_ADDRESS, value: '192.168.1.100', confidence: 0.9 }
        ],
        severity: SecuritySeverity.HIGH,
        confidence: 0.9,
        source: 'Internal Threat Intelligence',
        description: 'Known malicious IP address',
        mitigations: ['Block IP address', 'Monitor related traffic'],
        createdAt: new Date()
      }
    ];
  }

  // Mock implementations for security actions
  private async blockUser(userId: string, parameters: any): Promise<void> {
    console.log(`Blocking user ${userId} for ${parameters.duration} seconds`);
  }

  private async requireMFA(userId: string): Promise<void> {
    console.log(`Requiring MFA for user ${userId}`);
  }

  private async forcePasswordReset(userId: string): Promise<void> {
    console.log(`Forcing password reset for user ${userId}`);
  }

  private async limitAccess(userId: string, parameters: any): Promise<void> {
    console.log(`Limiting access for user ${userId}:`, parameters.restrictions);
  }

  private async sendSecurityAlert(event: SecurityEvent, parameters: any): Promise<void> {
    console.log(`Sending security alert for event ${event.id}:`, parameters);
  }

  private async quarantineSession(userId: string): Promise<void> {
    console.log(`Quarantining session for user ${userId}`);
  }

  private async notifyAdmin(event: SecurityEvent): Promise<void> {
    console.log(`Notifying admin about security event ${event.id}`);
  }

  private async increaseMonitoring(userId: string, parameters: any): Promise<void> {
    console.log(`Increasing monitoring for user ${userId} for ${parameters.duration} seconds`);
  }

  // Mock data access methods
  private async getRecentFailedLogins(userId: string, minutes: number): Promise<any[]> {
    // Mock implementation - would query database
    return [];
  }

  private async getRecentDataAccess(userId: string, minutes: number): Promise<any[]> {
    // Mock implementation - would query database
    return [];
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const threatDetectionService = new ThreatDetectionService();