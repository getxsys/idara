import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConflictDetection } from '../ConflictDetection';
import {
  CalendarEvent,
  ConflictInfo,
  ConflictType,
  ConflictSeverity,
  ResolutionType,
  EventType,
  EventPriority,
  TimeSlot,
} from '@/types/calendar';

const mockEvent: CalendarEvent = {
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
  aiSuggestions: {
    optimalTimes: [],
    conflictResolutions: [
      {
        type: ResolutionType.RESCHEDULE,
        description: 'Reschedule to avoid overlap',
        alternativeOptions: [
          {
            startTime: new Date('2024-01-15T11:00:00Z'),
            endTime: new Date('2024-01-15T12:00:00Z'),
            confidence: 0.9,
            reason: 'No conflicts at this time',
          },
          {
            startTime: new Date('2024-01-15T14:00:00Z'),
            endTime: new Date('2024-01-15T15:00:00Z'),
            confidence: 0.8,
            reason: 'Good time slot',
          },
        ],
      },
    ],
    preparationItems: ['Review agenda', 'Prepare materials'],
    relatedDocuments: [],
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const mockConflicts: ConflictInfo[] = [
  {
    conflictingEventId: '2',
    conflictType: ConflictType.OVERLAP,
    severity: ConflictSeverity.HIGH,
    suggestedResolution: {
      type: ResolutionType.RESCHEDULE,
      description: 'Reschedule to avoid conflict with "Client Call"',
      alternativeOptions: [
        {
          startTime: new Date('2024-01-15T11:00:00Z'),
          endTime: new Date('2024-01-15T12:00:00Z'),
          confidence: 0.9,
          reason: 'Available time slot',
        },
      ],
    },
  },
  {
    conflictingEventId: '3',
    conflictType: ConflictType.BACK_TO_BACK,
    severity: ConflictSeverity.MEDIUM,
    suggestedResolution: {
      type: ResolutionType.RESCHEDULE,
      description: 'Add buffer time between meetings',
      newStartTime: new Date('2024-01-15T10:15:00Z'),
      newEndTime: new Date('2024-01-15T11:15:00Z'),
    },
  },
  {
    conflictingEventId: '4',
    conflictType: ConflictType.TRAVEL_TIME,
    severity: ConflictSeverity.CRITICAL,
    suggestedResolution: {
      type: ResolutionType.RESCHEDULE,
      description: 'Account for travel time between locations',
    },
  },
];

describe('ConflictDetection', () => {
  const mockOnResolveConflict = jest.fn();
  const mockOnAcceptSuggestion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows no conflicts message when there are no conflicts', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={[]}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    expect(screen.getByText('No conflicts detected')).toBeInTheDocument();
    expect(
      screen.getByText("This event doesn't conflict with any existing events.")
    ).toBeInTheDocument();
  });

  it('displays conflict summary with correct severity', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    expect(screen.getByText('3 conflicts detected')).toBeInTheDocument();
    expect(screen.getByText('(1 critical, requires immediate attention)')).toBeInTheDocument();
  });

  it('displays individual conflict cards with correct information', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    // Check for conflict types
    expect(screen.getByText('Time Overlap')).toBeInTheDocument();
    expect(screen.getByText('Back-to-Back Meetings')).toBeInTheDocument();
    expect(screen.getByText('Travel Time Conflict')).toBeInTheDocument();

    // Check for severity badges
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('shows suggested resolutions for conflicts', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    expect(screen.getByText('Reschedule to avoid conflict with "Client Call"')).toBeInTheDocument();
    expect(screen.getByText('Add buffer time between meetings')).toBeInTheDocument();
    expect(screen.getByText('Account for travel time between locations')).toBeInTheDocument();
  });

  it('displays AI suggestions when available', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Reschedule to avoid overlap')).toBeInTheDocument();
    expect(screen.getByText('Alternative time slots:')).toBeInTheDocument();
  });

  it('shows alternative time slots with confidence scores', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    expect(screen.getByText('90% confidence')).toBeInTheDocument();
    expect(screen.getByText('80% confidence')).toBeInTheDocument();
  });

  it('calls onAcceptSuggestion when accepting a time slot', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    expect(mockOnAcceptSuggestion).toHaveBeenCalledWith({
      startTime: new Date('2024-01-15T11:00:00Z'),
      endTime: new Date('2024-01-15T12:00:00Z'),
      confidence: 0.9,
      reason: 'No conflicts at this time',
    });
  });

  it('calls onResolveConflict when resolving a conflict', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const resolveButtons = screen.getAllByText('Resolve');
    fireEvent.click(resolveButtons[0]);

    expect(mockOnResolveConflict).toHaveBeenCalledWith('2', mockConflicts[0].suggestedResolution);
  });

  it('opens conflict details dialog when clicking Details', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    expect(screen.getByText('Conflict Details')).toBeInTheDocument();
    expect(screen.getByText('Current Event')).toBeInTheDocument();
    expect(screen.getByText('Conflicting Event')).toBeInTheDocument();
  });

  it('displays event summary in conflict details', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.getByText('1 attendees')).toBeInTheDocument();
  });

  it('applies resolution from conflict details dialog', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    const applyButton = screen.getByText('Apply Resolution');
    fireEvent.click(applyButton);

    expect(mockOnResolveConflict).toHaveBeenCalledWith('2', mockConflicts[0].suggestedResolution);
  });

  it('closes conflict details dialog when clicking Cancel', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    expect(screen.getByText('Conflict Details')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Conflict Details')).not.toBeInTheDocument();
  });

  it('displays correct conflict type icons', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    // Check that conflict type icons are rendered (we can't easily test the specific icons)
    const conflictCards = screen.getAllByRole('generic').filter(
      (el) => el.className.includes('rounded-full')
    );
    expect(conflictCards.length).toBeGreaterThan(0);
  });

  it('shows new time when resolution includes specific times', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[1]); // Back-to-back conflict with specific new times

    expect(screen.getByText(/New time:/)).toBeInTheDocument();
  });

  it('handles conflicts without suggested resolutions', () => {
    const conflictsWithoutResolution: ConflictInfo[] = [
      {
        conflictingEventId: '5',
        conflictType: ConflictType.WORKLOAD,
        severity: ConflictSeverity.LOW,
      },
    ];

    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={conflictsWithoutResolution}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    expect(screen.getByText('Workload Conflict')).toBeInTheDocument();
    expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
  });

  it('displays confidence scores as percentages', () => {
    render(
      <ConflictDetection
        event={mockEvent}
        conflicts={mockConflicts}
        onResolveConflict={mockOnResolveConflict}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    // Check for percentage display in alternative time slots
    expect(screen.getByText('90% confidence')).toBeInTheDocument();
    expect(screen.getByText('80% confidence')).toBeInTheDocument();
  });
});