import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarInterface } from '../CalendarInterface';
import { CalendarService } from '@/lib/services/calendar-service';
import { EventType, EventPriority, CalendarViewType } from '@/types/calendar';

// Mock the calendar service
jest.mock('@/lib/services/calendar-service');
const MockedCalendarService = CalendarService as jest.MockedClass<typeof CalendarService>;

// Mock UI components
jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected }: any) => (
    <div data-testid="calendar-component">
      <button onClick={() => onSelect(new Date('2024-01-15'))}>
        Select Date
      </button>
      <div>Selected: {selected?.toDateString()}</div>
    </div>
  ),
}));

const mockEvents = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    location: 'Conference Room A',
    isAllDay: false,
    type: EventType.MEETING,
    priority: EventPriority.HIGH,
    status: 'CONFIRMED' as any,
    organizerId: 'user-123',
    attendees: [
      {
        id: 'att-1',
        email: 'john@example.com',
        name: 'John Doe',
        status: 'ACCEPTED' as any,
        isOptional: false,
      },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '2',
    title: 'Client Call',
    description: 'Quarterly review',
    startTime: new Date('2024-01-15T14:00:00Z'),
    endTime: new Date('2024-01-15T15:00:00Z'),
    location: 'Virtual',
    isAllDay: false,
    type: EventType.MEETING,
    priority: EventPriority.MEDIUM,
    status: 'CONFIRMED' as any,
    organizerId: 'user-123',
    attendees: [],
    conflictDetection: [
      {
        conflictingEventId: '3',
        conflictType: 'OVERLAP' as any,
        severity: 'HIGH' as any,
        suggestedResolution: {
          type: 'RESCHEDULE' as any,
          description: 'Reschedule to avoid conflict',
        },
      },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

describe('CalendarInterface', () => {
  let mockCalendarService: jest.Mocked<CalendarService>;

  beforeEach(() => {
    mockCalendarService = {
      getEvents: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
    } as any;

    MockedCalendarService.mockImplementation(() => mockCalendarService);

    mockCalendarService.getEvents.mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
      page: 1,
      limit: 100,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar interface with header and controls', async () => {
    render(<CalendarInterface userId="user-123" />);

    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('New Event')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
  });

  it('loads and displays events', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Client Call')).toBeInTheDocument();
    });
  });

  it('switches between different calendar views', async () => {
    render(<CalendarInterface userId="user-123" />);

    // Default should be week view
    expect(screen.getByRole('tab', { name: /week/i })).toHaveAttribute('data-state', 'active');

    // Switch to day view
    fireEvent.click(screen.getByRole('tab', { name: /day/i }));
    expect(screen.getByRole('tab', { name: /day/i })).toHaveAttribute('data-state', 'active');

    // Switch to month view
    fireEvent.click(screen.getByRole('tab', { name: /month/i }));
    expect(screen.getByRole('tab', { name: /month/i })).toHaveAttribute('data-state', 'active');

    // Switch to agenda view
    fireEvent.click(screen.getByRole('tab', { name: /agenda/i }));
    expect(screen.getByRole('tab', { name: /agenda/i })).toHaveAttribute('data-state', 'active');
  });

  it('filters events by search query', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Client Call')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Team' } });

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.queryByText('Client Call')).not.toBeInTheDocument();
    });
  });

  it('filters events by type', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    // Open type filter dropdown
    const typeFilter = screen.getAllByRole('combobox')[0];
    fireEvent.click(typeFilter);

    // Select MEETING type (should show all events since they're all meetings)
    fireEvent.click(screen.getByText('MEETING'));

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Client Call')).toBeInTheDocument();
    });
  });

  it('filters events by priority', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    // Open priority filter dropdown
    const priorityFilter = screen.getAllByRole('combobox')[1];
    fireEvent.click(priorityFilter);

    // Select HIGH priority
    fireEvent.click(screen.getByText('HIGH'));

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.queryByText('Client Call')).not.toBeInTheDocument();
    });
  });

  it('navigates between dates', async () => {
    render(<CalendarInterface userId="user-123" />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    const todayButton = screen.getByText('Today');

    // Navigate to previous period
    fireEvent.click(prevButton);
    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalledTimes(2);
    });

    // Navigate to next period
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalledTimes(3);
    });

    // Go back to today
    fireEvent.click(todayButton);
    await waitFor(() => {
      expect(mockCalendarService.getEvents).toHaveBeenCalledTimes(4);
    });
  });

  it('opens create event dialog', () => {
    render(<CalendarInterface userId="user-123" />);

    const newEventButton = screen.getByText('New Event');
    fireEvent.click(newEventButton);

    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('creates a new event', async () => {
    const mockCreatedEvent = {
      ...mockEvents[0],
      id: '3',
      title: 'New Meeting',
    };

    mockCalendarService.createEvent.mockResolvedValue(mockCreatedEvent);

    const onEventCreate = jest.fn();
    render(<CalendarInterface userId="user-123" onEventCreate={onEventCreate} />);

    // Open create dialog
    fireEvent.click(screen.getByText('New Event'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New Meeting' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(mockCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Meeting',
        }),
        'user-123'
      );
      expect(onEventCreate).toHaveBeenCalledWith(mockCreatedEvent);
    });
  });

  it('selects an event and shows details', async () => {
    const onEventSelect = jest.fn();
    render(<CalendarInterface userId="user-123" onEventSelect={onEventSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    // Click on an event
    fireEvent.click(screen.getByText('Team Meeting'));

    expect(onEventSelect).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('displays conflict indicators for events with conflicts', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Client Call')).toBeInTheDocument();
    });

    // Should show conflict indicator
    expect(screen.getByText('1 conflict(s) detected')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockCalendarService.getEvents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<CalendarInterface userId="user-123" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    mockCalendarService.getEvents.mockResolvedValue({
      events: [],
      total: 0,
      page: 1,
      limit: 100,
    });

    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('No events scheduled')).toBeInTheDocument();
    });
  });

  it('displays event priority indicators', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    // Check for priority indicators (colored dots)
    const priorityIndicators = screen.getAllByRole('generic').filter(
      (el) => el.className.includes('rounded-full')
    );
    expect(priorityIndicators.length).toBeGreaterThan(0);
  });

  it('shows event attendee count', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    expect(screen.getByText('1 attendees')).toBeInTheDocument();
  });

  it('displays event location when available', async () => {
    render(<CalendarInterface userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Conference Room A')).toBeInTheDocument();
      expect(screen.getByText('Virtual')).toBeInTheDocument();
    });
  });
});