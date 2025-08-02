import { z } from 'zod';
import {
  EventType,
  EventPriority,
  EventStatus,
  AttendeeStatus,
  RecurrenceFrequency,
  CalendarViewType,
  ReminderType,
  TransportMode,
  CalendarProvider,
  SyncDirection,
  ConflictType,
  ConflictSeverity,
  ResolutionType
} from '@/types/calendar';

// Base event validation
export const eventAttendeeSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  status: z.nativeEnum(AttendeeStatus),
  isOptional: z.boolean()
});

export const recurrenceRuleSchema = z.object({
  frequency: z.nativeEnum(RecurrenceFrequency),
  interval: z.number().min(1),
  endDate: z.date().optional(),
  count: z.number().min(1).optional(),
  byWeekDay: z.array(z.number().min(0).max(6)).optional(),
  byMonthDay: z.array(z.number().min(1).max(31)).optional()
});

export const timeSlotSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  confidence: z.number().min(0).max(1),
  reason: z.string()
});

export const conflictResolutionSchema = z.object({
  type: z.nativeEnum(ResolutionType),
  description: z.string(),
  newStartTime: z.date().optional(),
  newEndTime: z.date().optional(),
  alternativeOptions: z.array(timeSlotSchema).optional()
});

export const conflictInfoSchema = z.object({
  conflictingEventId: z.string(),
  conflictType: z.nativeEnum(ConflictType),
  severity: z.nativeEnum(ConflictSeverity),
  suggestedResolution: conflictResolutionSchema.optional()
});

export const eventAISuggestionsSchema = z.object({
  optimalTimes: z.array(timeSlotSchema),
  conflictResolutions: z.array(conflictResolutionSchema),
  preparationItems: z.array(z.string()),
  relatedDocuments: z.array(z.string()),
  travelTimeEstimate: z.number().min(0).optional()
});

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().optional(),
  isAllDay: z.boolean(),
  type: z.nativeEnum(EventType),
  priority: z.nativeEnum(EventPriority),
  status: z.nativeEnum(EventStatus),
  organizerId: z.string(),
  attendees: z.array(eventAttendeeSchema),
  recurrence: recurrenceRuleSchema.optional(),
  aiSuggestions: eventAISuggestionsSchema.optional(),
  conflictDetection: z.array(conflictInfoSchema).optional(),
  externalCalendarId: z.string().optional(),
  externalEventId: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"]
});

// Create event validation
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().max(200, 'Location too long').optional(),
  isAllDay: z.boolean().default(false),
  type: z.nativeEnum(EventType).default(EventType.MEETING),
  priority: z.nativeEnum(EventPriority).default(EventPriority.MEDIUM),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().min(1),
    isOptional: z.boolean().default(false)
  })).default([]),
  recurrence: recurrenceRuleSchema.optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional()
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"]
});

// Update event validation
export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string()
});

// Calendar preferences validation
export const dayScheduleSchema = z.object({
  isWorkingDay: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  breaks: z.array(z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    title: z.string().min(1)
  })).default([])
});

export const workingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema
});

export const reminderSettingSchema = z.object({
  type: z.nativeEnum(ReminderType),
  minutes: z.number().min(0)
});

export const calendarPreferencesSchema = z.object({
  defaultView: z.nativeEnum(CalendarViewType).default(CalendarViewType.WEEK),
  workingHours: workingHoursSchema,
  timeZone: z.string().default('UTC'),
  weekStartsOn: z.number().min(0).max(6).default(1),
  showWeekends: z.boolean().default(true),
  defaultEventDuration: z.number().min(15).max(480).default(60),
  reminderDefaults: z.array(reminderSettingSchema).default([])
});

// Scheduling validation
export const schedulingConstraintsSchema = z.object({
  mustBeWithinWorkingHours: z.boolean().default(true),
  allowWeekends: z.boolean().default(false),
  minimumNotice: z.number().min(0).default(1),
  maximumAdvance: z.number().min(1).default(90),
  preferredDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  avoidTimeSlots: z.array(timeSlotSchema).optional()
});

export const schedulingRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  duration: z.number().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours'),
  attendeeEmails: z.array(z.string().email()).min(1, 'At least one attendee is required'),
  preferredTimes: z.array(timeSlotSchema).optional(),
  constraints: schedulingConstraintsSchema.optional(),
  priority: z.nativeEnum(EventPriority).default(EventPriority.MEDIUM)
});

// External calendar integration validation
export const externalCalendarIntegrationSchema = z.object({
  id: z.string(),
  provider: z.nativeEnum(CalendarProvider),
  accountEmail: z.string().email(),
  isEnabled: z.boolean(),
  syncDirection: z.nativeEnum(SyncDirection),
  lastSyncAt: z.date().optional(),
  syncErrors: z.array(z.string()).optional()
});

// Calendar view validation
export const calendarViewSchema = z.object({
  type: z.nativeEnum(CalendarViewType),
  startDate: z.date(),
  endDate: z.date(),
  selectedDate: z.date().optional()
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

// Query validation
export const calendarQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.nativeEnum(EventType).optional(),
  priority: z.nativeEnum(EventPriority).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  attendeeEmail: z.string().email().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

// Export types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CalendarPreferencesInput = z.infer<typeof calendarPreferencesSchema>;
export type SchedulingRequestInput = z.infer<typeof schedulingRequestSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;