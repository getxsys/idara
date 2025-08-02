export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  priority: NotificationPriority;
  category: NotificationCategory;
  relevanceScore: number;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
}

export interface NotificationData {
  entityId?: string;
  entityType?: string;
  url?: string;
  imageUrl?: string;
  additionalInfo?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: NotificationActionType;
  url?: string;
  handler?: string;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface NotificationMetadata {
  source: string;
  tags: string[];
  context?: Record<string, any>;
  aiGenerated?: boolean;
  confidence?: number;
}

export interface NotificationPreferences {
  userId: string;
  globalEnabled: boolean;
  categories: Record<NotificationCategory, CategoryPreference>;
  channels: Record<NotificationChannel, ChannelPreference>;
  quietHours: QuietHours;
  frequency: NotificationFrequency;
  relevanceThreshold: number;
  customFilters: NotificationFilter[];
  updatedAt: Date;
}

export interface CategoryPreference {
  enabled: boolean;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  customRules?: NotificationRule[];
}

export interface ChannelPreference {
  enabled: boolean;
  priority: NotificationPriority;
  deliveryDelay?: number; // in minutes
  batchingEnabled?: boolean;
  maxBatchSize?: number;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  daysOfWeek: number[]; // 0-6, Sunday = 0
  emergencyOverride: boolean;
}

export interface NotificationFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  action: FilterAction;
  enabled: boolean;
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface NotificationRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  priority: number;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'modify_priority' | 'change_channel' | 'add_tag' | 'suppress' | 'escalate';
  parameters: Record<string, any>;
}

export interface NotificationHistory {
  id: string;
  notificationId: string;
  userId: string;
  action: NotificationHistoryAction;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface NotificationBatch {
  id: string;
  userId: string;
  notifications: string[]; // notification IDs
  channel: NotificationChannel;
  scheduledFor: Date;
  status: BatchStatus;
  createdAt: Date;
  processedAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  variables: TemplateVariable[];
  actions?: NotificationAction[];
  priority: NotificationPriority;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface NotificationAnalytics {
  userId: string;
  period: AnalyticsPeriod;
  totalSent: number;
  totalRead: number;
  totalClicked: number;
  totalArchived: number;
  averageRelevanceScore: number;
  categoryBreakdown: Record<NotificationCategory, CategoryAnalytics>;
  channelBreakdown: Record<NotificationChannel, ChannelAnalytics>;
  engagementRate: number;
  optimalDeliveryTimes: TimeSlot[];
  generatedAt: Date;
}

export interface CategoryAnalytics {
  sent: number;
  read: number;
  clicked: number;
  averageRelevanceScore: number;
  engagementRate: number;
}

export interface ChannelAnalytics {
  sent: number;
  delivered: number;
  failed: number;
  averageDeliveryTime: number;
  engagementRate: number;
}

export interface TimeSlot {
  hour: number;
  engagementRate: number;
  volume: number;
}

// Enums
export enum NotificationType {
  SYSTEM = 'system',
  USER_ACTION = 'user_action',
  COLLABORATION = 'collaboration',
  PROJECT_UPDATE = 'project_update',
  CLIENT_UPDATE = 'client_update',
  CALENDAR_EVENT = 'calendar_event',
  AI_INSIGHT = 'ai_insight',
  SECURITY_ALERT = 'security_alert',
  PERFORMANCE_ALERT = 'performance_alert',
  REMINDER = 'reminder',
  ACHIEVEMENT = 'achievement',
  MARKETING = 'marketing',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum NotificationCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SYSTEM = 'system',
  SOCIAL = 'social',
  UPDATES = 'updates',
  ALERTS = 'alerts',
  REMINDERS = 'reminders',
  ACHIEVEMENTS = 'achievements',
  MARKETING = 'marketing',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook',
}

export enum NotificationActionType {
  NAVIGATE = 'navigate',
  API_CALL = 'api_call',
  DISMISS = 'dismiss',
  SNOOZE = 'snooze',
  ARCHIVE = 'archive',
  CUSTOM = 'custom',
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  BATCHED_HOURLY = 'batched_hourly',
  BATCHED_DAILY = 'batched_daily',
  BATCHED_WEEKLY = 'batched_weekly',
  DIGEST_DAILY = 'digest_daily',
  DIGEST_WEEKLY = 'digest_weekly',
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  REGEX = 'regex',
}

export enum FilterAction {
  ALLOW = 'allow',
  BLOCK = 'block',
  MODIFY_PRIORITY = 'modify_priority',
  CHANGE_CHANNEL = 'change_channel',
  ADD_TAG = 'add_tag',
}

export enum NotificationHistoryAction {
  CREATED = 'created',
  DELIVERED = 'delivered',
  READ = 'read',
  CLICKED = 'clicked',
  DISMISSED = 'dismissed',
  ARCHIVED = 'archived',
  SNOOZED = 'snoozed',
  FAILED = 'failed',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  CANCELLED = 'cancelled',
}

export enum BatchStatus {
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AnalyticsPeriod {
  LAST_24_HOURS = 'last_24_hours',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

// Event types for real-time notifications
export interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  notification?: Notification;
  data?: any;
  timestamp: Date;
}

export enum NotificationEventType {
  NOTIFICATION_CREATED = 'notification_created',
  NOTIFICATION_UPDATED = 'notification_updated',
  NOTIFICATION_READ = 'notification_read',
  NOTIFICATION_DISMISSED = 'notification_dismissed',
  NOTIFICATION_ARCHIVED = 'notification_archived',
  PREFERENCES_UPDATED = 'preferences_updated',
  BATCH_PROCESSED = 'batch_processed',
}