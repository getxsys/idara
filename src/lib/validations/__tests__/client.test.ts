import { describe, it, expect } from '@jest/globals';
import {
  clientSchema,
  createClientSchema,
  updateClientSchema,
  contactSchema,
  interactionSchema,
  addressSchema,
  companyInfoSchema,
} from '../client';
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
  DayOfWeek,
} from '@/types/client';

describe('Client Validation Schemas', () => {
  describe('contactSchema', () => {
    it('should validate a valid contact', () => {
      const validContact = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        role: 'CEO',
        department: 'Executive',
        isPrimary: true,
        preferences: {
          preferredContactMethod: ContactMethod.EMAIL,
          bestTimeToContact: [],
          timezone: 'America/New_York',
          language: 'en',
          communicationStyle: CommunicationStyle.FORMAL,
        },
      };

      const result = contactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it('should reject contact with invalid email', () => {
      const invalidContact = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+1-555-123-4567',
        role: 'CEO',
        isPrimary: true,
        preferences: {
          preferredContactMethod: ContactMethod.EMAIL,
          bestTimeToContact: [],
          timezone: 'America/New_York',
          language: 'en',
          communicationStyle: CommunicationStyle.FORMAL,
        },
      };

      const result = contactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
    });

    it('should reject contact with empty first name', () => {
      const invalidContact = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: '',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        role: 'CEO',
        isPrimary: true,
        preferences: {
          preferredContactMethod: ContactMethod.EMAIL,
          bestTimeToContact: [],
          timezone: 'America/New_York',
          language: 'en',
          communicationStyle: CommunicationStyle.FORMAL,
        },
      };

      const result = contactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
    });
  });

  describe('addressSchema', () => {
    it('should validate a valid address', () => {
      const validAddress = {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        type: AddressType.OFFICE,
      };

      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should reject address with empty required fields', () => {
      const invalidAddress = {
        street: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        type: AddressType.OFFICE,
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('companyInfoSchema', () => {
    it('should validate a valid company info', () => {
      const validCompanyInfo = {
        legalName: 'Acme Corporation',
        industry: 'Technology',
        size: CompanySize.MEDIUM,
        website: 'https://www.acme.com',
        taxId: '12-3456789',
        registrationNumber: 'REG123456',
        foundedYear: 2010,
      };

      const result = companyInfoSchema.safeParse(validCompanyInfo);
      expect(result.success).toBe(true);
    });

    it('should reject company with invalid website URL', () => {
      const invalidCompanyInfo = {
        legalName: 'Acme Corporation',
        industry: 'Technology',
        size: CompanySize.MEDIUM,
        website: 'not-a-valid-url',
      };

      const result = companyInfoSchema.safeParse(invalidCompanyInfo);
      expect(result.success).toBe(false);
    });

    it('should reject company with future founded year', () => {
      const invalidCompanyInfo = {
        legalName: 'Acme Corporation',
        industry: 'Technology',
        size: CompanySize.MEDIUM,
        foundedYear: 2030,
      };

      const result = companyInfoSchema.safeParse(invalidCompanyInfo);
      expect(result.success).toBe(false);
    });
  });

  describe('interactionSchema', () => {
    it('should validate a valid interaction', () => {
      const validInteraction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: InteractionType.EMAIL,
        subject: 'Project Update',
        description: 'Discussed project progress and next steps',
        contactId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        date: new Date('2024-01-15'),
        duration: 30,
        outcome: InteractionOutcome.POSITIVE,
        followUpRequired: true,
        followUpDate: new Date('2024-01-22'),
        sentiment: {
          overall: 0.8,
          confidence: 0.9,
          emotions: [],
        },
        tags: ['project', 'update'],
        attachments: [],
        createdAt: new Date(),
      };

      const result = interactionSchema.safeParse(validInteraction);
      expect(result.success).toBe(true);
    });

    it('should reject interaction with negative duration', () => {
      const invalidInteraction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: InteractionType.EMAIL,
        subject: 'Project Update',
        description: 'Discussed project progress',
        contactId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        date: new Date('2024-01-15'),
        duration: -10,
        outcome: InteractionOutcome.POSITIVE,
        followUpRequired: false,
        sentiment: {
          overall: 0.8,
          confidence: 0.9,
          emotions: [],
        },
        tags: [],
        attachments: [],
        createdAt: new Date(),
      };

      const result = interactionSchema.safeParse(invalidInteraction);
      expect(result.success).toBe(false);
    });

    it('should set default values for optional fields', () => {
      const minimalInteraction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: InteractionType.EMAIL,
        subject: 'Test',
        description: 'Test interaction',
        contactId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        date: new Date(),
        outcome: InteractionOutcome.NEUTRAL,
        sentiment: {
          overall: 0,
          confidence: 0.5,
          emotions: [],
        },
      };

      const result = interactionSchema.safeParse(minimalInteraction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.followUpRequired).toBe(false);
        expect(result.data.tags).toEqual([]);
        expect(result.data.attachments).toEqual([]);
      }
    });
  });

  describe('clientSchema', () => {
    it('should validate a complete client', () => {
      const validClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        contact: {
          primaryContact: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acme.com',
            phone: '+1-555-123-4567',
            role: 'CEO',
            isPrimary: true,
            preferences: {
              preferredContactMethod: ContactMethod.EMAIL,
              bestTimeToContact: [],
              timezone: 'America/New_York',
              language: 'en',
              communicationStyle: CommunicationStyle.FORMAL,
            },
          },
          additionalContacts: [],
          company: {
            legalName: 'Acme Corporation',
            industry: 'Technology',
            size: CompanySize.MEDIUM,
          },
          address: {
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'United States',
            type: AddressType.OFFICE,
          },
          socialMedia: {},
        },
        relationship: {
          status: ClientStatus.ACTIVE,
          tier: ClientTier.GOLD,
          acquisitionDate: new Date('2023-01-01'),
          lastContactDate: new Date('2024-01-15'),
          totalRevenue: 150000,
          averageProjectValue: 50000,
          paymentTerms: {
            method: PaymentMethod.BANK_TRANSFER,
            terms: 'Net 30',
            currency: 'USD',
            paymentHistory: [],
          },
          contractDetails: {
            type: ContractType.SERVICE_AGREEMENT,
            startDate: new Date('2023-01-01'),
            endDate: new Date('2024-12-31'),
            terms: 'Standard service agreement terms',
            value: 200000,
            status: ContractStatus.ACTIVE,
          },
          satisfactionScore: 8.5,
          loyaltyScore: 85,
        },
        projects: [],
        interactions: [],
        aiProfile: {
          healthScore: 85,
          engagementLevel: EngagementLevel.HIGH,
          churnRisk: 0.1,
          preferences: {
            communicationFrequency: 'weekly' as any,
            preferredMeetingTypes: [],
            decisionMakingStyle: 'analytical' as any,
            responseTimeExpectation: 'same_day' as any,
            projectManagementStyle: 'agile' as any,
          },
          communicationStyle: CommunicationStyle.FORMAL,
          predictedLifetimeValue: 500000,
          nextBestAction: {
            action: 'Schedule quarterly review',
            reason: 'Maintain strong relationship',
            priority: 'medium' as any,
            estimatedImpact: 'High client satisfaction',
            suggestedDate: new Date('2024-04-01'),
          },
          insights: [],
          lastAnalyzed: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = clientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it('should reject client with empty name', () => {
      const invalidClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        // ... other required fields would be here
      };

      const result = clientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });
  });

  describe('createClientSchema', () => {
    it('should validate client creation data', () => {
      const createData = {
        name: 'New Client Corp',
        contact: {
          primaryContact: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@newclient.com',
            phone: '+1-555-987-6543',
            role: 'CTO',
            isPrimary: true,
            preferences: {
              preferredContactMethod: ContactMethod.EMAIL,
              bestTimeToContact: [],
              timezone: 'America/Los_Angeles',
              language: 'en',
              communicationStyle: CommunicationStyle.CASUAL,
            },
          },
          additionalContacts: [],
          company: {
            legalName: 'New Client Corporation',
            industry: 'Healthcare',
            size: CompanySize.SMALL,
          },
          address: {
            street: '456 Oak Avenue',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'United States',
            type: AddressType.HEADQUARTERS,
          },
          socialMedia: {},
        },
        relationship: {
          status: ClientStatus.PROSPECT,
          tier: ClientTier.BRONZE,
          acquisitionDate: new Date(),
          lastContactDate: new Date(),
          totalRevenue: 0,
          averageProjectValue: 0,
          paymentTerms: {
            method: PaymentMethod.CREDIT_CARD,
            terms: 'Net 15',
            currency: 'USD',
            paymentHistory: [],
          },
          contractDetails: {
            type: ContractType.PROJECT_BASED,
            startDate: new Date(),
            terms: 'Project-based contract',
            value: 25000,
            status: ContractStatus.DRAFT,
          },
          satisfactionScore: 0,
          loyaltyScore: 0,
        },
      };

      const result = createClientSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateClientSchema', () => {
    it('should validate partial client update data', () => {
      const updateData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Client Name',
      };

      const result = updateClientSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should require id field for updates', () => {
      const updateData = {
        name: 'Updated Client Name',
      };

      const result = updateClientSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });
});