import {
  CalendarEvent,
  TimeSlot,
  SchedulingRequest,
  SchedulingResult,
  CalendarPreferences,
  TravelTimeInfo,
  TransportMode,
  EventPriority,
  WorkingHours,
  DaySchedule,
} from '@/types/calendar';

export interface OptimizationContext {
  userPreferences: CalendarPreferences;
  existingEvents: CalendarEvent[];
  weatherData?: WeatherInfo;
  trafficData?: TrafficInfo;
  teamAvailability?: TeamMember[];
}

export interface WeatherInfo {
  date: Date;
  condition: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
  temperature: number;
  precipitation: number;
}

export interface TrafficInfo {
  route: string;
  estimatedTime: number;
  congestionLevel: 'low' | 'medium' | 'high';
  alternativeRoutes: AlternativeRoute[];
}

export interface AlternativeRoute {
  route: string;
  estimatedTime: number;
  distance: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  availability: TimeSlot[];
  skills: string[];
  workload: number; // 0-1 scale
}

export interface MeetingContext {
  participants: string[];
  requiredSkills?: string[];
  estimatedDuration: number;
  priority: EventPriority;
  location?: string;
  isVirtual: boolean;
}

export interface OptimizationScore {
  overall: number;
  timeScore: number;
  availabilityScore: number;
  travelScore: number;
  workloadScore: number;
  weatherScore: number;
  energyScore: number;
}

export class SchedulingOptimizationService {
  private readonly WORKING_HOURS_WEIGHT = 0.3;
  private readonly AVAILABILITY_WEIGHT = 0.25;
  private readonly TRAVEL_TIME_WEIGHT = 0.2;
  private readonly WORKLOAD_WEIGHT = 0.15;
  private readonly WEATHER_WEIGHT = 0.05;
  private readonly ENERGY_WEIGHT = 0.05;

  /**
   * Find optimal meeting times using AI-powered analysis
   */
  async findOptimalTimes(
    request: SchedulingRequest,
    context: OptimizationContext
  ): Promise<SchedulingResult> {
    const candidateSlots = await this.generateCandidateSlots(request, context);
    const scoredSlots = await this.scoreTimeSlots(candidateSlots, request, context);
    const optimizedSlots = this.rankAndFilterSlots(scoredSlots);
    
    const travelConsiderations = await this.analyzeTravelTime(request, optimizedSlots);
    const preparationSuggestions = await this.generatePreparationSuggestions(request, context);

    return {
      suggestedTimes: optimizedSlots,
      conflicts: [], // Conflicts would be detected separately
      travelTimeConsiderations: travelConsiderations,
      preparationSuggestions,
    };
  }

  /**
   * Optimize existing schedule by rearranging events
   */
  async optimizeSchedule(
    events: CalendarEvent[],
    context: OptimizationContext
  ): Promise<{
    optimizedEvents: CalendarEvent[];
    improvements: ScheduleImprovement[];
    energyScore: number;
  }> {
    const improvements: ScheduleImprovement[] = [];
    let optimizedEvents = [...events];

    // Analyze current schedule efficiency
    const currentScore = this.calculateScheduleScore(events, context);

    // Apply optimization strategies
    optimizedEvents = await this.applyTimeBlocking(optimizedEvents, context);
    optimizedEvents = await this.optimizeCommute(optimizedEvents, context);
    optimizedEvents = await this.balanceWorkload(optimizedEvents, context);
    optimizedEvents = await this.optimizeEnergyLevels(optimizedEvents, context);

    // Calculate improvements
    const newScore = this.calculateScheduleScore(optimizedEvents, context);
    
    if (newScore > currentScore) {
      improvements.push({
        type: 'overall_efficiency',
        description: `Schedule efficiency improved by ${Math.round((newScore - currentScore) * 100)}%`,
        impact: 'high',
        timesSaved: Math.round((newScore - currentScore) * 60), // minutes
      });
    }

    return {
      optimizedEvents,
      improvements,
      energyScore: newScore,
    };
  }

