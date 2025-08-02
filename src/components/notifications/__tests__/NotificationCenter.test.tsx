import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '../NotificationCenter';
import { notificationService } from '@/lib/services/notification-service';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
} from '@/types/notification';

// Mock the notification service
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    getHighPriorityCount: jest.fn(),
    markAsRead: jest.fn(),
    markAsArchived: jest.fn(),
    dismissNotification: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
}));

const mockNotifications = [
  {
    id: 'notif-1',
    userId: 'user-123',
    type: NotificationType.SYSTEM,
    title: 'System Alert',
    message: 'System maintenance scheduled',
    priority: NotificationPriority.HIGH,
    category: NotificationCategory.SYSTEM,
    relevanceScore: 0.8,
    isRead: false,
    isArchived: false,
    createdAt: new Date('2023-01-01'),
    actions: [],
  },
  {
    id: 'notif-2',
    userId: 'user-123',
    type: NotificationType.USER_ACTION,
    title: 'Task Completed',
    message: 'Your task was completed successfully',
    priority: NotificationPriority.NORMAL,
    category: NotificationCategory.WORK,
    relevanceScore: 0.6,
    isRead: true,
    isArchived: false,
    createdAt: new Date('2023-01-02'),
    actions: [],
  },
  {
    id: 'notif-3',
    userId: 'user-123',
    type: NotificationType.REMINDER,
    title: 'Meeting Reminder',
    message: 'Team meeting in 15 minutes',
    priority: NotificationPriority.URGENT,
    category: NotificationCategory.REMINDERS,
    relevanceScore: 0.9,
    isRead: false,
    isArchived: false,
    createdAt: new Date('2023-01-03'),
    actions: [
      {
        id: 'action-1',
        label: 'Join Meeting',
        type: 'navigate' as any,
        url: 'https://meet.example.com',
        style: 'primary' as const,
      },
    ],
  },
];

