import { CalendarService } from '../calendar-service';
import {
  EventType,
  EventPriority,
  EventStatus,
  AttendeeStatus,
  ConflictType,
  ConflictSeverity,
  CalendarViewType,
} from '@/types/calendar';
import { CreateEventInput, CalendarQueryInput } from '@/lib/validations/calendar';

describe('CalendarService', () => {
  let calendarService: CalendarService;

  beforeEach(() => {
    calendarService = new CalendarService();
  });

  describe('createEvent', () => {
    const mockEventInput: CreateEventInput = {
      title: 'Team Meeting',
      description: 'Weekly team sync',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      location: 'Conference Room A',
      isAllDay: false,
      type: EventType.MEETING,
      priority: EventPriority.HIGH,
      attendees: [
        {
          email: 'john@example.com',
          name: 'John Doe',
          isOptional: false,
        },
      ],
    };

    it('creates a new event with correct properties', async () => {
      const event = await calendarService.createEvent(mockEventInput, 'user-123');

      expect(event.id).toBeDefined();
      expect(event.title).toBe(mockEventInput.title);
      expect(event.description).toBe(mockEventInput.description);
      expect(event.startTime).toEqual(mockEventInput.startTime);
      expect(event.endTime).toEqual(mockEventInput.endTime);
      expect(event.location).toBe(mockEventInput.location);
      expect(event.isAllDay).toBe(mockEventInput.isAllDay);
      expect(event.type).toBe(mockEventInput.type);
      expect(event.priority).toBe(mockEventInput.priority);
      expect(event.status).toBe(EventStatus.CONFIRMED);
      expect(event.organizerId).toBe('user-123');
      expect(event.createdAt).toBeInstanceOf(Date);
      expect(event.updatedAt).toBeInstanceOf(Date);
    });

    it('creates attendees with correct properties', async () => {
      const event = await calendarService.createEvent(mockEventInput, 'user-123');

      expect(event.attendees).toHaveLength(1);
      expect(event.attendees[0].id).toBeDefined();
      expect(event.attendees[0].email).toBe('john@example.com');
      expect(event.attendees[0].name).toBe('John Doe');
      expect(event.attendees[0].status).toBe(AttendeeStatus.PENDING);
      expect(event.attendees[0].isOptional).toBe(false);
    });

    it('generates AI suggestions for new events', async () => {
      const event = await calendarService.createEvent(mockEventInput, 'user-123');

      expect(event.aiSuggestions).toBeDefined();
      expect(event.aiSuggestions?.preparationItems).toContain('Review agenda');
      expect(event.aiSuggestions?.preparationItems).toContain('Prepare presentation materials');
      expect(event.aiSuggestions?.travelTimeEstimate).toBe(15); // Because location is provided
    });

    it('detects conflicts with existing events', async () => {
      // Create first event
      await calendarService.createEvent(mockEventInput, 'user-123');

      // Create overlapping event
      const overlappingEvent: CreateEventInput = {
        ...mockEventInput,
        title: 'Conflicting Meeting',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
      };

      const event = await calendarService.createEvent(overlappingEvent, 'user-123');

      expect(event.conflictDetection).toBeDefined();
      expect(event.conflictDetection).toHaveLength(1);
      expect(event.conflictDetection![0].conflictType).toBe(ConflictType.OVERLAP);
    });
  });

  describe('updateEvent', () => {
    it('updates an existing event', async () => {
      const event = await calendarService.createEvent({
        title: 'Original Title',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      const updatedEvent = await calendarService.updateEvent({
        id: event.id,
        title: 'Updated Title',
        priority: EventPriority.HIGH,
      });

      expect(updatedEvent.title).toBe('Updated Title');
      expect(updatedEvent.priority).toBe(EventPriority.HIGH);
      expect(updatedEvent.updatedAt.getTime()).toBeGreaterThan(event.updatedAt.getTime());
    });

    it('throws error when updating non-existent event', async () => {
      await expect(
        calendarService.updateEvent({
          id: 'non-existent',
          title: 'Updated Title',
        })
      ).rejects.toThrow('Event not found');
    });

    it('re-detects conflicts when time is changed', async () => {
      const event1 = await calendarService.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      const event2 = await calendarService.createEvent({
        title: 'Event 2',
        startTime: new Date('2024-01-15T12:00:00Z'),
        endTime: new Date('2024-01-15T13:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      // Update event2 to overlap with event1
      const updatedEvent = await calendarService.updateEvent({
        id: event2.id,
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
      });

      expect(updatedEvent.conflictDetection).toBeDefined();
      expect(updatedEvent.conflictDetection).toHaveLength(1);
      expect(updatedEvent.conflictDetection![0].conflictType).toBe(ConflictType.OVERLAP);
    });
  });

  describe('deleteEvent', () => {
    it('deletes an existing event', async () => {
      const event = await calendarService.createEvent({
        title: 'Event to Delete',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      await calendarService.deleteEvent(event.id);

      const deletedEvent = await calendarService.getEvent(event.id);
      expect(deletedEvent).toBeNull();
    });

    it('throws error when deleting non-existent event', async () => {
      await expect(
        calendarService.deleteEvent('non-existent')
      ).rejects.toThrow('Event not found');
    });
  });

  describe('getEvent', () => {
    it('retrieves an existing event', async () => {
      const createdEvent = await calendarService.createEvent({
        title: 'Test Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      const retrievedEvent = await calendarService.getEvent(createdEvent.id);

      expect(retrievedEvent).not.toBeNull();
      expect(retrievedEvent!.id).toBe(createdEvent.id);
      expect(retrievedEvent!.title).toBe('Test Event');
    });

    it('returns null for non-existent event', async () => {
      const event = await calendarService.getEvent('non-existent');
      expect(event).toBeNull();
    });
  });

  describe('getEvents', () => {
    beforeEach(async () => {
      // Create test events
      await calendarService.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.HIGH,
        attendees: [],
      }, 'user-123');

      await calendarService.createEvent({
        title: 'Event 2',
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T15:00:00Z'),
        isAllDay: false,
        type: EventType.APPOINTMENT,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      await calendarService.createEvent({
        title: 'Event 3',
        startTime: new Date('2024-01-17T09:00:00Z'),
        endTime: new Date('2024-01-17T10:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.LOW,
        attendees: [],
      }, 'user-123');
    });

    it('returns all events when no filters applied', async () => {
      const result = await calendarService.getEvents({
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('filters events by date range', async () => {
      const result = await calendarService.getEvents({
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-01-15T23:59:59Z',
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('Event 1');
    });

    it('filters events by type', async () => {
      const result = await calendarService.getEvents({
        type: EventType.MEETING,
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(2);
      expect(result.events.every(e => e.type === EventType.MEETING)).toBe(true);
    });

    it('filters events by priority', async () => {
      const result = await calendarService.getEvents({
        priority: EventPriority.HIGH,
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].priority).toBe(EventPriority.HIGH);
    });

    it('searches events by text', async () => {
      const result = await calendarService.getEvents({
        search: 'Event 2',
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('Event 2');
    });

    it('paginates results correctly', async () => {
      const result = await calendarService.getEvents({
        page: 2,
        limit: 2,
      });

      expect(result.events).toHaveLength(1);
      expect(result.total).toBe(3);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('sorts events by start time', async () => {
      const result = await calendarService.getEvents({
        page: 1,
        limit: 10,
      });

      const startTimes = result.events.map(e => e.startTime.getTime());
      const sortedStartTimes = [...startTimes].sort((a, b) => a - b);
      expect(startTimes).toEqual(sortedStartTimes);
    });
  });

  describe('detectConflicts', () => {
    it('detects overlapping events', async () => {
      const event1 = await calendarService.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      const overlappingEvent = {
        ...event1,
        id: 'new-event',
        title: 'Overlapping Event',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
      };

      const conflicts = await calendarService.detectConflicts(overlappingEvent);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe(ConflictType.OVERLAP);
      expect(conflicts[0].conflictingEventId).toBe(event1.id);
    });

    it('detects back-to-back meetings', async () => {
      const event1 = await calendarService.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      const backToBackEvent = {
        ...event1,
        id: 'new-event',
        title: 'Back-to-Back Event',
        startTime: new Date('2024-01-15T11:00:00Z'),
        endTime: new Date('2024-01-15T12:00:00Z'),
      };

      const conflicts = await calendarService.detectConflicts(backToBackEvent);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe(ConflictType.BACK_TO_BACK);
    });

    it('calculates conflict severity based on priority', async () => {
      const highPriorityEvent = await calendarService.createEvent({
        title: 'High Priority Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.URGENT,
        attendees: [],
      }, 'user-123');

      const conflictingEvent = {
        ...highPriorityEvent,
        id: 'new-event',
        title: 'Conflicting Event',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
        priority: EventPriority.LOW,
      };

      const conflicts = await calendarService.detectConflicts(conflictingEvent);

      expect(conflicts[0].severity).toBe(ConflictSeverity.CRITICAL);
    });

    it('provides suggested resolutions for conflicts', async () => {
      const event1 = await calendarService.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        type: EventType.MEETING,
        priority: EventPriority.MEDIUM,
        attendees: [],
      }, 'user-123');

      const conflictingEvent = {
        ...event1,
        id: 'new-event',
        title: 'Conflicting Event',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
      };

      const conflicts = await calendarService.detectConflicts(conflictingEvent);

      expect(conflicts[0].suggestedResolution).toBeDefined();
      expect(conflicts[0].suggestedResolution?.description).toContain('Reschedule');
      expect(conflicts[0].suggestedResolution?.alternativeOptions).toBeDefined();
    });
  });

  describe('suggestOptimalTimes', () => {
    it('suggests available time slots', async () => {
      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
      };

      const result = await calendarService.suggestOptimalTimes(request);

      expect(result.suggestedTimes).toBeDefined();
      expect(result.suggestedTimes.length).toBeGreaterThan(0);
      expect(result.preparationSuggestions).toContain('Prepare meeting agenda');
    });

    it('scores time slots based on preferences', async () => {
      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
      };

      const result = await calendarService.suggestOptimalTimes(request);

      // Check that suggestions are sorted by confidence
      const confidences = result.suggestedTimes.map(slot => slot.confidence);
      const sortedConfidences = [...confidences].sort((a, b) => b - a);
      expect(confidences).toEqual(sortedConfidences);
    });
  });

  describe('calendar preferences', () => {
    it('returns default preferences when none set', async () => {
      const preferences = await calendarService.getCalendarPreferences();

      expect(preferences.defaultView).toBe(CalendarViewType.WEEK);
      expect(preferences.timeZone).toBe('UTC');
      expect(preferences.weekStartsOn).toBe(1); // Monday
      expect(preferences.showWeekends).toBe(true);
      expect(preferences.defaultEventDuration).toBe(60);
    });

    it('updates and retrieves preferences', async () => {
      const newPreferences = {
        defaultView: CalendarViewType.MONTH,
        workingHours: {
          monday: { isWorkingDay: true, startTime: '08:00', endTime: '18:00', breaks: [] },
          tuesday: { isWorkingDay: true, startTime: '08:00', endTime: '18:00', breaks: [] },
          wednesday: { isWorkingDay: true, startTime: '08:00', endTime: '18:00', breaks: [] },
          thursday: { isWorkingDay: true, startTime: '08:00', endTime: '18:00', breaks: [] },
          friday: { isWorkingDay: true, startTime: '08:00', endTime: '18:00', breaks: [] },
          saturday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
          sunday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
        },
        timeZone: 'America/New_York',
        weekStartsOn: 0, // Sunday
        showWeekends: false,
        defaultEventDuration: 30,
        reminderDefaults: [],
      };

      await calendarService.updateCalendarPreferences(newPreferences);
      const updatedPreferences = await calendarService.getCalendarPreferences();

      expect(updatedPreferences.defaultView).toBe(CalendarViewType.MONTH);
      expect(updatedPreferences.timeZone).toBe('America/New_York');
      expect(updatedPreferences.weekStartsOn).toBe(0);
      expect(updatedPreferences.showWeekends).toBe(false);
      expect(updatedPreferences.defaultEventDuration).toBe(30);
    });
  });
});