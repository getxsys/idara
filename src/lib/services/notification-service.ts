import { io, Socket } from 'socket.io-client';
import {
  Notification,
  NotificationPreferences,
  NotificationHistory,
  NotificationAnalytics,
  NotificationTemplate,
  NotificationBatch,
  NotificationEvent,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationEventType,
  FilterCondition,
  FilterOperator,
  FilterAction,
} from '@/types/notification';

export class NotificationService {
  private socket: Socket | null = null;
  private notifications: Map<string, Notification> = new Map();
  private preferences: NotificationPreferences | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnected = false;
  private userId: string | null = null;
  private relevanceEngine: RelevanceEngine;

  constructor(private serverUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') {
    this.relevanceEngine = new RelevanceEngine();
    this.initializeEventListeners();
  }

  // Connection Management
  async connect(userId: string): Promise<void> {
    try {
      this.userId = userId;
      this.socket = io(this.serverUrl, {
        auth: { userId },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      await this.setupSocketListeners();
      this.isConnected = true;
      
      // Load user preferences and notifications
      await this.loadPreferences();
      await this.loadNotifications();
    } catch (error) {
      console.error('Failed to connect to notification service:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifications.clear();
    this.preferences = null;
  }

  // Notification Management
  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    options: Partial<Notification> = {}
  ): Promise<Notification> {
    if (!this.socket || !this.userId) {
      throw new Error('Not connected to notification service');
    }

    const notification: Partial<Notification> = {
      userId: this.userId,
      type,
      title,
      message,
      priority: NotificationPriority.NORMAL,
      category: this.getCategoryFromType(type),
      relevanceScore: 0.5,
      isRead: false,
      isArchived: false,
      createdAt: new Date(),
      ...options,
    };

    // Calculate relevance score
    notification.relevanceScore = await this.relevanceEngine.calculateRelevance(
      notification as Notification,
      this.preferences
    );

    // Apply filters and rules
    const processedNotification = await this.applyFiltersAndRules(notification as Notification);
    
    if (!processedNotification) {
      throw new Error('Notification was filtered out');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('create_notification', processedNotification, (response: any) => {
        if (response.success) {
          const createdNotification = response.notification;
          this.notifications.set(createdNotification.id, createdNotification);
          this.emit('notification_created', { notification: createdNotification });
          resolve(createdNotification);
        } else {
          reject(new Error(response.error || 'Failed to create notification'));
        }
      });
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to notification service');
    }

    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      this.notifications.set(notificationId, notification);
    }

    this.socket.emit('mark_as_read', { notificationId });
    this.emit('notification_read', { notificationId });
  }

  async markAsArchived(notificationId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to notification service');
    }

    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isArchived = true;
      this.notifications.set(notificationId, notification);
    }

    this.socket.emit('mark_as_archived', { notificationId });
    this.emit('notification_archived', { notificationId });
  }

  async dismissNotification(notificationId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to notification service');
    }

