import {
  CalendarEvent,
  CalendarView,
  CalendarPreferences,
  SchedulingRequest,
  SchedulingResult,
  ConflictInfo,
  TimeSlot,
  EventType,
  EventPriority,
  EventStatus,
  AttendeeStatus,
  ConflictType,
  ConflictSeverity,
  ResolutionType,
  CalendarViewType
} from '@/types/calendar';
import {
  CreateEventInput,
  UpdateEventInput,
  CalendarQueryInput,
  SchedulingRequestInput
} from '@/lib/validations/calendar';
import { prisma } from '@/lib/database/connection';
import { CalendarEvent as PrismaCalendarEvent, EventAttendee as PrismaEventAttendee } from '../../generated/prisma';
// import { SupabaseCalendarService } from './supabase-calendar-service';

export class CalendarService {
  private events: CalendarEvent[] = [];
  private preferences: CalendarPreferences | null = null;

  /**
   * Transform Prisma CalendarEvent to our CalendarEvent type
   */
  private static transformPrismaEventToCalendarEvent(
    prismaEvent: PrismaCalendarEvent & { attendees: PrismaEventAttendee[] }
  ): CalendarEvent {
    return {
      id: prismaEvent.id,
      title: prismaEvent.title,
      description: prismaEvent.description || undefined,
      startTime: prismaEvent.startTime,
      endTime: prismaEvent.endTime,
      location: prismaEvent.location || undefined,
      isAllDay: prismaEvent.isAllDay,
      type: prismaEvent.type as EventType,
      priority: prismaEvent.priority as EventPriority,
      status: prismaEvent.status as EventStatus,
      organizerId: prismaEvent.organizerId,
      attendees: prismaEvent.attendees.map(attendee => ({
        id: attendee.id,
        userId: attendee.userId || undefined,
        email: attendee.email,
        name: attendee.name,
        status: attendee.status as AttendeeStatus,
        isOptional: attendee.isOptional
      })),
      aiSuggestions: prismaEvent.aiSuggestions ? JSON.parse(prismaEvent.aiSuggestions as string) : undefined,
      externalCalendarId: prismaEvent.externalCalendarId || undefined,
      externalEventId: prismaEvent.externalEventId || undefined,
      projectId: prismaEvent.projectId || undefined,
      clientId: prismaEvent.clientId || undefined,
      createdAt: prismaEvent.createdAt,
      updatedAt: prismaEvent.updatedAt
    };
  }

