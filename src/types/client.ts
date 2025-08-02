export interface Client {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  preferredContactMethod?: ContactMethod;
  communicationStyle?: CommunicationStyle;
  timezone?: string;
  language?: string;
  companyLegalName?: string;
  industry?: string;
  companySize?: CompanySize;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  foundedYear?: number;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  clientStatus?: ClientStatus;
  clientTier?: ClientTier;
  acquisitionDate?: Date;
  lastContactDate?: Date;
  totalRevenue?: number;
  averageProjectValue?: number;
  paymentMethod?: PaymentMethod;
  paymentTerms?: string; // e.g., "Net 30"
  currency?: string;
  creditLimit?: number;
  contractType?: ContractType;
  contractStartDate?: Date;
  contractEndDate?: Date;
  contractRenewalDate?: Date;
  contractTerms?: string;
  contractValue?: number;
  contractStatus?: ContractStatus;
  satisfactionScore?: number; // 0-10
  loyaltyScore?: number; // 0-100
  healthScore?: number; // 0-100
  engagementLevel?: EngagementLevel;
  churnRisk?: number; // 0-1
  communicationFrequency?: CommunicationFrequency;
  preferredMeetingTypes?: MeetingType[];
  decisionMakingStyle?: DecisionMakingStyle;
  responseTimeExpectation?: ResponseTimeExpectation;
  projectManagementStyle?: ProjectManagementStyle;
  predictedLifetimeValue?: number;
  nextBestAction?: string; // Action from NextBestAction
  nextBestActionReason?: string;
  nextBestActionPriority?: ActionPriority;
  nextBestActionEstimatedImpact?: string;
  nextBestActionSuggestedDate?: Date;
  lastAnalyzed?: Date;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relationships (these are still nested, but handled by Prisma includes)
  projects?: Project[];
  interactions?: Interaction[];
  documents?: Document[];
  aiProfile?: any; // Keep as any for now, or define a flat AI profile if needed
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
  days: DayOfWeek[];
}

export interface Interaction {
  id: string;
  type: InteractionType;
  subject: string;
  description: string;
  contactId: string;
  userId: string; // who from our team
  date: Date;
  duration?: number; // in minutes
  outcome: InteractionOutcome;
  followUpRequired: boolean;
  followUpDate?: Date;
  sentiment: SentimentScore;
  tags: string[];
  attachments: string[];
  createdAt: Date;
}

export interface SentimentScore {
  overall: number; // -1 to 1
  confidence: number; // 0 to 1
  emotions: EmotionScore[];
}

export interface EmotionScore {
  emotion: string;
  score: number; // 0 to 1
}

export interface ClientInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0-1
  actionable: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Enums
export enum ClientStatus {
  PROSPECT = 'prospect',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CHURNED = 'churned',
  BLOCKED = 'blocked',
}

export enum ClientTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ENTERPRISE = 'enterprise',
}

export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small', // 1-50 employees
  MEDIUM = 'medium', // 51-250 employees
  LARGE = 'large', // 251-1000 employees
  ENTERPRISE = 'enterprise', // 1000+ employees
}

export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OFFICE = 'office',
  HEADQUARTERS = 'headquarters',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  VIDEO_CALL = 'video_call',
  IN_PERSON = 'in_person',
  MESSAGING = 'messaging',
}

export enum CommunicationStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  DIRECT = 'direct',
  COLLABORATIVE = 'collaborative',
  ANALYTICAL = 'analytical',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  CHECK = 'check',
  DIGITAL_WALLET = 'digital_wallet',
  CRYPTOCURRENCY = 'cryptocurrency',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

export enum ContractType {
  SERVICE_AGREEMENT = 'service_agreement',
  RETAINER = 'retainer',
  PROJECT_BASED = 'project_based',
  SUBSCRIPTION = 'subscription',
  PARTNERSHIP = 'partnership',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  UNDER_REVIEW = 'under_review',
}

export enum InteractionType {
  EMAIL = 'email',
  PHONE_CALL = 'phone_call',
  VIDEO_CALL = 'video_call',
  MEETING = 'meeting',
  PROPOSAL = 'proposal',
  CONTRACT_REVIEW = 'contract_review',
  SUPPORT_TICKET = 'support_ticket',
  SOCIAL_MEDIA = 'social_media',
}

export enum InteractionOutcome {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  ACTION_REQUIRED = 'action_required',
  FOLLOW_UP_SCHEDULED = 'follow_up_scheduled',
  DEAL_CLOSED = 'deal_closed',
  DEAL_LOST = 'deal_lost',
}

export enum EngagementLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum CommunicationFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  AS_NEEDED = 'as_needed',
}

export enum MeetingType {
  STATUS_UPDATE = 'status_update',
  PLANNING = 'planning',
  REVIEW = 'review',
  PRESENTATION = 'presentation',
  WORKSHOP = 'workshop',
  SOCIAL = 'social',
}

export enum DecisionMakingStyle {
  ANALYTICAL = 'analytical',
  DIRECTIVE = 'directive',
  CONCEPTUAL = 'conceptual',
  BEHAVIORAL = 'behavioral',
}

export enum ResponseTimeExpectation {
  IMMEDIATE = 'immediate', // within 1 hour
  SAME_DAY = 'same_day', // within 8 hours
  NEXT_DAY = 'next_day', // within 24 hours
  WITHIN_WEEK = 'within_week', // within 7 days
  FLEXIBLE = 'flexible',
}

export enum ProjectManagementStyle {
  AGILE = 'agile',
  WATERFALL = 'waterfall',
  HYBRID = 'hybrid',
  FLEXIBLE = 'flexible',
}

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum InsightType {
  OPPORTUNITY = 'opportunity',
  RISK = 'risk',
  TREND = 'trend',
  RECOMMENDATION = 'recommendation',
  ALERT = 'alert',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

import type { Project } from './project';