  /**
   * Suggest meeting times based on participant availability and preferences
   */
  async suggestMeetingTimes(
    meetingContext: MeetingContext,
    context: OptimizationContext
  ): Promise<TimeSlot[]> {
    const participantAvailability = await this.getParticipantAvailability(
      meetingContext.participants,
      context
    );

    const commonSlots = this.findCommonAvailability(
      participantAvailability,
      meetingContext.estimatedDuration
    );

    const scoredSlots = await this.scoreTimeSlots(commonSlots, {
      title: 'Meeting',
      duration: meetingContext.estimatedDuration,
      attendeeEmails: meetingContext.participants,
      priority: meetingContext.priority,
    }, context);

    return this.rankAndFilterSlots(scoredSlots);
  }

  /**
   * Calculate travel time between locations with optimization
   */
  async calculateOptimalTravelTime(
    fromLocation: string,
    toLocation: string,
    departureTime: Date,
    transportMode: TransportMode = TransportMode.DRIVING
  ): Promise<TravelTimeInfo> {
    // Mock implementation - in real app, this would use Google Maps API or similar
    const baseTime = this.getBaseTravelTime(fromLocation, toLocation, transportMode);
    const trafficMultiplier = this.getTrafficMultiplier(departureTime);
    const weatherMultiplier = await this.getWeatherMultiplier(departureTime);

    const estimatedTravelTime = Math.round(baseTime * trafficMultiplier * weatherMultiplier);

    return {
      fromLocation,
      toLocation,
      estimatedTravelTime,
      transportMode,
    };
  }

  /**
   * Analyze and optimize team workload distribution
   */
  async optimizeTeamWorkload(
    teamMembers: TeamMember[],
    upcomingEvents: CalendarEvent[],
    timeframe: { start: Date; end: Date }
  ): Promise<{
    recommendations: WorkloadRecommendation[];
    redistributionSuggestions: RedistributionSuggestion[];
    teamEfficiencyScore: number;
  }> {
    const workloadAnalysis = this.analyzeTeamWorkload(teamMembers, upcomingEvents);
    const recommendations = this.generateWorkloadRecommendations(workloadAnalysis);
    const redistributionSuggestions = this.suggestWorkloadRedistribution(workloadAnalysis);
    const efficiencyScore = this.calculateTeamEfficiencyScore(workloadAnalysis);

    return {
      recommendations,
      redistributionSuggestions,
      teamEfficiencyScore: efficiencyScore,
    };
  }

  /**
   * Generate context-aware meeting preparation suggestions
   */
  async generateMeetingPreparation(
    event: CalendarEvent,
    context: OptimizationContext
  ): Promise<{
    preparationItems: string[];
    documentSuggestions: string[];
    participantInsights: ParticipantInsight[];
    optimalPreparationTime: number; // minutes before meeting
  }> {
    const preparationItems: string[] = [];
    const documentSuggestions: string[] = [];
    const participantInsights: ParticipantInsight[] = [];

    // Analyze meeting type and generate suggestions
    if (event.type === 'MEETING') {
      preparationItems.push('Review meeting agenda');
      preparationItems.push('Prepare key discussion points');
      
      if (event.attendees.length > 5) {
        preparationItems.push('Consider if all attendees are necessary');
        preparationItems.push('Prepare structured discussion format');
      }
    }

    // Location-based suggestions
    if (event.location && !event.location.toLowerCase().includes('virtual')) {
      const travelTime = await this.calculateOptimalTravelTime(
        'current_location', // Would be user's current location
        event.location,
        new Date(event.startTime.getTime() - 30 * 60 * 1000) // 30 min before
      );
      preparationItems.push(`Allow ${travelTime.estimatedTravelTime} minutes for travel`);
    }

    // Priority-based suggestions
    if (event.priority === EventPriority.HIGH || event.priority === EventPriority.URGENT) {
      preparationItems.push('Prepare backup plans for key decisions');
      preparationItems.push('Review recent related communications');
    }

    // Generate participant insights
    for (const attendee of event.attendees) {
      participantInsights.push({
        email: attendee.email,
        name: attendee.name,
        recentInteractions: [], // Would be populated from actual data
        preferredCommunicationStyle: 'direct', // Would be learned from interactions
        expertise: [], // Would be populated from profile data
      });
    }

    const optimalPreparationTime = this.calculateOptimalPreparationTime(event);

    return {
      preparationItems,
      documentSuggestions,
      participantInsights,
      optimalPreparationTime,
    };
  }

