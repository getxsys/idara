'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Settings,
  Filter,
  MarkAsRead,
  Archive,
  Trash2,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Search,
  SortDesc,
} from 'lucide-react';
import { notificationService } from '@/lib/services/notification-service';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from './NotificationFilters';
import { NotificationPreferencesDialog } from './NotificationPreferencesDialog';
import {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '@/types/notification';

interface NotificationCenterProps {
  userId: string;
  className?: string;
}

export function NotificationCenter({ userId, className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highPriorityCount, setHighPriorityCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'priority'>('relevance');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Initialize notification service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await notificationService.connect(userId);
        setIsConnected(true);
        loadNotifications();
      } catch (error) {
        console.error('Failed to initialize notification service:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    return () => {
      notificationService.disconnect();
    };
  }, [userId]);

  // Set up event listeners
  useEffect(() => {
    const handleNotificationReceived = (data: { notification: Notification }) => {
      setNotifications(prev => [data.notification, ...prev]);
      updateCounts();
    };

    const handleNotificationUpdated = (data: { notification: Notification }) => {
      setNotifications(prev => 
        prev.map(n => n.id === data.notification.id ? data.notification : n)
      );
      updateCounts();
    };

    const handleNotificationDeleted = (data: { notificationId: string }) => {
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
      updateCounts();
    };

    const handleConnected = () => {
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    notificationService.on('notification_received', handleNotificationReceived);
    notificationService.on('notification_updated', handleNotificationUpdated);
    notificationService.on('notification_deleted', handleNotificationDeleted);
    notificationService.on('connected', handleConnected);
    notificationService.on('disconnected', handleDisconnected);

    return () => {
      notificationService.off('notification_received', handleNotificationReceived);
      notificationService.off('notification_updated', handleNotificationUpdated);
      notificationService.off('notification_deleted', handleNotificationDeleted);
      notificationService.off('connected', handleConnected);
      notificationService.off('disconnected', handleDisconnected);
    };
  }, []);

  // Filter and sort notifications
  useEffect(() => {
    let filtered = [...notifications];

    // Apply tab filter
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead && !n.isArchived);
        break;
      case 'important':
        filtered = filtered.filter(n => 
          !n.isArchived && 
          (n.priority === NotificationPriority.HIGH || 
           n.priority === NotificationPriority.URGENT || 
           n.priority === NotificationPriority.CRITICAL)
        );
        break;
      case 'archived':
        filtered = filtered.filter(n => n.isArchived);
        break;
      default:
        filtered = filtered.filter(n => !n.isArchived);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    // Sort notifications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          if (a.relevanceScore !== b.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'priority':
          const priorityOrder = {
            [NotificationPriority.CRITICAL]: 5,
            [NotificationPriority.URGENT]: 4,
            [NotificationPriority.HIGH]: 3,
            [NotificationPriority.NORMAL]: 2,
            [NotificationPriority.LOW]: 1,
          };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    setFilteredNotifications(filtered);
  }, [notifications, activeTab, searchQuery, sortBy]);

  const loadNotifications = useCallback(() => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
    updateCounts();
  }, []);

  const updateCounts = useCallback(() => {
    setUnreadCount(notificationService.getUnreadCount());
    setHighPriorityCount(notificationService.getHighPriorityCount());
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAsArchived = async (notificationId: string) => {
    try {
      await notificationService.markAsArchived(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await notificationService.dismissNotification(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      await notificationService.bulkMarkAsRead(Array.from(selectedNotifications));
      setSelectedNotifications(new Set());
      loadNotifications();
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
    }
  };

  const handleSelectNotification = (notificationId: string, selected: boolean) => {
    const newSelection = new Set(selectedNotifications);
    if (selected) {
      newSelection.add(notificationId);
    } else {
      newSelection.delete(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = filteredNotifications.map(n => n.id);
    setSelectedNotifications(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedNotifications(new Set());
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'unread':
        return <Bell className="h-4 w-4" />;
      case 'important':
        return <AlertTriangle className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Center
              {!isConnected && (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Counts */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {unreadCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Bell className="h-4 w-4" />
                    <span>{unreadCount} unread</span>
                  </div>
                )}
                {highPriorityCount > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>{highPriorityCount} important</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="date">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
              <span className="text-sm">
                {selectedNotifications.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkMarkAsRead}
              >
                <MarkAsRead className="h-4 w-4 mr-1" />
                Mark as Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
              >
                <X className="h-4 w-4 mr-1" />
                Deselect All
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Filters */}
      {showFilters && (
        <NotificationFilters
          onFiltersChange={(filters) => {
            // Apply additional filters
            console.log('Filters changed:', filters);
          }}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                {getTabIcon('all')}
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-2">
                {getTabIcon('unread')}
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="important" className="flex items-center gap-2">
                {getTabIcon('important')}
                Important
                {highPriorityCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {highPriorityCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                {getTabIcon('archived')}
                Archived
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[600px]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'unread' && 'All caught up! No unread notifications.'}
                      {activeTab === 'important' && 'No important notifications at the moment.'}
                      {activeTab === 'archived' && 'No archived notifications.'}
                      {activeTab === 'all' && 'No notifications to display.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <NotificationItem
                          notification={notification}
                          isSelected={selectedNotifications.has(notification.id)}
                          onSelect={(selected) => handleSelectNotification(notification.id, selected)}
                          onMarkAsRead={() => handleMarkAsRead(notification.id)}
                          onArchive={() => handleMarkAsArchived(notification.id)}
                          onDismiss={() => handleDismiss(notification.id)}
                        />
                        {index < filteredNotifications.length - 1 && (
                          <Separator className="my-1" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preferences Dialog */}
      {showPreferences && (
        <NotificationPreferencesDialog
          userId={userId}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}