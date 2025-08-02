import { NotificationService } from '../notification-service';
import { io } from 'socket.io-client';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  FilterOperator,
  FilterAction,
} from '@/types/notification';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
    service = new NotificationService('ws://test-server');
    
    // Mock the private methods to avoid async issues in tests
    (service as any).setupSocketListeners = jest.fn().mockResolvedValue(undefined);
    (service as any).loadPreferences = jest.fn().mockResolvedValue(undefined);
    (service as any).loadNotifications = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('connects to notification service', async () => {
      // Mock successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(callback, 0);
        }
      });

      await service.connect('user-123');

      expect(io).toHaveBeenCalledWith('ws://test-server', {
        auth: { userId: 'user-123' },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    });

    it('sets up socket listeners on connection', async () => {
      await service.connect('user-123');

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('notification_received', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('notification_updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('notification_deleted', expect.any(Function));
    });

    it('disconnects from service', async () => {
      await service.connect('user-123');
      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isServiceConnected).toBe(false);
    });

    it('handles connection errors', async () => {
      (io as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(service.connect('user-123')).rejects.toThrow('Connection failed');
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      await service.connect('user-123');
      
      // Mock successful responses
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (callback) {
          if (event === 'get_preferences') {
            callback({
              success: true,
              preferences: {
                userId: 'user-123',
                globalEnabled: true,
                categories: {
                  [NotificationCategory.WORK]: { enabled: true },
                  [NotificationCategory.SYSTEM]: { enabled: true },
                },
                channels: {
                  [NotificationChannel.IN_APP]: { enabled: true },
                  [NotificationChannel.PUSH]: { enabled: true },
                },
                relevanceThreshold: 0.3,
                customFilters: [],
                quietHours: { enabled: false },
                frequency: NotificationFrequency.IMMEDIATE,
                updatedAt: new Date(),
              },
            });
          } else if (event === 'get_notifications') {
            callback({ success: true, notifications: [] });
          } else if (event === 'create_notification') {
            callback({
              success: true,
              notification: {
                id: 'notif-123',
                ...data,
                createdAt: new Date(),
              },
            });
          }
        }
      });
    });

    it('creates notifications', async () => {
      const notification = await service.createNotification(
        NotificationType.SYSTEM,
        'Test Notification',
        'This is a test message'
      );

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'create_notification',
        expect.objectContaining({
          userId: 'user-123',
          type: NotificationType.SYSTEM,
          title: 'Test Notification',
          message: 'This is a test message',
          priority: NotificationPriority.NORMAL,
          category: NotificationCategory.SYSTEM,
        }),
        expect.any(Function)
      );

      expect(notification.id).toBe('notif-123');
    });

    it('marks notifications as read', async () => {
      await service.markAsRead('notif-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('mark_as_read', {
        notificationId: 'notif-123',
      });
    });

    it('archives notifications', async () => {
      await service.markAsArchived('notif-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('mark_as_archived', {
        notificationId: 'notif-123',
      });
    });

    it('dismisses notifications', async () => {
      await service.dismissNotification('notif-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('dismiss_notification', {
        notificationId: 'notif-123',
      });
    });

    it('snoozes notifications', async () => {
      const snoozeUntil = new Date();
      await service.snoozeNotification('notif-123', snoozeUntil);

      expect(mockSocket.emit).toHaveBeenCalledWith('snooze_notification', {
        notificationId: 'notif-123',
        snoozeUntil,
      });
    });

    it('bulk marks notifications as read', async () => {
      const notificationIds = ['notif-1', 'notif-2', 'notif-3'];
      await service.bulkMarkAsRead(notificationIds);

      expect(mockSocket.emit).toHaveBeenCalledWith('bulk_mark_as_read', {
        notificationIds,
      });
    });

    it('throws error when not connected', async () => {
      service.disconnect();

      await expect(
        service.createNotification(NotificationType.SYSTEM, 'Test', 'Message')
      ).rejects.toThrow('Not connected to notification service');
    });
  });

  describe('Preferences Management', () => {
    beforeEach(async () => {
      await service.connect('user-123');
    });

    it('updates preferences', async () => {
      const preferences = {
        globalEnabled: false,
        relevanceThreshold: 0.7,
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'update_preferences') {
          callback({
            success: true,
            preferences: { ...preferences, userId: 'user-123' },
          });
        }
      });

      const result = await service.updatePreferences(preferences);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'update_preferences',
        preferences,
        expect.any(Function)
      );
      expect(result.globalEnabled).toBe(false);
      expect(result.relevanceThreshold).toBe(0.7);
    });

    it('handles preference update errors', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'update_preferences') {
          callback({ success: false, error: 'Update failed' });
        }
      });

      await expect(
        service.updatePreferences({ globalEnabled: false })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Query and Filtering', () => {
    beforeEach(async () => {
      await service.connect('user-123');
      
      // Add some mock notifications
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-123',
          type: NotificationType.SYSTEM,
          title: 'System Alert',
          message: 'System maintenance',
          priority: NotificationPriority.HIGH,
          category: NotificationCategory.SYSTEM,
          relevanceScore: 0.8,
          isRead: false,
          isArchived: false,
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'notif-2',
          userId: 'user-123',
          type: NotificationType.USER_ACTION,
          title: 'Task Completed',
          message: 'Your task was completed',
          priority: NotificationPriority.NORMAL,
          category: NotificationCategory.WORK,
          relevanceScore: 0.6,
          isRead: true,
          isArchived: false,
          createdAt: new Date('2023-01-02'),
        },
        {
          id: 'notif-3',
          userId: 'user-123',
          type: NotificationType.REMINDER,
          title: 'Meeting Reminder',
          message: 'Meeting in 15 minutes',
          priority: NotificationPriority.URGENT,
          category: NotificationCategory.REMINDERS,
          relevanceScore: 0.9,
          isRead: false,
          isArchived: true,
          createdAt: new Date('2023-01-03'),
        },
      ];

      // Simulate notifications being loaded
      mockNotifications.forEach(notification => {
        (service as any).notifications.set(notification.id, notification);
      });
    });

    it('gets all notifications', () => {
      const notifications = service.getNotifications();
      expect(notifications).toHaveLength(3);
    });

    it('filters notifications by read status', () => {
      const unreadNotifications = service.getNotifications({ isRead: false });
      expect(unreadNotifications).toHaveLength(2);
      expect(unreadNotifications.every(n => !n.isRead)).toBe(true);
    });

    it('filters notifications by category', () => {
      const systemNotifications = service.getNotifications({
        category: NotificationCategory.SYSTEM,
      });
      expect(systemNotifications).toHaveLength(1);
      expect(systemNotifications[0].category).toBe(NotificationCategory.SYSTEM);
    });

    it('filters notifications by priority', () => {
      const highPriorityNotifications = service.getNotifications({
        priority: NotificationPriority.HIGH,
      });
      expect(highPriorityNotifications).toHaveLength(1);
      expect(highPriorityNotifications[0].priority).toBe(NotificationPriority.HIGH);
    });

    it('limits and paginates results', () => {
      const limitedNotifications = service.getNotifications({ limit: 2 });
      expect(limitedNotifications).toHaveLength(2);

      const offsetNotifications = service.getNotifications({ limit: 2, offset: 1 });
      expect(offsetNotifications).toHaveLength(2);
      expect(offsetNotifications[0].id).not.toBe(limitedNotifications[0].id);
    });

    it('sorts notifications by relevance score', () => {
      const notifications = service.getNotifications();
      expect(notifications[0].relevanceScore).toBeGreaterThanOrEqual(notifications[1].relevanceScore);
    });

    it('gets unread count', () => {
      const unreadCount = service.getUnreadCount();
      expect(unreadCount).toBe(1); // Only non-archived unread notifications
    });

    it('gets high priority count', () => {
      const highPriorityCount = service.getHighPriorityCount();
      expect(highPriorityCount).toBe(1); // Only non-archived high priority notifications
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      await service.connect('user-123');
    });

    it('gets analytics', async () => {
      const mockAnalytics = {
        userId: 'user-123',
        period: 'last_7_days',
        totalSent: 100,
        totalRead: 80,
        totalClicked: 20,
        engagementRate: 0.8,
        generatedAt: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'get_analytics') {
          callback({ success: true, analytics: mockAnalytics });
        }
      });

      const analytics = await service.getAnalytics('last_7_days');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'get_analytics',
        { period: 'last_7_days' },
        expect.any(Function)
      );
      expect(analytics.totalSent).toBe(100);
      expect(analytics.engagementRate).toBe(0.8);
    });
  });

  describe('Push Notifications', () => {
    beforeEach(() => {
      // Mock Notification API
      global.Notification = {
        permission: 'default',
        requestPermission: jest.fn(),
      } as any;
    });

    it('requests push permission', async () => {
      (global.Notification.requestPermission as jest.Mock).mockResolvedValue('granted');

      const granted = await service.requestPushPermission();

      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(granted).toBe(true);
    });

    it('returns false when notifications not supported', async () => {
      delete (global as any).Notification;

      const granted = await service.requestPushPermission();

      expect(granted).toBe(false);
    });

    it('returns false when permission denied', async () => {
      global.Notification.permission = 'denied';

      const granted = await service.requestPushPermission();

      expect(granted).toBe(false);
    });
  });

  describe('Event Management', () => {
    it('registers event listeners', () => {
      const callback = jest.fn();
      service.on('test_event', callback);

      // Simulate event emission
      (service as any).emit('test_event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('removes event listeners', () => {
      const callback = jest.fn();
      service.on('test_event', callback);
      service.off('test_event', callback);

      // Simulate event emission
      (service as any).emit('test_event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Relevance Engine', () => {
    it('calculates relevance scores', async () => {
      await service.connect('user-123');

      // Mock preferences
      const preferences = {
        userId: 'user-123',
        globalEnabled: true,
        categories: {
          [NotificationCategory.SYSTEM]: { enabled: true },
        },
        relevanceThreshold: 0.3,
        customFilters: [],
      };

      const notification = {
        id: 'test',
        userId: 'user-123',
        type: NotificationType.SYSTEM,
        title: 'Test',
        message: 'Test message',
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.SYSTEM,
        relevanceScore: 0,
        isRead: false,
        isArchived: false,
        createdAt: new Date(),
      };

      const relevanceEngine = (service as any).relevanceEngine;
      const score = await relevanceEngine.calculateRelevance(notification, preferences);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Filter Evaluation', () => {
    beforeEach(async () => {
      await service.connect('user-123');
    });

    it('evaluates filter conditions', () => {
      const notification = {
        id: 'test',
        title: 'Test Notification',
        message: 'This is a test',
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.SYSTEM,
      };

      const conditions = [
        {
          field: 'priority',
          operator: FilterOperator.EQUALS,
          value: NotificationPriority.HIGH,
        },
        {
          field: 'title',
          operator: FilterOperator.CONTAINS,
          value: 'Test',
        },
      ];

      const result = (service as any).evaluateFilterConditions(notification, conditions);
      expect(result).toBe(true);
    });

    it('evaluates different operators', () => {
      const notification = {
        title: 'Test Notification',
        relevanceScore: 0.8,
        tags: ['important', 'urgent'],
      };

      const testCases = [
        {
          field: 'title',
          operator: FilterOperator.STARTS_WITH,
          value: 'Test',
          expected: true,
        },
        {
          field: 'title',
          operator: FilterOperator.ENDS_WITH,
          value: 'Notification',
          expected: true,
        },
        {
          field: 'relevanceScore',
          operator: FilterOperator.GREATER_THAN,
          value: 0.5,
          expected: true,
        },
        {
          field: 'relevanceScore',
          operator: FilterOperator.LESS_THAN,
          value: 0.5,
          expected: false,
        },
        {
          field: 'tags',
          operator: FilterOperator.IN,
          value: ['important', 'system'],
          expected: false, // notification.tags is not in the array
        },
      ];

      testCases.forEach(({ field, operator, value, expected }) => {
        const conditions = [{ field, operator, value }];
        const result = (service as any).evaluateFilterConditions(notification, conditions);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Quiet Hours', () => {
    beforeEach(async () => {
      await service.connect('user-123');
    });

    it('detects quiet hours correctly', () => {
      // Mock current time to be 2 AM
      const mockDate = new Date('2023-01-01T02:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const preferences = {
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '06:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
          emergencyOverride: true,
        },
      };

      (service as any).preferences = preferences;

      const isQuietTime = (service as any).isInQuietHours();
      expect(isQuietTime).toBe(true);

      jest.restoreAllMocks();
    });

    it('handles quiet hours spanning midnight', () => {
      // Mock current time to be 11 PM
      const mockDate = new Date('2023-01-01T23:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const preferences = {
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '06:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          emergencyOverride: true,
        },
      };

      (service as any).preferences = preferences;

      const isQuietTime = (service as any).isInQuietHours();
      expect(isQuietTime).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('Getters', () => {
    it('returns connection status', async () => {
      expect(service.isServiceConnected).toBe(false);

      await service.connect('user-123');
      expect(service.isServiceConnected).toBe(true);

      service.disconnect();
      expect(service.isServiceConnected).toBe(false);
    });

    it('returns current user ID', async () => {
      expect(service.currentUserId).toBe(null);

      await service.connect('user-123');
      expect(service.currentUserId).toBe('user-123');
    });
  });
});