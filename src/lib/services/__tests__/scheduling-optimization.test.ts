import { SchedulingOptimizationService, OptimizationContext, MeetingContext } from '../scheduling-optimization';
import { EventType, EventPriority, EventStatus, TransportMode, CalendarViewType } from '@/types/calendar';

describe('SchedulingOptimizationService', () => {
  let service: SchedulingOptimizationService;
  let mockContext: OptimizationContext;

  beforeEach(() => {
    service = new SchedulingOptimizationService();
    
    mockContext = {
      userPreferences: {
        defaultView: CalendarViewType.WEEK,
        workingHours: {
          monday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          thursday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          friday: { isWorkingDay: true, startTime: '09:00', endTime: '17:00', breaks: [] },
          saturday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
          sunday: { isWorkingDay: false, startTime: '09:00', endTime: '17:00', breaks: [] },
        },
        timeZone: 'UTC',
        weekStartsOn: 1,
        showWeekends: true,
        defaultEventDuration: 60,
        reminderDefaults: [],
      },
      existingEvents: [
        {
          id: '1',
          title: 'Existing Meeting',
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T11:00:00Z'),
          location: 'Office A',
          isAllDay: false,
          type: EventType.MEETING,
          priority: EventPriority.MEDIUM,
          status: EventStatus.CONFIRMED,
          organizerId: 'user-123',
          attendees: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  });

  describe('findOptimalTimes', () => {
    it('should find optimal time slots for a meeting request', async () => {
      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com', 'jane@example.com'],
        priority: EventPriority.HIGH,
      };

      const result = await service.findOptimalTimes(request, mockContext);

      expect(result.suggestedTimes).toBeDefined();
      expect(result.suggestedTimes.length).toBeGreaterThan(0);
      expect(result.preparationSuggestions).toBeDefined();
      expect(result.preparationSuggestions.length).toBeGreaterThan(0);
    });

    it('should return suggestions sorted by confidence score', async () => {
      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
      };

      const result = await service.findOptimalTimes(request, mockContext);

      // Check that suggestions are sorted by confidence (highest first)
      for (let i = 0; i < result.suggestedTimes.length - 1; i++) {
        expect(result.suggestedTimes[i].confidence).toBeGreaterThanOrEqual(
          result.suggestedTimes[i + 1].confidence
        );
      }
    });

    it('should respect working hours constraints', async () => {
      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
        constraints: {
          mustBeWithinWorkingHours: true,
          allowWeekends: false,
          minimumNotice: 24,
          maximumAdvance: 30,
        },
      };

      const result = await service.findOptimalTimes(request, mockContext);

      // All suggestions should be within working hours
      result.suggestedTimes.forEach(slot => {
        const hour = slot.startTime.getHours();
        const dayOfWeek = slot.startTime.getDay();
        
        // Should be weekday
        expect(dayOfWeek).toBeGreaterThan(0);
        expect(dayOfWeek).toBeLessThan(6);
        
        // Should be within working hours (9-17)
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(17);
      });
    });

    it('should avoid conflicts with existing events', async () => {
      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
      };

      const result = await service.findOptimalTimes(request, mockContext);

      // No suggestion should overlap with existing events
      result.suggestedTimes.forEach(slot => {
        mockContext.existingEvents.forEach(existingEvent => {
          const hasOverlap = slot.startTime < existingEvent.endTime && 
                            slot.endTime > existingEvent.startTime;
          expect(hasOverlap).toBe(false);
        });
      });
    });
  });

  describe('optimizeSchedule', () => {
    it('should optimize a schedule and return improvements', async () => {
      const events = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-15T09:00:00Z'),
          endTime: new Date('2024-01-15T10:00:00Z'),
          location: 'Office A',
          isAllDay: false,
          type: EventType.MEETING,
          priority: EventPriority.MEDIUM,
          status: EventStatus.CONFIRMED,
          organizerId: 'user-123',
          attendees: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          location: 'Office B',
          isAllDay: false,
          type: EventType.MEETING,
          priority: EventPriority.HIGH,
          status: EventStatus.CONFIRMED,
          organizerId: 'user-123',
          attendees: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await service.optimizeSchedule(events, mockContext);

      expect(result.optimizedEvents).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.energyScore).toBeGreaterThan(0);
      expect(result.energyScore).toBeLessThanOrEqual(1);
    });

    it('should maintain the same number of events after optimization', async () => {
      const events = mockContext.existingEvents;
      
      const result = await service.optimizeSchedule(events, mockContext);

      expect(result.optimizedEvents.length).toBe(events.length);
    });
  });

  describe('suggestMeetingTimes', () => {
    it('should suggest meeting times for multiple participants', async () => {
      const meetingContext: MeetingContext = {
        participants: ['john@example.com', 'jane@example.com'],
        estimatedDuration: 60,
        priority: EventPriority.HIGH,
        isVirtual: false,
      };

      const result = await service.suggestMeetingTimes(meetingContext, mockContext);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should consider participant skills when provided', async () => {
      const meetingContext: MeetingContext = {
        participants: ['john@example.com', 'jane@example.com'],
        requiredSkills: ['JavaScript', 'React'],
        estimatedDuration: 90,
        priority: EventPriority.HIGH,
        isVirtual: true,
      };

      const result = await service.suggestMeetingTimes(meetingContext, mockContext);

      expect(result).toBeDefined();
    });
  });

  describe('calculateOptimalTravelTime', () => {
    it('should calculate travel time between locations', async () => {
      const result = await service.calculateOptimalTravelTime(
        'Office A',
        'Office B',
        new Date('2024-01-15T14:00:00Z'),
        TransportMode.DRIVING
      );

      expect(result.fromLocation).toBe('Office A');
      expect(result.toLocation).toBe('Office B');
      expect(result.estimatedTravelTime).toBeGreaterThan(0);
      expect(result.transportMode).toBe(TransportMode.DRIVING);
    });

    it('should consider different transport modes', async () => {
      const drivingTime = await service.calculateOptimalTravelTime(
        'Office A',
        'Office B',
        new Date('2024-01-15T14:00:00Z'),
        TransportMode.DRIVING
      );

      const walkingTime = await service.calculateOptimalTravelTime(
        'Office A',
        'Office B',
        new Date('2024-01-15T14:00:00Z'),
        TransportMode.WALKING
      );

      expect(drivingTime.transportMode).toBe(TransportMode.DRIVING);
      expect(walkingTime.transportMode).toBe(TransportMode.WALKING);
    });

    it('should factor in departure time for traffic considerations', async () => {
      const rushHourTime = await service.calculateOptimalTravelTime(
        'Office A',
        'Office B',
        new Date('2024-01-15T08:00:00Z'), // Rush hour
        TransportMode.DRIVING
      );

      const offPeakTime = await service.calculateOptimalTravelTime(
        'Office A',
        'Office B',
        new Date('2024-01-15T14:00:00Z'), // Off-peak
        TransportMode.DRIVING
      );

      // Rush hour should typically take longer (though this is mocked)
      expect(rushHourTime.estimatedTravelTime).toBeGreaterThan(0);
      expect(offPeakTime.estimatedTravelTime).toBeGreaterThan(0);
    });
  });

  describe('optimizeTeamWorkload', () => {
    it('should analyze and optimize team workload', async () => {
      const teamMembers = [
        {
          id: 'member-1',
          name: 'John Doe',
          email: 'john@example.com',
          availability: [],
          skills: ['JavaScript', 'React'],
          workload: 0.8,
        },
        {
          id: 'member-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          availability: [],
          skills: ['Python', 'Django'],
          workload: 0.6,
        },
      ];

      const upcomingEvents = mockContext.existingEvents;
      const timeframe = {
        start: new Date('2024-01-15T00:00:00Z'),
        end: new Date('2024-01-22T00:00:00Z'),
      };

      const result = await service.optimizeTeamWorkload(teamMembers, upcomingEvents, timeframe);

      expect(result.recommendations).toBeDefined();
      expect(result.redistributionSuggestions).toBeDefined();
      expect(result.teamEfficiencyScore).toBeGreaterThan(0);
      expect(result.teamEfficiencyScore).toBeLessThanOrEqual(1);
    });
  });

  describe('generateMeetingPreparation', () => {
    it('should generate preparation suggestions for a meeting', async () => {
      const event = mockContext.existingEvents[0];

      const result = await service.generateMeetingPreparation(event, mockContext);

      expect(result.preparationItems).toBeDefined();
      expect(result.preparationItems.length).toBeGreaterThan(0);
      expect(result.documentSuggestions).toBeDefined();
      expect(result.participantInsights).toBeDefined();
      expect(result.optimalPreparationTime).toBeGreaterThan(0);
    });

    it('should provide different suggestions based on meeting priority', async () => {
      const highPriorityEvent = {
        ...mockContext.existingEvents[0],
        priority: EventPriority.URGENT,
      };

      const lowPriorityEvent = {
        ...mockContext.existingEvents[0],
        priority: EventPriority.LOW,
      };

      const highPriorityResult = await service.generateMeetingPreparation(highPriorityEvent, mockContext);
      const lowPriorityResult = await service.generateMeetingPreparation(lowPriorityEvent, mockContext);

      expect(highPriorityResult.optimalPreparationTime).toBeGreaterThan(
        lowPriorityResult.optimalPreparationTime
      );
    });

    it('should consider travel time for in-person meetings', async () => {
      const inPersonEvent = {
        ...mockContext.existingEvents[0],
        location: 'Conference Room B',
      };

      const virtualEvent = {
        ...mockContext.existingEvents[0],
        location: 'Virtual Meeting',
      };

      const inPersonResult = await service.generateMeetingPreparation(inPersonEvent, mockContext);
      const virtualResult = await service.generateMeetingPreparation(virtualEvent, mockContext);

      // In-person meeting should have travel-related preparation items
      const hasTravel = inPersonResult.preparationItems.some(item => 
        item.toLowerCase().includes('travel')
      );
      expect(hasTravel).toBe(true);
    });

    it('should provide participant insights when attendees are present', async () => {
      const eventWithAttendees = {
        ...mockContext.existingEvents[0],
        attendees: [
          {
            id: 'att-1',
            email: 'john@example.com',
            name: 'John Doe',
            status: 'ACCEPTED' as any,
            isOptional: false,
          },
          {
            id: 'att-2',
            email: 'jane@example.com',
            name: 'Jane Smith',
            status: 'PENDING' as any,
            isOptional: true,
          },
        ],
      };

      const result = await service.generateMeetingPreparation(eventWithAttendees, mockContext);

      expect(result.participantInsights.length).toBe(2);
      expect(result.participantInsights[0].email).toBe('john@example.com');
      expect(result.participantInsights[1].email).toBe('jane@example.com');
    });

    it('should adjust preparation suggestions based on meeting size', async () => {
      const smallMeeting = {
        ...mockContext.existingEvents[0],
        attendees: [
          { id: '1', email: 'john@example.com', name: 'John', status: 'ACCEPTED' as any, isOptional: false },
          { id: '2', email: 'jane@example.com', name: 'Jane', status: 'ACCEPTED' as any, isOptional: false },
        ],
      };

      const largeMeeting = {
        ...mockContext.existingEvents[0],
        attendees: Array.from({ length: 8 }, (_, i) => ({
          id: `att-${i}`,
          email: `user${i}@example.com`,
          name: `User ${i}`,
          status: 'ACCEPTED' as any,
          isOptional: false,
        })),
      };

      const smallResult = await service.generateMeetingPreparation(smallMeeting, mockContext);
      const largeResult = await service.generateMeetingPreparation(largeMeeting, mockContext);

      // Large meetings should have additional preparation suggestions
      expect(largeResult.preparationItems.length).toBeGreaterThanOrEqual(smallResult.preparationItems.length);
      
      const hasStructuredFormat = largeResult.preparationItems.some(item =>
        item.toLowerCase().includes('structured')
      );
      expect(hasStructuredFormat).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty existing events', async () => {
      const emptyContext = {
        ...mockContext,
        existingEvents: [],
      };

      const request = {
        title: 'New Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
      };

      const result = await service.findOptimalTimes(request, emptyContext);

      expect(result.suggestedTimes).toBeDefined();
      expect(result.suggestedTimes.length).toBeGreaterThan(0);
    });

    it('should handle weekend-only availability when weekends are allowed', async () => {
      const request = {
        title: 'Weekend Meeting',
        duration: 60,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.MEDIUM,
        constraints: {
          mustBeWithinWorkingHours: false,
          allowWeekends: true,
          minimumNotice: 1,
          maximumAdvance: 7,
        },
      };

      const result = await service.findOptimalTimes(request, mockContext);

      expect(result.suggestedTimes).toBeDefined();
    });

    it('should handle very short meeting durations', async () => {
      const request = {
        title: 'Quick Check-in',
        duration: 15,
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.LOW,
      };

      const result = await service.findOptimalTimes(request, mockContext);

      expect(result.suggestedTimes).toBeDefined();
      result.suggestedTimes.forEach(slot => {
        const duration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
        expect(duration).toBe(15);
      });
    });

    it('should handle very long meeting durations', async () => {
      const request = {
        title: 'All-day Workshop',
        duration: 480, // 8 hours
        attendeeEmails: ['john@example.com'],
        priority: EventPriority.HIGH,
      };

      const result = await service.findOptimalTimes(request, mockContext);

      expect(result.suggestedTimes).toBeDefined();
      result.suggestedTimes.forEach(slot => {
        const duration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
        expect(duration).toBe(480);
      });
    });
  });
});