  // Private helper methods

  private async generateCandidateSlots(
    request: SchedulingRequest,
    context: OptimizationContext
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const { userPreferences, existingEvents } = context;
    const constraints = request.constraints || {};

    // Generate slots for the next 30 days
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const daySchedule = this.getDaySchedule(dayOfWeek, userPreferences.workingHours);

      if (!daySchedule.isWorkingDay && constraints.mustBeWithinWorkingHours) {
        continue;
      }

      if (!constraints.allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      const daySlots = this.generateDaySlots(date, daySchedule, request.duration);
      const availableSlots = this.filterAvailableSlots(daySlots, existingEvents);
      
      slots.push(...availableSlots);
    }

    return slots;
  }

  private async scoreTimeSlots(
    slots: TimeSlot[],
    request: SchedulingRequest,
    context: OptimizationContext
  ): Promise<TimeSlot[]> {
    return slots.map(slot => ({
      ...slot,
      confidence: this.calculateSlotScore(slot, request, context),
    }));
  }

  private calculateSlotScore(
    slot: TimeSlot,
    request: SchedulingRequest,
    context: OptimizationContext
  ): number {
    const scores = {
      timeScore: this.calculateTimeScore(slot, context.userPreferences),
      availabilityScore: this.calculateAvailabilityScore(slot, context.existingEvents),
      travelScore: this.calculateTravelScore(slot, context.existingEvents),
      workloadScore: this.calculateWorkloadScore(slot, context.existingEvents),
      weatherScore: this.calculateWeatherScore(slot, context.weatherData),
      energyScore: this.calculateEnergyScore(slot, context.userPreferences),
    };

    return (
      scores.timeScore * this.WORKING_HOURS_WEIGHT +
      scores.availabilityScore * this.AVAILABILITY_WEIGHT +
      scores.travelScore * this.TRAVEL_TIME_WEIGHT +
      scores.workloadScore * this.WORKLOAD_WEIGHT +
      scores.weatherScore * this.WEATHER_WEIGHT +
      scores.energyScore * this.ENERGY_WEIGHT
    );
  }

  private calculateTimeScore(slot: TimeSlot, preferences: CalendarPreferences): number {
    const hour = slot.startTime.getHours();
    const dayOfWeek = slot.startTime.getDay();
    const daySchedule = this.getDaySchedule(dayOfWeek, preferences.workingHours);

    if (!daySchedule.isWorkingDay) return 0.3;

    const startHour = parseInt(daySchedule.startTime.split(':')[0]);
    const endHour = parseInt(daySchedule.endTime.split(':')[0]);

    if (hour < startHour || hour >= endHour) return 0.2;

    // Peak productivity hours (typically 9-11 AM and 2-4 PM)
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      return 1.0;
    }

    // Good hours
    if (hour >= 8 && hour <= 17) {
      return 0.8;
    }