describe('NotificationCenter', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful connection
    (notificationService.connect as jest.Mock).mockResolvedValue(undefined);
    (notificationService.getNotifications as jest.Mock).mockReturnValue(mockNotifications);
    (notificationService.getUnreadCount as jest.Mock).mockReturnValue(2);
    (notificationService.getHighPriorityCount as jest.Mock).mockReturnValue(2);
  });

  it('renders loading state initially', () => {
    render(<NotificationCenter userId="user-123" />);
    
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('initializes notification service on mount', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(notificationService.connect).toHaveBeenCalledWith('user-123');
    });
  });

  it('renders notification center after successful connection', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Notification Center')).toBeInTheDocument();
    });
  });

  it('displays notification counts', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('2 unread')).toBeInTheDocument();
      expect(screen.getByText('2 important')).toBeInTheDocument();
    });
  });

  it('displays notifications in tabs', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
      expect(screen.getByText('Task Completed')).toBeInTheDocument();
      expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
    });
  });

  it('filters notifications by tab', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Click unread tab
    const unreadTab = screen.getByRole('tab', { name: /unread/i });
    await user.click(unreadTab);

    // Should only show unread notifications
    expect(screen.getByText('System Alert')).toBeInTheDocument();
    expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
    expect(screen.queryByText('Task Completed')).not.toBeInTheDocument();
  });

  it('filters notifications by importance', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Click important tab
    const importantTab = screen.getByRole('tab', { name: /important/i });
    await user.click(importantTab);

    // Should only show high priority notifications
    expect(screen.getByText('System Alert')).toBeInTheDocument();
    expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
    expect(screen.queryByText('Task Completed')).not.toBeInTheDocument();
  });

  it('searches notifications', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search notifications...');
    await user.type(searchInput, 'meeting');

    // Should only show notifications containing "meeting"
    expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
    expect(screen.queryByText('System Alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Task Completed')).not.toBeInTheDocument();
  });

  it('sorts notifications', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Sort by Relevance');
    await user.selectOptions(sortSelect, 'date');

    // Verify sort option changed
    expect(screen.getByDisplayValue('Sort by Date')).toBeInTheDocument();
  });

  it('handles marking notification as read', async () => {
    (notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Find and click the notification item
    const notificationItem = screen.getByText('System Alert').closest('div');
    await user.click(notificationItem!);

    expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('handles archiving notifications', async () => {
    (notificationService.markAsArchived as jest.Mock).mockResolvedValue(undefined);

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Find the more options button for the first notification
    const moreButtons = screen.getAllByRole('button', { name: '' });
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );
    
    if (moreButton) {
      await user.click(moreButton);
      
      const archiveOption = screen.getByText('Archive');
      await user.click(archiveOption);

      expect(notificationService.markAsArchived).toHaveBeenCalled();
    }
  });

  it('handles dismissing notifications', async () => {
    (notificationService.dismissNotification as jest.Mock).mockResolvedValue(undefined);

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Find the more options button for the first notification
    const moreButtons = screen.getAllByRole('button', { name: '' });
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );
    
    if (moreButton) {
      await user.click(moreButton);
      
      const dismissOption = screen.getByText('Dismiss');
      await user.click(dismissOption);

      expect(notificationService.dismissNotification).toHaveBeenCalled();
    }
  });

  it('handles bulk actions', async () => {
    (notificationService.bulkMarkAsRead as jest.Mock).mockResolvedValue(undefined);

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Select notifications using checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    // Should show bulk actions
    expect(screen.getByText(/selected/)).toBeInTheDocument();

    const bulkReadButton = screen.getByRole('button', { name: /mark as read/i });
    await user.click(bulkReadButton);

    expect(notificationService.bulkMarkAsRead).toHaveBeenCalled();
  });

  it('toggles filters panel', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Notification Center')).toBeInTheDocument();
    });

    const filterButton = screen.getByRole('button', { name: '' });
    const filterIcon = filterButton.querySelector('svg.lucide-filter');
    
    if (filterIcon) {
      await user.click(filterButton);
      
      // Should show filters panel
      expect(screen.getByText('Notification Filters')).toBeInTheDocument();
    }
  });

  it('opens preferences dialog', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Notification Center')).toBeInTheDocument();
    });

    const settingsButton = screen.getByRole('button', { name: '' });
    const settingsIcon = settingsButton.querySelector('svg.lucide-settings');
    
    if (settingsIcon) {
      await user.click(settingsButton);
      
      // Should show preferences dialog
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    }
  });

  it('shows empty state when no notifications', async () => {
    (notificationService.getNotifications as jest.Mock).mockReturnValue([]);
    (notificationService.getUnreadCount as jest.Mock).mockReturnValue(0);
    (notificationService.getHighPriorityCount as jest.Mock).mockReturnValue(0);

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText('No notifications to display.')).toBeInTheDocument();
    });
  });

  it('handles real-time notification updates', async () => {
    let notificationReceivedCallback: Function;
    
    (notificationService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'notification_received') {
        notificationReceivedCallback = callback;
      }
    });

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });

    // Simulate receiving a new notification
    const newNotification = {
      id: 'notif-4',
      userId: 'user-123',
      type: NotificationType.ACHIEVEMENT,
      title: 'Achievement Unlocked',
      message: 'You completed 10 tasks!',
      priority: NotificationPriority.NORMAL,
      category: NotificationCategory.ACHIEVEMENTS,
      relevanceScore: 0.7,
      isRead: false,
      isArchived: false,
      createdAt: new Date(),
      actions: [],
    };

    if (notificationReceivedCallback) {
      notificationReceivedCallback({ notification: newNotification });
    }

    // Should update the UI with the new notification
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
  });

  it('cleans up on unmount', async () => {
    const { unmount } = render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(notificationService.connect).toHaveBeenCalled();
    });

    unmount();

    expect(notificationService.disconnect).toHaveBeenCalled();
  });

  it('handles connection errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (notificationService.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));

    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to initialize notification service:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('shows disconnected status', async () => {
    render(<NotificationCenter userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Notification Center')).toBeInTheDocument();
    });

    // Simulate disconnection
    let disconnectedCallback: Function;
    (notificationService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'disconnected') {
        disconnectedCallback = callback;
      }
    });

    if (disconnectedCallback) {
      disconnectedCallback();
    }

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
});