'use client';

import React from 'react';
import { ClientAnalytics } from '../../../components/clients/ClientAnalytics';
import { Client, ClientStatus, EngagementLevel, InteractionType, InteractionOutcome, CompanySize, ActionPriority } from '../../../types/client';

// Mock client data for demonstration
const mockClient: Client = {
  id: 'demo-client-1',
  name: 'TechCorp Solutions',
  contact: {
    primaryContact: {
      id: 'contact-1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1-555-0123',
      role: 'CTO',
      isPrimary: true,
      preferences: {
        preferredContactMethod: 'email' as any,
        bestTimeToContact: [],
        timezone: 'EST',
        language: 'en',
        communicationStyle: 'professional' as any,
      },
    },
    additionalContacts: [],
    company: {
      legalName: 'TechCorp Solutions Inc.',
      industry: 'technology',
      size: CompanySize.LARGE,
      website: 'https://techcorp.com',
      foundedYear: 2015,
    },
    address: {
      street: '123 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US',
      type: 'headquarters' as any,
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/techcorp',
      website: 'https://techcorp.com',
    },
  },
  relationship: {
    status: ClientStatus.ACTIVE,
    tier: 'gold' as any,
    acquisitionDate: new Date('2022-03-15'),
    lastContactDate: new Date('2024-01-20'),
    totalRevenue: 250000,
    averageProjectValue: 50000,
    paymentTerms: {
      method: 'bank_transfer' as any,
      terms: 'Net 30',
      currency: 'USD',
      paymentHistory: [
        {
          invoiceId: 'INV-2024-001',
          amount: 50000,
          dueDate: new Date('2024-01-01'),
          paidDate: new Date('2024-01-02'),
          status: 'paid' as any,
        },
        {
          invoiceId: 'INV-2024-002',
          amount: 75000,
          dueDate: new Date('2024-02-01'),
          paidDate: new Date('2024-01-30'),
          status: 'paid' as any,
        },
      ],
    },
    contractDetails: {
      type: 'service_agreement' as any,
      startDate: new Date('2022-03-15'),
      endDate: new Date('2025-03-15'),
      renewalDate: new Date('2025-01-15'),
      terms: 'Multi-year service agreement with annual renewal option',
      value: 300000,
      status: 'active' as any,
    },
    satisfactionScore: 9,
    loyaltyScore: 88,
  },
  projects: [],
  interactions: [
    {
      id: 'int-1',
      type: InteractionType.VIDEO_CALL,
      subject: 'Q4 Strategy Review',
      description: 'Discussed upcoming projects and strategic initiatives for Q4',
      contactId: 'contact-1',
      userId: 'user-1',
      date: new Date('2024-01-18'),
      duration: 60,
      outcome: InteractionOutcome.POSITIVE,
      followUpRequired: false,
      sentiment: {
        overall: 0.8,
        confidence: 0.9,
        emotions: [
          { emotion: 'satisfaction', score: 0.8 },
          { emotion: 'enthusiasm', score: 0.7 },
        ],
      },
      tags: ['strategy', 'planning', 'q4'],
      attachments: [],
      createdAt: new Date('2024-01-18'),
    },
    {
      id: 'int-2',
      type: InteractionType.EMAIL,
      subject: 'Project Proposal Follow-up',
      description: 'Sent detailed proposal for new AI integration project',
      contactId: 'contact-1',
      userId: 'user-1',
      date: new Date('2024-01-15'),
      outcome: InteractionOutcome.FOLLOW_UP_SCHEDULED,
      followUpRequired: true,
      followUpDate: new Date('2024-01-25'),
      sentiment: {
        overall: 0.6,
        confidence: 0.8,
        emotions: [
          { emotion: 'interest', score: 0.7 },
          { emotion: 'curiosity', score: 0.6 },
        ],
      },
      tags: ['proposal', 'ai', 'integration'],
      attachments: ['proposal-ai-integration-v2.pdf'],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'int-3',
      type: InteractionType.MEETING,
      subject: 'Monthly Check-in',
      description: 'Regular monthly status meeting to review ongoing projects',
      contactId: 'contact-1',
      userId: 'user-1',
      date: new Date('2024-01-10'),
      duration: 45,
      outcome: InteractionOutcome.POSITIVE,
      followUpRequired: false,
      sentiment: {
        overall: 0.7,
        confidence: 0.85,
        emotions: [
          { emotion: 'satisfaction', score: 0.7 },
          { emotion: 'confidence', score: 0.8 },
        ],
      },
      tags: ['check-in', 'status', 'monthly'],
      attachments: [],
      createdAt: new Date('2024-01-10'),
    },
  ],
  aiProfile: {
    healthScore: 85,
    engagementLevel: EngagementLevel.HIGH,
    churnRisk: 0.15,
    preferences: {
      communicationFrequency: 'bi_weekly' as any,
      preferredMeetingTypes: ['status_update', 'planning', 'review'],
      decisionMakingStyle: 'analytical' as any,
      responseTimeExpectation: 'same_day' as any,
      projectManagementStyle: 'agile' as any,
    },
    communicationStyle: 'professional' as any,
    predictedLifetimeValue: 500000,
    nextBestAction: {
      action: 'Present AI integration proposal',
      reason: 'High engagement and expressed interest in AI solutions',
      priority: ActionPriority.HIGH,
      estimatedImpact: 'High - potential $100k+ project',
      suggestedDate: new Date('2024-01-25'),
    },
    insights: [
      {
        id: 'insight-1',
        type: 'opportunity' as any,
        title: 'AI Integration Opportunity',
        description: 'Client has shown strong interest in AI solutions and has budget allocated for Q2',
        confidence: 0.85,
        actionable: true,
        createdAt: new Date('2024-01-20'),
      },
      {
        id: 'insight-2',
        type: 'trend' as any,
        title: 'Increasing Engagement',
        description: 'Client engagement has increased 40% over the past quarter',
        confidence: 0.9,
        actionable: false,
        createdAt: new Date('2024-01-20'),
      },
    ],
    lastAnalyzed: new Date('2024-01-20'),
  },
  createdAt: new Date('2022-03-15'),
  updatedAt: new Date('2024-01-20'),
};

export default function ClientAnalyticsDemo() {
  const handleActionClick = (action: string) => {
    alert(`Action clicked: ${action}\n\nIn a real application, this would trigger the appropriate workflow or navigation.`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Client Analytics Demo</h1>
        <p className="text-muted-foreground">
          This demo showcases the AI-powered client analytics system with predictive insights,
          health scoring, churn prediction, and personalized communication suggestions.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <ClientAnalytics 
          client={mockClient} 
          onActionClick={handleActionClick}
        />
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Demo Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">✅ Implemented Features:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Client health scoring with trend analysis</li>
              <li>• Churn risk prediction with retention strategies</li>
              <li>• Lead scoring for prospect prioritization</li>
              <li>• AI-powered communication suggestions</li>
              <li>• Intelligent insights and recommendations</li>
              <li>• Next best action prioritization</li>
              <li>• Comprehensive test coverage (38 tests)</li>
              <li>• Integration with client management system</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">🔧 Technical Implementation:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• TypeScript with comprehensive type definitions</li>
              <li>• Modular service architecture</li>
              <li>• React components with Tailwind CSS</li>
              <li>• Radix UI for accessible components</li>
              <li>• Jest testing with mocks and fixtures</li>
              <li>• Database integration layer</li>
              <li>• Batch processing capabilities</li>
              <li>• Error handling and validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}