    return 0.5;
  }

  private calculateAvailabilityScore(slot: TimeSlot, existingEvents: CalendarEvent[]): number {
    const conflicts = existingEvents.filter(event =>
      slot.startTime < event.endTime && slot.endTime > event.startTime
    );

    if (conflicts.length > 0) return 0;

    // Check for buffer time around existing events
    const bufferTime = 15 * 60 * 1000; // 15 minutes
    const nearbyEvents = existingEvents.filter(event => {
      const timeBefore = Math.abs(slot.startTime.getTime() - event.endTime.getTime());
      const timeAfter = Math.abs(event.startTime.getTime() - slot.endTime.getTime());
      return timeBefore < bufferTime || timeAfter < bufferTime;
    });

    if (nearbyEvents.length > 0) return 0.7;

    return 1.0;
  }

  private calculateTravelScore(slot: TimeSlot, existingEvents: CalendarEvent[]): number {
    // Find events before and after this slot
    const eventBefore = existingEvents
      .filter(e => e.endTime <= slot.startTime)
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())[0];

    const eventAfter = existingEvents
      .filter(e => e.startTime >= slot.endTime)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

    let score = 1.0;

    // Penalize if travel time is insufficient
    if (eventBefore && eventBefore.location) {
      const travelTime = this.estimateTravelTime(eventBefore.location, 'meeting_location');
      const availableTime = (slot.startTime.getTime() - eventBefore.endTime.getTime()) / (1000 * 60);
      if (availableTime < travelTime) {
        score *= 0.3;
      } else if (availableTime < travelTime + 15) {
        score *= 0.7;
      }
    }

    if (eventAfter && eventAfter.location) {
      const travelTime = this.estimateTravelTime('meeting_location', eventAfter.location);
      const availableTime = (eventAfter.startTime.getTime() - slot.endTime.getTime()) / (1000 * 60);
      if (availableTime < travelTime) {
        score *= 0.3;
      } else if (availableTime < travelTime + 15) {
        score *= 0.7;
      }
    }

    return score;
  }

  private calculateWorkloadScore(slot: TimeSlot, existingEvents: CalendarEvent[]): number {
    const dayStart = new Date(slot.startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = existingEvents.filter(event =>
      event.startTime >= dayStart && event.endTime <= dayEnd
    );

    const totalDayDuration = dayEvents.reduce((total, event) =>
      total + (event.endTime.getTime() - event.startTime.getTime()), 0
    ) / (1000 * 60 * 60); // Convert to hours

    // Penalize days that are already heavily loaded
    if (totalDayDuration > 8) return 0.3;
    if (totalDayDuration > 6) return 0.6;
    if (totalDayDuration > 4) return 0.8;

    return 1.0;
  }

  private calculateWeatherScore(slot: TimeSlot, weatherData?: WeatherInfo): number {
    if (!weatherData) return 0.8;

    // Prefer indoor meetings during bad weather
    if (weatherData.condition === 'stormy' || weatherData.precipitation > 0.5) {
      return 0.9; // Slightly prefer this time for indoor meetings
    }

    if (weatherData.condition === 'sunny' && weatherData.temperature > 15 && weatherData.temperature < 25) {
      return 1.0; // Perfect weather
    }

    return 0.8;
  }

  private calculateEnergyScore(slot: TimeSlot, preferences: CalendarPreferences): number {
    const hour = slot.startTime.getHours();

    // Energy levels throughout the day (based on circadian rhythms)
    const energyLevels = {
      6: 0.4, 7: 0.6, 8: 0.8, 9: 1.0, 10: 1.0, 11: 0.9,
      12: 0.7, 13: 0.5, 14: 0.8, 15: 0.9, 16: 0.8, 17: 0.7,
      18: 0.6, 19: 0.5, 20: 0.4, 21: 0.3, 22: 0.2
    };

    return energyLevels[hour] || 0.3;
  }

  private rankAndFilterSlots(slots: TimeSlot[]): TimeSlot[] {
    return slots
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5) // Return top 5 suggestions
      .map(slot => ({
        ...slot,
        reason: this.generateSlotReason(slot),
      }));
  }

  private generateSlotReason(slot: TimeSlot): string {
    const hour = slot.startTime.getHours();
    const dayOfWeek = slot.startTime.toLocaleDateString('en-US', { weekday: 'long' });

    if (slot.confidence > 0.9) {
      return `Optimal time on ${dayOfWeek} - high energy and no conflicts`;
    } else if (slot.confidence > 0.8) {
      return `Good time slot with minimal conflicts`;
    } else if (slot.confidence > 0.7) {
      return `Available time with some considerations`;
    } else {
      return `Available but may require adjustments`;
    }
  }

  private async analyzeTravelTime(
    request: SchedulingRequest,
    slots: TimeSlot[]
  ): Promise<TravelTimeInfo[]> {
    // Mock implementation
    return [];
  }

  private async generatePreparationSuggestions(
    request: SchedulingRequest,
    context: OptimizationContext
  ): Promise<string[]> {
    const suggestions = [
      'Prepare meeting agenda',
      'Review participant backgrounds',
      'Set up meeting room or virtual link',
    ];

    if (request.attendeeEmails.length > 5) {
      suggestions.push('Consider breaking into smaller groups');
    }

    if (request.priority === EventPriority.HIGH || request.priority === EventPriority.URGENT) {
      suggestions.push('Prepare decision-making framework');
      suggestions.push('Identify key stakeholders for follow-up');
    }

    return suggestions;
  }

  // Additional helper methods...

  private getDaySchedule(dayOfWeek: number, workingHours: WorkingHours): DaySchedule {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return workingHours[days[dayOfWeek] as keyof WorkingHours];
  }

  private generateDaySlots(date: Date, daySchedule: DaySchedule, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    if (!daySchedule.isWorkingDay) return slots;

    const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    // Generate 30-minute slots
    for (let time = dayStart.getTime(); time + duration * 60 * 1000 <= dayEnd.getTime(); time += 30 * 60 * 1000) {
      const startTime = new Date(time);
      const endTime = new Date(time + duration * 60 * 1000);
      
      slots.push({
        startTime,
        endTime,
        confidence: 0.5, // Will be calculated later
        reason: 'Available time slot',
      });
    }

    return slots;
  }

  private filterAvailableSlots(slots: TimeSlot[], existingEvents: CalendarEvent[]): TimeSlot[] {
    return slots.filter(slot => {
      return !existingEvents.some(event =>
        slot.startTime < event.endTime && slot.endTime > event.startTime
      );
    });
  }

  private getBaseTravelTime(from: string, to: string, mode: TransportMode): number {
    // Mock implementation - would use real mapping service
    return 30; // 30 minutes base time
  }

  private getTrafficMultiplier(time: Date): number {
    const hour = time.getHours();
    
    // Rush hour multipliers
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.5;
    }
    
    return 1.0;
  }

  private async getWeatherMultiplier(time: Date): Promise<number> {
    // Mock implementation - would use weather API
    return 1.0;
  }

  private estimateTravelTime(from: string, to: string): number {
    // Mock implementation
    return 15; // 15 minutes
  }

  private calculateScheduleScore(events: CalendarEvent[], context: OptimizationContext): number {
    // Mock implementation
    return 0.8;
  }

  private async applyTimeBlocking(events: CalendarEvent[], context: OptimizationContext): Promise<CalendarEvent[]> {
    // Mock implementation - would group similar events together
    return events;
  }

  private async optimizeCommute(events: CalendarEvent[], context: OptimizationContext): Promise<CalendarEvent[]> {
    // Mock implementation - would reorder events to minimize travel
    return events;
  }

  private async balanceWorkload(events: CalendarEvent[], context: OptimizationContext): Promise<CalendarEvent[]> {
    // Mock implementation - would distribute workload evenly
    return events;
  }

  private async optimizeEnergyLevels(events: CalendarEvent[], context: OptimizationContext): Promise<CalendarEvent[]> {
    // Mock implementation - would schedule high-energy tasks during peak hours
    return events;
  }

  private async getParticipantAvailability(participants: string[], context: OptimizationContext): Promise<TimeSlot[][]> {
    // Mock implementation
    return [];
  }

  private findCommonAvailability(participantAvailability: TimeSlot[][], duration: number): TimeSlot[] {
    // Mock implementation
    return [];
  }

  private analyzeTeamWorkload(members: TeamMember[], events: CalendarEvent[]): any {
    // Mock implementation
    return {};
  }

  private generateWorkloadRecommendations(analysis: any): WorkloadRecommendation[] {
    // Mock implementation
    return [];
  }

  private suggestWorkloadRedistribution(analysis: any): RedistributionSuggestion[] {
    // Mock implementation
    return [];
  }

  private calculateTeamEfficiencyScore(analysis: any): number {
    // Mock implementation
    return 0.8;
  }

  private calculateOptimalPreparationTime(event: CalendarEvent): number {
    // Base preparation time based on event type and priority
    let baseTime = 15; // 15 minutes default

    if (event.priority === EventPriority.HIGH) baseTime = 30;
    if (event.priority === EventPriority.URGENT) baseTime = 45;

    // Add time based on number of attendees
    if (event.attendees.length > 5) baseTime += 15;
    if (event.attendees.length > 10) baseTime += 15;

    return baseTime;
  }
}

// Supporting interfaces
export interface ScheduleImprovement {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  timesSaved: number; // in minutes
}

export interface WorkloadRecommendation {
  memberId: string;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
}

export interface RedistributionSuggestion {
  fromMemberId: string;
  toMemberId: string;
  eventId: string;
  reason: string;
}

export interface ParticipantInsight {
  email: string;
  name: string;
  recentInteractions: string[];
  preferredCommunicationStyle: string;
  expertise: string[];
}