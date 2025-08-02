export interface SecurityEvent {
  id: string;
  userId: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  details: SecurityEventDetails;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum SecurityEventType {
  SUSPICIOUS_LOGIN = 'suspicious_login',
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  DATA_EXFILTRATION_ATTEMPT = 'data_exfiltration_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SESSION_HIJACKING = 'session_hijacking',
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityEventDetails {
  description: string;
  riskScore: number;
  confidence: number;
  affectedResources: string[];
  potentialImpact: string;
  recommendedActions: string[];
  metadata: Record<string, any>;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface UserBehaviorProfile {
  userId: string;
  normalPatterns: BehaviorPattern[];
  lastUpdated: Date;
  riskScore: number;
  anomalyThreshold: number;
}

export interface BehaviorPattern {
  type: BehaviorType;
  frequency: number;
  timeWindows: TimeWindow[];
  locations: string[];
  devices: string[];
  confidence: number;
}

export enum BehaviorType {
  LOGIN_TIMES = 'login_times',
  ACCESS_PATTERNS = 'access_patterns',
  DATA_USAGE = 'data_usage',
  FEATURE_USAGE = 'feature_usage',
  LOCATION_PATTERNS = 'location_patterns',
  DEVICE_PATTERNS = 'device_patterns'
}

export interface TimeWindow {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  days: number[]; // 0-6, Sunday to Saturday
}

export interface ThreatDetectionRule {
  id: string;
  name: string;
  description: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: SecurityAction[];
  threshold: number;
  timeWindow: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  weight: number;
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  REGEX = 'regex',
  IN = 'in',
  NOT_IN = 'not_in'
}

export interface SecurityAction {
  type: SecurityActionType;
  parameters: Record<string, any>;
  delay?: number; // in seconds
}

export enum SecurityActionType {
  BLOCK_USER = 'block_user',
  REQUIRE_MFA = 'require_mfa',
  FORCE_PASSWORD_RESET = 'force_password_reset',
  LIMIT_ACCESS = 'limit_access',
  SEND_ALERT = 'send_alert',
  LOG_EVENT = 'log_event',
  QUARANTINE_SESSION = 'quarantine_session',
  NOTIFY_ADMIN = 'notify_admin',
  INCREASE_MONITORING = 'increase_monitoring'
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  recipientId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  sent: boolean;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

export enum AlertType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ComplianceReport {
  id: string;
  type: ComplianceType;
  period: ReportPeriod;
  generatedAt: Date;
  generatedBy: string;
  data: ComplianceData;
  status: ReportStatus;
  filePath?: string;
}

export enum ComplianceType {
  GDPR = 'gdpr',
  HIPAA = 'hipaa',
  SOX = 'sox',
  PCI_DSS = 'pci_dss',
  ISO_27001 = 'iso_27001',
  CUSTOM = 'custom'
}

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

export interface ComplianceData {
  securityEvents: SecurityEventSummary[];
  accessLogs: AccessLogSummary[];
  dataProcessingActivities: DataProcessingActivity[];
  breachIncidents: BreachIncident[];
  userConsents: ConsentRecord[];
  dataRetentionCompliance: RetentionCompliance[];
}

export interface SecurityEventSummary {
  type: SecurityEventType;
  count: number;
  severity: SecuritySeverity;
  resolved: number;
  unresolved: number;
}

export interface AccessLogSummary {
  userId: string;
  accessCount: number;
  dataAccessed: string[];
  purposes: string[];
  legalBasis: string[];
}

export interface DataProcessingActivity {
  id: string;
  purpose: string;
  dataTypes: string[];
  legalBasis: string;
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
}

export interface BreachIncident {
  id: string;
  type: string;
  severity: SecuritySeverity;
  affectedUsers: number;
  dataTypes: string[];
  reportedToAuthority: boolean;
  reportedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ConsentRecord {
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  withdrawn: boolean;
  withdrawnAt?: Date;
}

export interface RetentionCompliance {
  dataType: string;
  retentionPeriod: string;
  compliantRecords: number;
  expiredRecords: number;
  deletedRecords: number;
}

export enum ReportStatus {
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ThreatIntelligence {
  id: string;
  type: ThreatType;
  indicators: ThreatIndicator[];
  severity: SecuritySeverity;
  confidence: number;
  source: string;
  description: string;
  mitigations: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export enum ThreatType {
  MALICIOUS_IP = 'malicious_ip',
  SUSPICIOUS_DOMAIN = 'suspicious_domain',
  KNOWN_MALWARE = 'known_malware',
  ATTACK_PATTERN = 'attack_pattern',
  VULNERABILITY = 'vulnerability'
}

export interface ThreatIndicator {
  type: IndicatorType;
  value: string;
  confidence: number;
}

export enum IndicatorType {
  IP_ADDRESS = 'ip_address',
  DOMAIN = 'domain',
  URL = 'url',
  FILE_HASH = 'file_hash',
  EMAIL = 'email',
  USER_AGENT = 'user_agent'
}