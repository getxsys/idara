import { Client, ClientStatus, ClientTier, ContactMethod, CommunicationStyle, CompanySize, AddressType, PaymentMethod, PaymentStatus, ContractType, ContractStatus, EngagementLevel, CommunicationFrequency, DecisionMakingStyle, ResponseTimeExpectation, ProjectManagementStyle, ActionPriority } from '@/types/client';

/**
 * Mock client data for development and testing
 */
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Corporation',
    contact: {
      primaryContact: {
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@acme.com',
        phone: '+1-555-0123',
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
      },
      additionalContacts: [
        {
          id: 'contact-2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@acme.com',
          phone: '+1-555-0124',
          role: 'CTO',
          department: 'Technology',
          isPrimary: false,
          preferences: {
            preferredContactMethod: ContactMethod.PHONE,
            bestTimeToContact: [],
            timezone: 'America/New_York',
            language: 'en',
            communicationStyle: CommunicationStyle.DIRECT,
          },
        },
      ],
      company: {
        legalName: 'Acme Corporation Inc.',
        industry: 'Technology',
        size: CompanySize.LARGE,
        website: 'https://www.acme.com',
        taxId: '12-3456789',
        registrationNumber: 'REG123456',
        foundedYear: 2010,
      },
      address: {
        street: '123 Business Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        type: AddressType.HEADQUARTERS,
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/company/acme',
        twitter: 'https://twitter.com/acme',
        website: 'https://www.acme.com',
      },
    },
    relationship: {
      status: ClientStatus.ACTIVE,
      tier: ClientTier.GOLD,
      acquisitionDate: new Date('2023-01-15'),
      lastContactDate: new Date('2024-01-20'),
      totalRevenue: 450000,
      averageProjectValue: 75000,
      paymentTerms: {
        method: PaymentMethod.BANK_TRANSFER,
        terms: 'Net 30',
        currency: 'USD',
        paymentHistory: [
          {
            invoiceId: 'INV-001',
            amount: 75000,
            dueDate: new Date('2024-01-15'),
            paidDate: new Date('2024-01-10'),
            status: PaymentStatus.PAID,
          },
        ],
      },
      contractDetails: {
        type: ContractType.SERVICE_AGREEMENT,
        startDate: new Date('2023-01-15'),
        endDate: new Date('2024-12-31'),
        terms: 'Standard service agreement with quarterly reviews',
        value: 500000,
        status: ContractStatus.ACTIVE,
      },
      satisfactionScore: 8.5,
      loyaltyScore: 85,
    },
    projects: [],
    interactions: [
      {
        id: 'interaction-1',
        type: 'email' as any,
        subject: 'Project Kickoff Meeting',
        description: 'Discussed project timeline and deliverables',
        contactId: 'contact-1',
        userId: 'user-1',
        date: new Date('2024-01-20'),
        duration: 60,
        outcome: 'positive' as any,
        followUpRequired: true,
        followUpDate: new Date('2024-01-27'),
        sentiment: {
          overall: 0.8,
          confidence: 0.9,
          emotions: [],
        },
        tags: ['project', 'kickoff'],
        attachments: [],
        createdAt: new Date('2024-01-20'),
      },
    ],
    aiProfile: {
      healthScore: 85,
      engagementLevel: EngagementLevel.HIGH,
      churnRisk: 0.15,
      preferences: {
        communicationFrequency: CommunicationFrequency.WEEKLY,
        preferredMeetingTypes: ['status_update' as any, 'planning' as any],
        decisionMakingStyle: DecisionMakingStyle.ANALYTICAL,
        responseTimeExpectation: ResponseTimeExpectation.SAME_DAY,
        projectManagementStyle: ProjectManagementStyle.AGILE,
      },
      communicationStyle: CommunicationStyle.FORMAL,
      predictedLifetimeValue: 750000,
      nextBestAction: {
        action: 'Schedule quarterly business review',
        reason: 'Maintain strong relationship and identify expansion opportunities',
        priority: ActionPriority.MEDIUM,
        estimatedImpact: 'High client satisfaction and potential contract expansion',
        suggestedDate: new Date('2024-04-01'),
      },
      insights: [
        {
          id: 'insight-1',
          type: 'opportunity' as any,
          title: 'Expansion Opportunity',
          description: 'Client has expressed interest in additional services',
          confidence: 0.8,
          actionable: true,
          createdAt: new Date('2024-01-15'),
        },
      ],
      lastAnalyzed: new Date('2024-01-21'),
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: 'client-2',
    name: 'Tech Innovations LLC',
    contact: {
      primaryContact: {
        id: 'contact-3',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@techinnovations.com',
        phone: '+1-555-0456',
        role: 'Founder & CEO',
        department: 'Executive',
        isPrimary: true,
        preferences: {
          preferredContactMethod: ContactMethod.VIDEO_CALL,
          bestTimeToContact: [],
          timezone: 'America/Los_Angeles',
          language: 'en',
          communicationStyle: CommunicationStyle.CASUAL,
        },
      },
      additionalContacts: [],
      company: {
        legalName: 'Tech Innovations LLC',
        industry: 'Software Development',
        size: CompanySize.MEDIUM,
        website: 'https://www.techinnovations.com',
        foundedYear: 2018,
      },
      address: {
        street: '456 Innovation Avenue',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'United States',
        type: AddressType.OFFICE,
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/company/tech-innovations',
        website: 'https://www.techinnovations.com',
      },
    },
    relationship: {
      status: ClientStatus.ACTIVE,
      tier: ClientTier.PLATINUM,
      acquisitionDate: new Date('2023-06-01'),
      lastContactDate: new Date('2024-01-18'),
      totalRevenue: 680000,
      averageProjectValue: 120000,
      paymentTerms: {
        method: PaymentMethod.CREDIT_CARD,
        terms: 'Net 15',
        currency: 'USD',
        paymentHistory: [
          {
            invoiceId: 'INV-002',
            amount: 120000,
            dueDate: new Date('2024-01-10'),
            paidDate: new Date('2024-01-08'),
            status: PaymentStatus.PAID,
          },
        ],
      },
      contractDetails: {
        type: ContractType.RETAINER,
        startDate: new Date('2023-06-01'),
        endDate: new Date('2025-05-31'),
        terms: 'Monthly retainer with project-based add-ons',
        value: 800000,
        status: ContractStatus.ACTIVE,
      },
      satisfactionScore: 9.2,
      loyaltyScore: 95,
    },
    projects: [],
    interactions: [
      {
        id: 'interaction-2',
        type: 'phone' as any,
        subject: 'Monthly Check-in',
        description: 'Discussed project progress and upcoming milestones',
        contactId: 'contact-3',
        userId: 'user-1',
        date: new Date('2024-01-18'),
        duration: 45,
        outcome: 'positive' as any,
        followUpRequired: false,
        sentiment: {
          overall: 0.9,
          confidence: 0.85,
          emotions: [],
        },
        tags: ['check-in', 'progress'],
        attachments: [],
        createdAt: new Date('2024-01-18'),
      },
    ],
    aiProfile: {
      healthScore: 95,
      engagementLevel: EngagementLevel.VERY_HIGH,
      churnRisk: 0.05,
      preferences: {
        communicationFrequency: CommunicationFrequency.BI_WEEKLY,
        preferredMeetingTypes: ['review' as any, 'workshop' as any],
        decisionMakingStyle: DecisionMakingStyle.DIRECTIVE,
        responseTimeExpectation: ResponseTimeExpectation.IMMEDIATE,
        projectManagementStyle: ProjectManagementStyle.AGILE,
      },
      communicationStyle: CommunicationStyle.CASUAL,
      predictedLifetimeValue: 1200000,
      nextBestAction: {
        action: 'Propose additional services',
        reason: 'High satisfaction and growth trajectory',
        priority: ActionPriority.HIGH,
        estimatedImpact: 'Potential 30% revenue increase',
        suggestedDate: new Date('2024-02-01'),
      },
      insights: [
        {
          id: 'insight-2',
          type: 'opportunity' as any,
          title: 'High Growth Potential',
          description: 'Client is scaling rapidly and may need additional support',
          confidence: 0.9,
          actionable: true,
          createdAt: new Date('2024-01-10'),
        },
      ],
      lastAnalyzed: new Date('2024-01-19'),
    },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'client-3',
    name: 'Global Enterprises',
    contact: {
      primaryContact: {
        id: 'contact-4',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@globalenterprises.com',
        phone: '+1-555-0789',
        role: 'VP of Operations',
        department: 'Operations',
        isPrimary: true,
        preferences: {
          preferredContactMethod: ContactMethod.EMAIL,
          bestTimeToContact: [],
          timezone: 'America/Chicago',
          language: 'en',
          communicationStyle: CommunicationStyle.ANALYTICAL,
        },
      },
      additionalContacts: [],
      company: {
        legalName: 'Global Enterprises Corp',
        industry: 'Manufacturing',
        size: CompanySize.ENTERPRISE,
        website: 'https://www.globalenterprises.com',
        foundedYear: 1995,
      },
      address: {
        street: '789 Corporate Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'United States',
        type: AddressType.HEADQUARTERS,
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/company/global-enterprises',
        website: 'https://www.globalenterprises.com',
      },
    },
    relationship: {
      status: ClientStatus.PROSPECT,
      tier: ClientTier.SILVER,
      acquisitionDate: new Date('2024-01-01'),
      lastContactDate: new Date('2024-01-15'),
      totalRevenue: 0,
      averageProjectValue: 0,
      paymentTerms: {
        method: PaymentMethod.BANK_TRANSFER,
        terms: 'Net 45',
        currency: 'USD',
        paymentHistory: [],
      },
      contractDetails: {
        type: ContractType.PROJECT_BASED,
        startDate: new Date('2024-02-01'),
        terms: 'Project-based engagement with potential for ongoing work',
        value: 150000,
        status: ContractStatus.DRAFT,
      },
      satisfactionScore: 0,
      loyaltyScore: 0,
    },
    projects: [],
    interactions: [
      {
        id: 'interaction-3',
        type: 'meeting' as any,
        subject: 'Initial Consultation',
        description: 'Discussed potential collaboration and project scope',
        contactId: 'contact-4',
        userId: 'user-1',
        date: new Date('2024-01-15'),
        duration: 90,
        outcome: 'action_required' as any,
        followUpRequired: true,
        followUpDate: new Date('2024-01-22'),
        sentiment: {
          overall: 0.6,
          confidence: 0.7,
          emotions: [],
        },
        tags: ['consultation', 'prospect'],
        attachments: [],
        createdAt: new Date('2024-01-15'),
      },
    ],
    aiProfile: {
      healthScore: 60,
      engagementLevel: EngagementLevel.MEDIUM,
      churnRisk: 0.4,
      preferences: {
        communicationFrequency: CommunicationFrequency.MONTHLY,
        preferredMeetingTypes: ['presentation' as any, 'planning' as any],
        decisionMakingStyle: DecisionMakingStyle.ANALYTICAL,
        responseTimeExpectation: ResponseTimeExpectation.WITHIN_WEEK,
        projectManagementStyle: ProjectManagementStyle.WATERFALL,
      },
      communicationStyle: CommunicationStyle.ANALYTICAL,
      predictedLifetimeValue: 300000,
      nextBestAction: {
        action: 'Send detailed proposal',
        reason: 'Follow up on initial consultation',
        priority: ActionPriority.HIGH,
        estimatedImpact: 'Convert prospect to active client',
        suggestedDate: new Date('2024-01-22'),
      },
      insights: [
        {
          id: 'insight-3',
          type: 'recommendation' as any,
          title: 'Proposal Required',
          description: 'Client is evaluating options and needs detailed proposal',
          confidence: 0.8,
          actionable: true,
          createdAt: new Date('2024-01-15'),
        },
      ],
      lastAnalyzed: new Date('2024-01-16'),
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-16'),
  },
];

/**
 * Get all mock clients
 */
export function getMockClients(): Client[] {
  return mockClients;
}

/**
 * Get mock client by ID
 */
export function getMockClientById(id: string): Client | null {
  return mockClients.find(client => client.id === id) || null;
}

/**
 * Search mock clients
 */
export function searchMockClients(query: string): Client[] {
  const lowercaseQuery = query.toLowerCase();
  return mockClients.filter(client =>
    client.name.toLowerCase().includes(lowercaseQuery) ||
    client.contact.primaryContact.email.toLowerCase().includes(lowercaseQuery) ||
    client.contact.company.legalName.toLowerCase().includes(lowercaseQuery) ||
    client.contact.company.industry.toLowerCase().includes(lowercaseQuery)
  );
}