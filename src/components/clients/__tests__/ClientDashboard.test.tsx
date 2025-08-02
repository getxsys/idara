import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientDashboard from '../ClientDashboard';
import { Client, ClientStatus, ClientTier, CompanySize, AddressType, ContactMethod, CommunicationStyle } from '@/types/client';

const mockClient: Client = {
  id: '1',
  name: 'Test Client',
  contact: {
    primaryContact: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '+1234567890',
      role: 'CEO',
      department: 'Executive',
      isPrimary: true,
      preferences: {
        preferredContactMethod: ContactMethod.EMAIL,
        bestTimeToContact: ['9:00 AM - 10:00 AM'],
        timezone: 'UTC',
        language: 'en',
        communicationStyle: CommunicationStyle.PROFESSIONAL,
      },
    },
    additionalContacts: [],
    company: {
      legalName: 'Test Company Inc.',
      industry: 'Technology',
      size: CompanySize.MEDIUM,
      website: 'https://test.com',
      taxId: '123456789',
      registrationNumber: 'REG123',
      foundedYear: 2020,
    },
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      type: AddressType.OFFICE,
    },
    socialMedia: {},
  },
  relationship: {
    status: ClientStatus.ACTIVE,
    tier: ClientTier.GOLD,
    acquisitionDate: new Date('2023-01-01'),
    lastContactDate: new Date('2024-01-01'),
    totalRevenue: 100000,
    averageProjectValue: 25000,
    paymentTerms: {
      method: 'bank_transfer' as any,
      terms: 'Net 30',
      currency: 'USD',
      paymentHistory: [],
    },
    contractDetails: {
      type: 'service_agreement' as any,
      startDate: new Date(),
      terms: 'Standard service agreement',
      value: 100000,
      status: 'active' as any,
    },
    satisfactionScore: 8,
    loyaltyScore: 75,
  },
  projects: [
    {
      id: 'project-1',
      name: 'Test Project',
      description: 'A test project',
      status: 'active' as any,
      startDate: new Date(),
      endDate: new Date(),
      budget: 50000,
      clientId: '1',
      teamMembers: [],
      tasks: [],
      milestones: [],
      risks: [],
      resources: [],
      timeline: {
        phases: [],
        milestones: [],
        dependencies: [],
      },
      aiInsights: {
        healthScore: 85,
        riskLevel: 'low' as any,
        completionPrediction: new Date(),
        recommendations: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  interactions: [
    {
      id: 'interaction-1',
      type: 'email' as any,
      subject: 'Test Email',
      description: 'A test email interaction',
      contactId: 'contact-1',
      userId: 'user-1',
      date: new Date('2024-01-01'),
      duration: 30,
      outcome: 'positive' as any,
      followUpRequired: false,
      sentiment: {
        overall: 0.8,
        confidence: 0.9,
        emotions: ['positive'],
      },
      tags: ['important'],
      attachments: [],
      createdAt: new Date(),
    },
  ],
  aiProfile: {
    healthScore: 85,
    engagementLevel: 'high' as any,
    churnRisk: 0.2,
    preferences: {
      communicationFrequency: 'weekly' as any,
      decisionMakingStyle: 'collaborative' as any,
      responseTimeExpectation: 'same_day' as any,
      projectManagementStyle: 'agile' as any,
    },
    insights: [
      {
        id: 'insight-1',
        type: 'opportunity',
        title: 'Upselling Opportunity',
        description: 'Client shows high engagement and satisfaction',
        confidence: 0.85,
        actionable: true,
        createdAt: new Date(),
      },
      {
        id: 'insight-2',
        type: 'recommendation',
        title: 'Schedule Review Meeting',
        description: 'Regular check-in recommended based on communication patterns',
        confidence: 0.75,
        actionable: true,
        createdAt: new Date(),
      },
    ],
    nextBestAction: {
      action: 'Schedule quarterly review',
      reason: 'High engagement client ready for expansion',
      priority: 'medium' as any,
      estimatedImpact: 'Potential 25% revenue increase',
      suggestedDate: new Date('2024-02-01'),
    },
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockProps = {
  client: mockClient,
  onClientUpdate: jest.fn(),
};

describe('ClientDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders client header information', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Test Company Inc. • Technology')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('displays key metrics cards', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('Health Score')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    expect(screen.getByText('Engagement Level')).toBeInTheDocument();
    expect(screen.getByText('Churn Risk')).toBeInTheDocument();
  });

  it('shows AI insights when available', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Upselling Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Schedule Review Meeting')).toBeInTheDocument();
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
    expect(screen.getByText('75% confidence')).toBeInTheDocument();
  });

  it('displays next best action', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('Next Best Action')).toBeInTheDocument();
    expect(screen.getByText('Schedule quarterly review')).toBeInTheDocument();
    expect(screen.getByText('High engagement client ready for expansion')).toBeInTheDocument();
    expect(screen.getByText('Potential 25% revenue increase')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM Priority')).toBeInTheDocument();
  });

  it('renders all tab options', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Interactions')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<ClientDashboard {...mockProps} />);
    
    // Click on Engagement tab
    const engagementTab = screen.getByText('Engagement');
    await user.click(engagementTab);
    
    // Should show engagement metrics (this would depend on ClientEngagementMetrics component)
    expect(engagementTab).toHaveAttribute('data-state', 'active');
  });

  it('displays contact information in overview tab', () => {
    render(<ClientDashboard {...mockProps} />);
    
    // Should be in overview tab by default
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('displays relationship details in overview tab', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('Relationship Details')).toBeInTheDocument();
    expect(screen.getByText('Acquisition Date')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction Score')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('Loyalty Score')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows correct health score color coding', () => {
    render(<ClientDashboard {...mockProps} />);
    
    const healthScore = screen.getByText('85/100');
    expect(healthScore).toHaveClass('text-green-600'); // High score should be green
  });

  it('shows correct churn risk level', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('Low')).toBeInTheDocument(); // 0.2 risk should be "Low"
    expect(screen.getByText('20.0% risk')).toBeInTheDocument();
  });

  it('displays engagement level badge correctly', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('VERY HIGH')).toBeInTheDocument(); // "high" should display as "VERY HIGH"
  });

  it('formats dates correctly', () => {
    render(<ClientDashboard {...mockProps} />);
    
    // Check if dates are formatted properly (this would depend on the exact format used)
    expect(screen.getByText(/January 1, 2023/)).toBeInTheDocument(); // Acquisition date
    expect(screen.getByText(/January 1, 2024/)).toBeInTheDocument(); // Last contact date
  });

  it('formats currency correctly', () => {
    render(<ClientDashboard {...mockProps} />);
    
    expect(screen.getByText('$100,000.00')).toBeInTheDocument(); // Total revenue
    expect(screen.getByText('Avg: $25,000.00')).toBeInTheDocument(); // Average project value
  });

  it('shows correct priority badge color for next best action', () => {
    render(<ClientDashboard {...mockProps} />);
    
    const priorityBadge = screen.getByText('MEDIUM Priority');
    expect(priorityBadge).toHaveClass('bg-secondary'); // Medium priority should have secondary variant
  });

  it('handles client with no insights gracefully', () => {
    const clientWithoutInsights = {
      ...mockClient,
      aiProfile: {
        ...mockClient.aiProfile,
        insights: [],
      },
    };

    render(<ClientDashboard client={clientWithoutInsights} onClientUpdate={mockProps.onClientUpdate} />);
    
    // AI Insights section should not be rendered when there are no insights
    expect(screen.queryByText('AI Insights')).not.toBeInTheDocument();
  });

  it('handles client with no projects', () => {
    const clientWithoutProjects = {
      ...mockClient,
      projects: [],
    };

    render(<ClientDashboard client={clientWithoutProjects} onClientUpdate={mockProps.onClientUpdate} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Active Projects count should be 0
  });

  it('shows actionable badge for actionable insights', () => {
    render(<ClientDashboard {...mockProps} />);
    
    const actionableBadges = screen.getAllByText('Actionable');
    expect(actionableBadges).toHaveLength(2); // Both insights are actionable
  });
});