    this.notifications.delete(notificationId);
    this.socket.emit('dismiss_notification', { notificationId });
    this.emit('notification_dismissed', { notificationId });
  }

  async snoozeNotification(notificationId: string, snoozeUntil: Date): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to notification service');
    }

    this.socket.emit('snooze_notification', { notificationId, snoozeUntil });
    this.emit('notification_snoozed', { notificationId, snoozeUntil });
  }

  async bulkMarkAsRead(notificationIds: string[]): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to notification service');
    }

    notificationIds.forEach(id => {
      const notification = this.notifications.get(id);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date();
        this.notifications.set(id, notification);
      }
    });

    this.socket.emit('bulk_mark_as_read', { notificationIds });
    this.emit('notifications_bulk_read', { notificationIds });
  }

  // Preferences Management
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    if (!this.socket || !this.userId) {
      throw new Error('Not connected to notification service');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('update_preferences', preferences, (response: any) => {
        if (response.success) {
          this.preferences = response.preferences;
          this.emit('preferences_updated', { preferences: this.preferences });
          resolve(this.preferences);
        } else {
          reject(new Error(response.error || 'Failed to update preferences'));
        }
      });
    });
  }

  async getPreferences(): Promise<NotificationPreferences | null> {
    return this.preferences;
  }

  // Query and Filtering
  getNotifications(filters?: {
    isRead?: boolean;
    isArchived?: boolean;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    type?: NotificationType;
    limit?: number;
    offset?: number;
  }): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (filters) {
      if (filters.isRead !== undefined) {
        notifications = notifications.filter(n => n.isRead === filters.isRead);
      }
      if (filters.isArchived !== undefined) {
        notifications = notifications.filter(n => n.isArchived === filters.isArchived);
      }
      if (filters.category) {
        notifications = notifications.filter(n => n.category === filters.category);
      }
      if (filters.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }
      if (filters.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }
    }

    // Sort by relevance score and creation date
    notifications.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    if (filters?.limit) {
      const offset = filters.offset || 0;
      notifications = notifications.slice(offset, offset + filters.limit);
    }

    return notifications;
  }

  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.isRead && !n.isArchived).length;
  }

  getHighPriorityCount(): number {
    return Array.from(this.notifications.values()).filter(
      n => !n.isRead && !n.isArchived && 
      (n.priority === NotificationPriority.HIGH || 
       n.priority === NotificationPriority.URGENT || 
       n.priority === NotificationPriority.CRITICAL)
    ).length;
  }

  // Analytics
  async getAnalytics(period: string): Promise<NotificationAnalytics> {
    if (!this.socket) {
      throw new Error('Not connected to notification service');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('get_analytics', { period }, (response: any) => {
        if (response.success) {
          resolve(response.analytics);
        } else {
          reject(new Error(response.error || 'Failed to get analytics'));
        }
      });
    });
  }

  // Real-time Push Notifications
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendPushNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const pushNotification = new Notification(notification.title, {
      body: notification.message,
      icon: notification.data?.imageUrl || '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      tag: notification.id,
      requireInteraction: notification.priority === NotificationPriority.URGENT || 
                          notification.priority === NotificationPriority.CRITICAL,
      actions: notification.actions?.map(action => ({
        action: action.id,
        title: action.label,
      })) || [],
    });

    pushNotification.onclick = () => {
      if (notification.data?.url) {
        window.open(notification.data.url, '_blank');
      }
      this.markAsRead(notification.id);
      pushNotification.close();
    };

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== NotificationPriority.URGENT && 
        notification.priority !== NotificationPriority.CRITICAL) {
      setTimeout(() => {
        pushNotification.close();
      }, 5000);
    }
  }

  // Event Management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Private Methods
  private async setupSocketListeners(): Promise<void> {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('connected', {});
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.emit('disconnected', {});
    });

    this.socket.on('notification_received', (data: { notification: Notification }) => {
      this.notifications.set(data.notification.id, data.notification);
      this.emit('notification_received', data);
      
      // Send push notification if enabled
      if (this.shouldSendPushNotification(data.notification)) {
        this.sendPushNotification(data.notification);
      }
    });

    this.socket.on('notification_updated', (data: { notification: Notification }) => {
      this.notifications.set(data.notification.id, data.notification);
      this.emit('notification_updated', data);
    });

    this.socket.on('notification_deleted', (data: { notificationId: string }) => {
      this.notifications.delete(data.notificationId);
      this.emit('notification_deleted', data);
    });

    this.socket.on('preferences_updated', (data: { preferences: NotificationPreferences }) => {
      this.preferences = data.preferences;
      this.emit('preferences_updated', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Notification service error:', error);
      this.emit('error', error);
    });
  }

  private initializeEventListeners(): void {
    const events = [
      'connected',
      'disconnected',
      'notification_created',
      'notification_received',
      'notification_updated',
      'notification_deleted',
      'notification_read',
      'notification_archived',
      'notification_dismissed',
      'notification_snoozed',
      'notifications_bulk_read',
      'preferences_updated',
      'error',
    ];

    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  private async loadPreferences(): Promise<void> {
    if (!this.socket || !this.userId) return;

    return new Promise((resolve) => {
      this.socket!.emit('get_preferences', {}, (response: any) => {
        if (response.success) {
          this.preferences = response.preferences;
        }
        resolve();
      });
    });
  }

  private async loadNotifications(): Promise<void> {
    if (!this.socket || !this.userId) return;

    return new Promise((resolve) => {
      this.socket!.emit('get_notifications', { limit: 100 }, (response: any) => {
        if (response.success) {
          response.notifications.forEach((notification: Notification) => {
            this.notifications.set(notification.id, notification);
          });
        }
        resolve();
      });
    });
  }

  private getCategoryFromType(type: NotificationType): NotificationCategory {
    const typeToCategory: Record<NotificationType, NotificationCategory> = {
      [NotificationType.SYSTEM]: NotificationCategory.SYSTEM,
      [NotificationType.USER_ACTION]: NotificationCategory.WORK,
      [NotificationType.COLLABORATION]: NotificationCategory.SOCIAL,
      [NotificationType.PROJECT_UPDATE]: NotificationCategory.WORK,
      [NotificationType.CLIENT_UPDATE]: NotificationCategory.WORK,
      [NotificationType.CALENDAR_EVENT]: NotificationCategory.REMINDERS,
      [NotificationType.AI_INSIGHT]: NotificationCategory.UPDATES,
      [NotificationType.SECURITY_ALERT]: NotificationCategory.ALERTS,
      [NotificationType.PERFORMANCE_ALERT]: NotificationCategory.ALERTS,
      [NotificationType.REMINDER]: NotificationCategory.REMINDERS,
      [NotificationType.ACHIEVEMENT]: NotificationCategory.ACHIEVEMENTS,
      [NotificationType.MARKETING]: NotificationCategory.MARKETING,
    };

    return typeToCategory[type] || NotificationCategory.WORK;
  }

  private async applyFiltersAndRules(notification: Notification): Promise<Notification | null> {
    if (!this.preferences) return notification;

    // Apply custom filters
    for (const filter of this.preferences.customFilters) {
      if (!filter.enabled) continue;

      const matches = this.evaluateFilterConditions(notification, filter.conditions);
      if (matches) {
        switch (filter.action) {
          case FilterAction.BLOCK:
            return null;
          case FilterAction.MODIFY_PRIORITY:
            // Implementation would modify priority based on filter parameters
            break;
          case FilterAction.CHANGE_CHANNEL:
            // Implementation would change delivery channel
            break;
          case FilterAction.ADD_TAG:
            // Implementation would add tags to metadata
            break;
        }
      }
    }

    // Check relevance threshold
    if (notification.relevanceScore < this.preferences.relevanceThreshold) {
      return null;
    }

    // Check category preferences
    const categoryPref = this.preferences.categories[notification.category];
    if (!categoryPref?.enabled) {
      return null;
    }

    return notification;
  }

  private evaluateFilterConditions(notification: Notification, conditions: FilterCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(notification, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private getFieldValue(notification: Notification, field: string): any {
    const fields = field.split('.');
    let value: any = notification;
    
    for (const f of fields) {
      value = value?.[f];
    }
    
    return value;
  }

  private evaluateCondition(fieldValue: any, operator: FilterOperator, conditionValue: any): boolean {
    switch (operator) {
      case FilterOperator.EQUALS:
        return fieldValue === conditionValue;
      case FilterOperator.NOT_EQUALS:
        return fieldValue !== conditionValue;
      case FilterOperator.CONTAINS:
        return String(fieldValue).includes(String(conditionValue));
      case FilterOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(conditionValue));
      case FilterOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(conditionValue));
      case FilterOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(conditionValue));
      case FilterOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue);
      case FilterOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue);
      case FilterOperator.IN:
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case FilterOperator.NOT_IN:
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case FilterOperator.REGEX:
        return new RegExp(conditionValue).test(String(fieldValue));
      default:
        return false;
    }
  }

  private shouldSendPushNotification(notification: Notification): boolean {
    if (!this.preferences) return false;

    const categoryPref = this.preferences.categories[notification.category];
    if (!categoryPref?.enabled) return false;

    const pushChannelPref = this.preferences.channels[NotificationChannel.PUSH];
    if (!pushChannelPref?.enabled) return false;

    // Check quiet hours
    if (this.preferences.quietHours.enabled && this.isInQuietHours()) {
      return notification.priority === NotificationPriority.CRITICAL && 
             this.preferences.quietHours.emergencyOverride;
    }

    return true;
  }

  private isInQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    // Check if current day is in quiet hours days
    if (!this.preferences.quietHours.daysOfWeek.includes(currentDay)) {
      return false;
    }

    const [startHour, startMinute] = this.preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.preferences.quietHours.endTime.split(':').map(Number);

    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Getters
  get isServiceConnected(): boolean {
    return this.isConnected;
  }

  get currentUserId(): string | null {
    return this.userId;
  }
}