  // Event management
  async createEvent(input: CreateEventInput, userId: string): Promise<CalendarEvent> {
    try {
      // Generate AI suggestions first
      const tempEvent: CalendarEvent = {
        id: 'temp',
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        isAllDay: input.isAllDay,
        type: input.type,
        priority: input.priority,
        status: EventStatus.CONFIRMED,
        organizerId: userId,
        attendees: input.attendees.map(attendee => ({
          id: this.generateId(),
          userId: undefined,
          email: attendee.email,
          name: attendee.name,
          status: AttendeeStatus.PENDING,
          isOptional: attendee.isOptional
        })),
        projectId: input.projectId,
        clientId: input.clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const aiSuggestions = await this.generateAISuggestions(tempEvent);

      // Create event in database
      const prismaEvent = await prisma.calendarEvent.create({
        data: {
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          isAllDay: input.isAllDay,
          type: input.type,
          priority: input.priority,
          status: EventStatus.CONFIRMED,
          organizerId: userId,
          projectId: input.projectId,
          clientId: input.clientId,
          aiSuggestions: aiSuggestions ? JSON.stringify(aiSuggestions) : null,
          attendees: {
            create: input.attendees.map(attendee => ({
              email: attendee.email,
              name: attendee.name,
              status: AttendeeStatus.PENDING,
              isOptional: attendee.isOptional
            }))
          }
        },
        include: {
          attendees: true
        }
      });

      const event = CalendarService.transformPrismaEventToCalendarEvent(prismaEvent);

      // Detect conflicts after creation
      const conflicts = await this.detectConflicts(event);
      if (conflicts.length > 0) {
        event.conflictDetection = conflicts;
      }

      return event;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      // Fallback to in-memory storage
      return this.createEventInMemory(input, userId);
    }
  }

  // Fallback method for in-memory storage
  private async createEventInMemory(input: CreateEventInput, userId: string): Promise<CalendarEvent> {
    const eventId = this.generateId();
    const now = new Date();
    
    const event: CalendarEvent = {
      id: eventId,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      isAllDay: input.isAllDay,
      type: input.type,
      priority: input.priority,
      status: EventStatus.CONFIRMED,
      organizerId: userId,
      attendees: input.attendees.map(attendee => ({
        id: this.generateId(),
        userId: undefined,
        email: attendee.email,
        name: attendee.name,
        status: AttendeeStatus.PENDING,
        isOptional: attendee.isOptional
      })),
      projectId: input.projectId,
      clientId: input.clientId,
      createdAt: now,
      updatedAt: now
    };

    // Detect conflicts
    const conflicts = await this.detectConflicts(event);
    if (conflicts.length > 0) {
      event.conflictDetection = conflicts;
    }

    // Generate AI suggestions
    const aiSuggestions = await this.generateAISuggestions(event);
    event.aiSuggestions = aiSuggestions;

    this.events.push(event);
    return event;
  }

  async updateEvent(input: UpdateEventInput): Promise<CalendarEvent> {
    const eventIndex = this.events.findIndex(e => e.id === input.id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const existingEvent = this.events[eventIndex];
    const updatedEvent: CalendarEvent = {
      ...existingEvent,
      ...input,
      updatedAt: new Date()
    };

    // Re-detect conflicts if time or attendees changed
    if (input.startTime || input.endTime || input.attendees) {
      const conflicts = await this.detectConflicts(updatedEvent);
      updatedEvent.conflictDetection = conflicts;
    }

    this.events[eventIndex] = updatedEvent;
    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    this.events.splice(eventIndex, 1);
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return this.events.find(e => e.id === eventId) || null;
  }

  async getEvents(query: CalendarQueryInput): Promise<{
    events: CalendarEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Build where clause for database query
      const where: any = {};

      if (query.startDate) {
        where.startTime = { gte: new Date(query.startDate) };
      }

      if (query.endDate) {
        where.endTime = { lte: new Date(query.endDate) };
      }

      if (query.type) {
        where.type = query.type;
      }

      if (query.priority) {
        where.priority = query.priority;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.projectId) {
        where.projectId = query.projectId;
      }

      if (query.clientId) {
        where.clientId = query.clientId;
      }

      if (query.attendeeEmail) {
        where.attendees = {
          some: {
            email: query.attendeeEmail
          }
        };
      }

      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const total = await prisma.calendarEvent.count({ where });

      // Get paginated events
      const prismaEvents = await prisma.calendarEvent.findMany({
        where,
        include: {
          attendees: true
        },
        orderBy: { startTime: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      });

      const events = prismaEvents.map(CalendarService.transformPrismaEventToCalendarEvent);

      return {
        events,
        total,
        page: query.page,
        limit: query.limit
      };
    } catch (error) {
      console.error('Error fetching events from database:', error);
      // Fallback to in-memory events
      return this.getEventsInMemory(query);
    }
  }

  // Fallback method for in-memory events
  private async getEventsInMemory(query: CalendarQueryInput): Promise<{
    events: CalendarEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    let filteredEvents = [...this.events];

    // Apply filters (same logic as before)
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filteredEvents = filteredEvents.filter(e => e.startTime >= startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filteredEvents = filteredEvents.filter(e => e.endTime <= endDate);
    }

    if (query.type) {
      filteredEvents = filteredEvents.filter(e => e.type === query.type);
    }

    if (query.priority) {
      filteredEvents = filteredEvents.filter(e => e.priority === query.priority);
    }

    if (query.status) {
      filteredEvents = filteredEvents.filter(e => e.status === query.status);
    }

    if (query.projectId) {
      filteredEvents = filteredEvents.filter(e => e.projectId === query.projectId);
    }

    if (query.clientId) {
      filteredEvents = filteredEvents.filter(e => e.clientId === query.clientId);
    }

    if (query.attendeeEmail) {
      filteredEvents = filteredEvents.filter(e => 
        e.attendees.some(a => a.email === query.attendeeEmail)
      );
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredEvents = filteredEvents.filter(e => 
        e.title.toLowerCase().includes(searchTerm) ||
        e.description?.toLowerCase().includes(searchTerm) ||
        e.location?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by start time
    filteredEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Pagination
    const total = filteredEvents.length;
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    return {
      events: paginatedEvents,
      total,
      page: query.page,
      limit: query.limit
    };
  }

  // Conflict detection
  async detectConflicts(event: CalendarEvent): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    for (const existingEvent of this.events) {
      if (existingEvent.id === event.id) continue;

      // Check for time overlap
      if (this.eventsOverlap(event, existingEvent)) {
        conflicts.push({
          conflictingEventId: existingEvent.id,
          conflictType: ConflictType.OVERLAP,
          severity: this.calculateConflictSeverity(event, existingEvent),
          suggestedResolution: {
            type: ResolutionType.RESCHEDULE,
            description: `Reschedule to avoid conflict with "${existingEvent.title}"`,
            alternativeOptions: await this.findAlternativeTimeSlots(event)
          }
        });
      }

      // Check for back-to-back meetings without buffer
      if (this.eventsBackToBack(event, existingEvent)) {
        conflicts.push({
          conflictingEventId: existingEvent.id,
          conflictType: ConflictType.BACK_TO_BACK,
          severity: ConflictSeverity.LOW,
          suggestedResolution: {
            type: ResolutionType.RESCHEDULE,
            description: 'Add buffer time between meetings',
            alternativeOptions: await this.findAlternativeTimeSlots(event, 15) // 15 min buffer
          }
        });
      }
    }

    return conflicts;
  }

  // AI-powered scheduling
  async suggestOptimalTimes(request: SchedulingRequestInput): Promise<SchedulingResult> {
    const preferences = await this.getCalendarPreferences();
    const constraints = request.constraints || {};
    
    // Find available time slots
    const availableSlots = await this.findAvailableTimeSlots(
      request.duration,
      request.attendeeEmails,
      constraints
    );

    // Score and rank time slots
    const scoredSlots = availableSlots.map(slot => ({
      ...slot,
      confidence: this.calculateTimeSlotScore(slot, request, preferences)
    }));

    // Sort by confidence score
    scoredSlots.sort((a, b) => b.confidence - a.confidence);

    // Generate preparation suggestions
    const preparationSuggestions = await this.generatePreparationSuggestions(request);

    return {
      suggestedTimes: scoredSlots.slice(0, 5), // Top 5 suggestions
      conflicts: [],
      preparationSuggestions
    };
  }

  // Calendar preferences
  async getCalendarPreferences(): Promise<CalendarPreferences> {
    if (!this.preferences) {
      // Return default preferences
      this.preferences = {
        defaultView: CalendarViewType.WEEK,
        workingHours: {
          monday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          thursday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          friday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          saturday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
          sunday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] }
        },
        timeZone: 'UTC',
        weekStartsOn: 1, // Monday
        showWeekends: true,
        defaultEventDuration: 60,
        reminderDefaults: []
      };
    }
    return this.preferences;
  }

  async updateCalendarPreferences(preferences: CalendarPreferences): Promise<CalendarPreferences> {
    this.preferences = preferences;
    return preferences;
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    return event1.startTime < event2.endTime && event1.endTime > event2.startTime;
  }

  private eventsBackToBack(event1: CalendarEvent, event2: CalendarEvent): boolean {
    const timeDiff = Math.abs(event1.startTime.getTime() - event2.endTime.getTime());
    const reverseTimeDiff = Math.abs(event2.startTime.getTime() - event1.endTime.getTime());
    return timeDiff < 5 * 60 * 1000 || reverseTimeDiff < 5 * 60 * 1000; // 5 minutes
  }

  private calculateConflictSeverity(event1: CalendarEvent, event2: CalendarEvent): ConflictSeverity {
    // Higher priority events create more severe conflicts
    const priorityWeight = {
      [EventPriority.LOW]: 1,
      [EventPriority.MEDIUM]: 2,
      [EventPriority.HIGH]: 3,
      [EventPriority.URGENT]: 4
    };

    const maxPriority = Math.max(
      priorityWeight[event1.priority],
      priorityWeight[event2.priority]
    );

    if (maxPriority >= 4) return ConflictSeverity.CRITICAL;
    if (maxPriority >= 3) return ConflictSeverity.HIGH;
    if (maxPriority >= 2) return ConflictSeverity.MEDIUM;
    return ConflictSeverity.LOW;
  }

  private async findAlternativeTimeSlots(
    event: CalendarEvent,
    bufferMinutes: number = 0
  ): Promise<TimeSlot[]> {
    const alternatives: TimeSlot[] = [];
    const duration = event.endTime.getTime() - event.startTime.getTime();
    
    // Look for slots in the next 7 days
    const searchStart = new Date(event.startTime);
    const searchEnd = new Date(searchStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Simple algorithm: try every hour
    for (let time = searchStart.getTime(); time < searchEnd.getTime(); time += 60 * 60 * 1000) {
      const startTime = new Date(time);
      const endTime = new Date(time + duration + bufferMinutes * 60 * 1000);
      
      if (this.isTimeSlotAvailable(startTime, endTime, event.id)) {
        alternatives.push({
          startTime,
          endTime,
          confidence: 0.8,
          reason: 'Available time slot'
        });
        
        if (alternatives.length >= 3) break;
      }
    }
    
    return alternatives;
  }

  private async findAvailableTimeSlots(
    duration: number,
    attendeeEmails: string[],
    constraints: unknown
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const searchEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Simple implementation: find slots every hour during working hours
    for (let time = now.getTime(); time < searchEnd.getTime(); time += 60 * 60 * 1000) {
      const startTime = new Date(time);
      const endTime = new Date(time + duration * 60 * 1000);
      
      if (this.isTimeSlotAvailable(startTime, endTime)) {
        slots.push({
          startTime,
          endTime,
          confidence: 0.7,
          reason: 'Available during working hours'
        });
      }
    }
    
    return slots.slice(0, 10); // Return top 10 slots
  }

  private isTimeSlotAvailable(startTime: Date, endTime: Date, excludeEventId?: string): boolean {
    return !this.events.some(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      return startTime < event.endTime && endTime > event.startTime;
    });
  }

  private calculateTimeSlotScore(
    slot: TimeSlot,
    request: SchedulingRequestInput,
    preferences: CalendarPreferences
  ): number {
    let score = 0.5; // Base score
    
    // Prefer working hours
    const hour = slot.startTime.getHours();
    if (hour >= 9 && hour <= 17) {
      score += 0.3;
    }
    
    // Prefer weekdays
    const dayOfWeek = slot.startTime.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private async generateAISuggestions(event: CalendarEvent) {
    // Mock AI suggestions - in real implementation, this would call AI service
    return {
      optimalTimes: [],
      conflictResolutions: [],
      preparationItems: [
        'Review agenda',
        'Prepare presentation materials',
        'Check participant availability'
      ],
      relatedDocuments: [],
      travelTimeEstimate: event.location ? 15 : undefined
    };
  }

  private async generatePreparationSuggestions(request: SchedulingRequestInput): Promise<string[]> {
    const suggestions = [
      'Prepare meeting agenda',
      'Send calendar invites to attendees',
      'Book meeting room if needed'
    ];
    
    if (request.attendeeEmails.length > 5) {
      suggestions.push('Consider if all attendees are necessary');
    }
    
    return suggestions;
  }
}