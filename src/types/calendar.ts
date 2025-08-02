export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay: boolean;
  
  // Event type and priority
  type: EventType;
  priority: EventPriority;
  status: EventStatus;
  
  // Participants
  organizerId: string;
  attendees: EventAttendee[];
  
  // Recurrence
  recurrence?: RecurrenceRule;
  
  // AI-powered features
  aiSuggestions?: EventAISuggestions;
  conflictDetection?: ConflictInfo[];
  
  // External calendar integration
  externalCalendarId?: string;
  externalEventId?: string;
  
  // Relationships
  projectId?: string;
  clientId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  id: string;
  userId?: string;
  email: string;
  name: string;
  status: AttendeeStatus;
  isOptional: boolean;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  count?: number;
  byWeekDay?: number[];
  byMonthDay?: number[];
}

export interface EventAISuggestions {
  optimalTimes: TimeSlot[];
  conflictResolutions: ConflictResolution[];
  preparationItems: string[];
  relatedDocuments: string[];
  travelTimeEstimate?: number;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  confidence: number;
  reason: string;
}

export interface ConflictInfo {
  conflictingEventId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  suggestedResolution?: ConflictResolution;
}

export interface ConflictResolution {
  type: ResolutionType;
  description: string;
  newStartTime?: Date;
  newEndTime?: Date;
  alternativeOptions?: TimeSlot[];
}

export interface CalendarView {
  type: CalendarViewType;
  startDate: Date;
  endDate: Date;
  selectedDate?: Date;
}

export interface CalendarPreferences {
  defaultView: CalendarViewType;
  workingHours: WorkingHours;
  timeZone: string;
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  showWeekends: boolean;
  defaultEventDuration: number; // in minutes
  reminderDefaults: ReminderSetting[];
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorkingDay: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breaks: TimeBreak[];
}

export interface TimeBreak {
  startTime: string;
  endTime: string;
  title: string;
}

export interface ReminderSetting {
  type: ReminderType;
  minutes: number;
}

export interface SchedulingRequest {
  title: string;
  duration: number; // in minutes
  attendeeEmails: string[];
  preferredTimes?: TimeSlot[];
  constraints?: SchedulingConstraints;
  priority: EventPriority;
}

export interface SchedulingConstraints {
  mustBeWithinWorkingHours: boolean;
  allowWeekends: boolean;
  minimumNotice: number; // in hours
  maximumAdvance: number; // in days
  preferredDaysOfWeek?: number[];
  avoidTimeSlots?: TimeSlot[];
}

export interface SchedulingResult {
  suggestedTimes: TimeSlot[];
  conflicts: ConflictInfo[];
  travelTimeConsiderations?: TravelTimeInfo[];
  preparationSuggestions: string[];
}

export interface TravelTimeInfo {
  fromLocation: string;
  toLocation: string;
  estimatedTravelTime: number; // in minutes
  transportMode: TransportMode;
}

export interface ExternalCalendarIntegration {
  id: string;
  provider: CalendarProvider;
  accountEmail: string;
  isEnabled: boolean;
  syncDirection: SyncDirection;
  lastSyncAt?: Date;
  syncErrors?: string[];
}

// Enums
export enum EventType {
  MEETING = 'MEETING',
  APPOINTMENT = 'APPOINTMENT',
  TASK = 'TASK',
  REMINDER = 'REMINDER',
  DEADLINE = 'DEADLINE',
  PERSONAL = 'PERSONAL',
  TRAVEL = 'TRAVEL',
  BREAK = 'BREAK'
}

export enum EventPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum EventStatus {
  CONFIRMED = 'CONFIRMED',
  TENTATIVE = 'TENTATIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum AttendeeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  TENTATIVE = 'TENTATIVE'
}

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum ConflictType {
  OVERLAP = 'OVERLAP',
  BACK_TO_BACK = 'BACK_TO_BACK',
  TRAVEL_TIME = 'TRAVEL_TIME',
  WORKLOAD = 'WORKLOAD'
}

export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ResolutionType {
  RESCHEDULE = 'RESCHEDULE',
  SHORTEN = 'SHORTEN',
  SPLIT = 'SPLIT',
  DELEGATE = 'DELEGATE',
  CANCEL = 'CANCEL'
}

export enum CalendarViewType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  AGENDA = 'AGENDA',
  YEAR = 'YEAR'
}

export enum ReminderType {
  POPUP = 'POPUP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}

export enum TransportMode {
  WALKING = 'WALKING',
  DRIVING = 'DRIVING',
  PUBLIC_TRANSPORT = 'PUBLIC_TRANSPORT',
  CYCLING = 'CYCLING'
}

export enum CalendarProvider {
  GOOGLE = 'GOOGLE',
  OUTLOOK = 'OUTLOOK',
  APPLE = 'APPLE',
  EXCHANGE = 'EXCHANGE'
}

export enum SyncDirection {
  IMPORT_ONLY = 'IMPORT_ONLY',
  EXPORT_ONLY = 'EXPORT_ONLY',
  BIDIRECTIONAL = 'BIDIRECTIONAL'
}