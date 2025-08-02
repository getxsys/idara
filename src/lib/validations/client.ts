import { z } from 'zod';
import {
  ClientStatus,
  ClientTier,
  CompanySize,
  AddressType,
  ContactMethod,
  CommunicationStyle,
  PaymentMethod,
  PaymentStatus,
  ContractType,
  ContractStatus,
  InteractionType,
  InteractionOutcome,
  EngagementLevel,
  CommunicationFrequency,
  MeetingType,
  DecisionMakingStyle,
  ResponseTimeExpectation,
  ProjectManagementStyle,
  ActionPriority,
  InsightType,
  DayOfWeek,
} from '@/types/client';

// Base schemas
export const timeRangeSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  days: z.array(z.nativeEnum(DayOfWeek)).min(1, 'At least one day must be selected'),
});

export const contactPreferencesSchema = z.object({
  preferredContactMethod: z.nativeEnum(ContactMethod),
  bestTimeToContact: z.array(timeRangeSchema).default([]),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(2, 'Language code is required').max(5),
  communicationStyle: z.nativeEnum(CommunicationStyle),
});

export const contactSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
  role: z.string().min(1, 'Role is required').max(100),
  department: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  preferences: contactPreferencesSchema,
});

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(2, 'Country is required').max(100),
  type: z.nativeEnum(AddressType),
});

export const companyInfoSchema = z.object({
  legalName: z.string().min(1, 'Company legal name is required').max(200),
  industry: z.string().min(1, 'Industry is required').max(100),
  size: z.nativeEnum(CompanySize),
  website: z.string().url('Invalid website URL').optional(),
  taxId: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
});

export const socialMediaLinksSchema = z.object({
  linkedin: z.string().url('Invalid LinkedIn URL').optional(),
  twitter: z.string().url('Invalid Twitter URL').optional(),
  facebook: z.string().url('Invalid Facebook URL').optional(),
  instagram: z.string().url('Invalid Instagram URL').optional(),
  website: z.string().url('Invalid website URL').optional(),
});

export const contactInfoSchema = z.object({
  primaryContact: contactSchema,
  additionalContacts: z.array(contactSchema).default([]),
  company: companyInfoSchema,
  address: addressSchema,
  socialMedia: socialMediaLinksSchema.default({}),
});

export const paymentRecordSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().optional(),
  status: z.nativeEnum(PaymentStatus),
  daysOverdue: z.number().min(0).optional(),
});

export const paymentTermsSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  terms: z.string().min(1, 'Payment terms are required').max(100),
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  creditLimit: z.number().min(0).optional(),
  paymentHistory: z.array(paymentRecordSchema).default([]),
});

export const contractDetailsSchema = z.object({
  type: z.nativeEnum(ContractType),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
  terms: z.string().min(1, 'Contract terms are required').max(2000),
  value: z.number().min(0, 'Contract value must be positive'),
  status: z.nativeEnum(ContractStatus),
});

export const relationshipDataSchema = z.object({
  status: z.nativeEnum(ClientStatus),
  tier: z.nativeEnum(ClientTier),
  acquisitionDate: z.coerce.date(),
  lastContactDate: z.coerce.date(),
  totalRevenue: z.number().min(0),
  averageProjectValue: z.number().min(0),
  paymentTerms: paymentTermsSchema,
  contractDetails: contractDetailsSchema,
  satisfactionScore: z.number().min(0).max(10),
  loyaltyScore: z.number().min(0).max(100),
});

export const emotionScoreSchema = z.object({
  emotion: z.string().min(1, 'Emotion name is required'),
  score: z.number().min(0).max(1),
});

export const sentimentScoreSchema = z.object({
  overall: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  emotions: z.array(emotionScoreSchema).default([]),
});

export const interactionSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(InteractionType),
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().max(2000),
  contactId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.date(),
  duration: z.number().min(0).max(1440).optional(), // max 24 hours in minutes
  outcome: z.nativeEnum(InteractionOutcome),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  sentiment: sentimentScoreSchema,
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export const clientPreferencesSchema = z.object({
  communicationFrequency: z.nativeEnum(CommunicationFrequency),
  preferredMeetingTypes: z.array(z.nativeEnum(MeetingType)).default([]),
  decisionMakingStyle: z.nativeEnum(DecisionMakingStyle),
  responseTimeExpectation: z.nativeEnum(ResponseTimeExpectation),
  projectManagementStyle: z.nativeEnum(ProjectManagementStyle),
});

export const nextBestActionSchema = z.object({
  action: z.string().min(1, 'Action is required').max(200),
  reason: z.string().min(1, 'Reason is required').max(500),
  priority: z.nativeEnum(ActionPriority),
  estimatedImpact: z.string().max(500),
  suggestedDate: z.date(),
});

export const clientInsightSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(InsightType),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000),
  confidence: z.number().min(0).max(1),
  actionable: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional(),
});

export const clientAIProfileSchema = z.object({
  healthScore: z.number().min(0).max(100),
  engagementLevel: z.nativeEnum(EngagementLevel),
  churnRisk: z.number().min(0).max(1),
  preferences: clientPreferencesSchema,
  communicationStyle: z.nativeEnum(CommunicationStyle),
  predictedLifetimeValue: z.number().min(0),
  nextBestAction: nextBestActionSchema,
  insights: z.array(clientInsightSchema).default([]),
  lastAnalyzed: z.date().default(() => new Date()),
});

export const clientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Client name is required').max(200),
  contact: contactInfoSchema,
  relationship: relationshipDataSchema,
  projects: z.array(z.string().uuid()).default([]),
  interactions: z.array(interactionSchema).default([]),
  aiProfile: clientAIProfileSchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create client schema (for API endpoints)
export const createClientSchema = clientSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  projects: true,
  interactions: true,
  aiProfile: true,
}).extend({
  contact: contactInfoSchema.extend({
    primaryContact: contactSchema.omit({ id: true }),
    additionalContacts: z.array(contactSchema.omit({ id: true })).default([]),
  }),
});

// Update client schema
export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid(),
});

// Client query schema
export const clientQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'status', 'tier', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.nativeEnum(ClientStatus).optional(),
  tier: z.nativeEnum(ClientTier).optional(),
  industry: z.string().optional(),
  search: z.string().max(100).optional(),
});

// Interaction management schemas
export const createInteractionSchema = interactionSchema.omit({
  id: true,
  createdAt: true,
});

export const updateInteractionSchema = createInteractionSchema.partial().extend({
  id: z.string().uuid(),
});

export const interactionQuerySchema = z.object({
  clientId: z.string().uuid(),
  type: z.nativeEnum(InteractionType).optional(),
  contactId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  outcome: z.nativeEnum(InteractionOutcome).optional(),
});

// Contact management schemas
export const createContactSchema = contactSchema.omit({
  id: true,
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid(),
});

// Type exports
export type ClientData = z.infer<typeof clientSchema>;
export type CreateClientData = z.infer<typeof createClientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
export type ClientQueryData = z.infer<typeof clientQuerySchema>;
export type InteractionData = z.infer<typeof interactionSchema>;
export type CreateInteractionData = z.infer<typeof createInteractionSchema>;
export type UpdateInteractionData = z.infer<typeof updateInteractionSchema>;
export type InteractionQueryData = z.infer<typeof interactionQuerySchema>;
export type ContactData = z.infer<typeof contactSchema>;
export type CreateContactData = z.infer<typeof createContactSchema>;
export type UpdateContactData = z.infer<typeof updateContactSchema>;