// Relevance Engine for calculating notification relevance scores
class RelevanceEngine {
  async calculateRelevance(
    notification: Notification,
    preferences: NotificationPreferences | null
  ): Promise<number> {
    let score = 0.5; // Base score

    // Priority weight
    const priorityWeights = {
      [NotificationPriority.LOW]: 0.2,
      [NotificationPriority.NORMAL]: 0.5,
      [NotificationPriority.HIGH]: 0.7,
      [NotificationPriority.URGENT]: 0.9,
      [NotificationPriority.CRITICAL]: 1.0,
    };
    score += priorityWeights[notification.priority] * 0.3;

    // Category preference weight
    if (preferences) {
      const categoryPref = preferences.categories[notification.category];
      if (categoryPref?.enabled) {
        score += 0.2;
      } else {
        score -= 0.3;
      }
    }

    // Time relevance (recent notifications are more relevant)
    const ageInHours = (Date.now() - notification.createdAt.getTime()) / (1000 * 60 * 60);
    const timeRelevance = Math.max(0, 1 - ageInHours / 24); // Decreases over 24 hours
    score += timeRelevance * 0.2;

    // AI-generated content bonus
    if (notification.metadata?.aiGenerated && notification.metadata.confidence) {
      score += notification.metadata.confidence * 0.1;
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
}

// Singleton instance
export const notificationService = new NotificationService();