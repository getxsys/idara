import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientAnalytics } from '../ClientAnalytics';
import { Client, ClientStatus, EngagementLevel, InteractionType, InteractionOutcome, CompanySize, ActionPriority } from '../../../types/client';

// Mock the ClientAnalyticsService
jest.mock('../../../lib/services/client-analytics', () => ({
  ClientAnalyticsService: jest.fn().mockImplementation(() => ({
    generateClientAnalytics: jest.fn().mockReturnValue({
      healthScore: {
        overall: 75,
        factors: {
          engagement: 80,
          financial: 70,
          communication: 75,
          satisfaction: 80,
          loyalty: 85,
        },
        trend: 'improving',
        lastUpdated: new Date('2024-01-15'),
      },
      churnPrediction: {
        riskScore: 0.3,
        confidence: 0.8,
        riskFactors: [
          {
            factor: 'Low Engagement',
            impact: 0.4,
            description: 'No contact for 15 days',
          },
        ],
        retentionStrategies: [
          {
            strategy: 'Proactive Outreach',
            description: 'Schedule regular check-ins',
            priority: ActionPriority.HIGH,
            estimatedEffectiveness: 0.7,
            estimatedCost: 'low',
            timeline: '1-2 weeks',
          },
        ],
        timeToChurn: 60,
        lastUpdated: new Date('2024-01-15'),
      },
      leadScore: null,
      communicationSuggestions: [
        {
          type: 'email',
          subject: 'Check-in with Test Company',
          content: 'Hi John, I wanted to check in...',
          timing: new Date('2024-01-16'),
          priority: ActionPriority.MEDIUM,
          expectedOutcome: 'Re-engage client',
          personalizationFactors: ['company_updates'],
        },
      ],
      insights: [
        {
          id: 'insight-1',
          type: 'opportunity',
          title: 'Upsell Opportunity',
          description: 'Client is ready for additional services',
          confidence: 0.8,
          actionable: true,
          createdAt: new Date('2024-01-15'),
        },
      ],
      nextBestActions: [
        {
          action: 'Schedule quarterly review',
          reason: 'Maintain relationship',
          priority: ActionPriority.HIGH,
          estimatedImpact: 'High - strengthen relationship',
          suggestedDate: new Date('2024-02-01'),
        },
      ],
    }),
  })),
}));

const mockClient: Client = {
  id: 'client-1',
  name: 'Test Company',
  contact: {
    primaryContact: {
      id: 'contact-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@testcompany.com',
      phone: '+1234567890',
      role: 'CEO',
      isPrimary: true,
      preferences: {
        preferredContactMethod: 'email' as any,
        bestTimeToContact: [],
        timezone: 'UTC',
        language: 'en',
        communicationStyle: 'professional' as any,
      },
    },
    additionalContacts: [],
    company: {
      legalName: 'Test Company Inc.',
      industry: 'technology',
      size: CompanySize.MEDIUM,
      website: 'https://testcompany.com',
    },
    address: {
      street: '123 Main St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      type: 'office' as any,
    },
    socialMedia: {},
  },
  relationship: {
    status: ClientStatus.ACTIVE,
    tier: 'gold' as any,
    acquisitionDate: new Date('2023-01-01'),
    lastContactDate: new Date('2024-01-15'),
    totalRevenue: 75000,
    averageProjectValue: 25000,
    paymentTerms: {
      method: 'bank_transfer' as any,
      terms: 'Net 30',
      currency: 'USD',
      paymentHistory: [],
    },
    contractDetails: {
      type: 'service_agreement' as any,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-12-31'),
      terms: 'Annual service agreement',
      value: 100000,
      status: 'active' as any,
    },
    satisfactionScore: 8,
    loyaltyScore: 85,
  },
  projects: [],
  interactions: [],
  aiProfile: {
    healthScore: 75,
    engagementLevel: EngagementLevel.HIGH,
    churnRisk: 0.2,
    preferences: {
      communicationFrequency: 'weekly' as any,
      preferredMeetingTypes: [],
      decisionMakingStyle: 'analytical' as any,
      responseTimeExpectation: 'same_day' as any,
      projectManagementStyle: 'agile' as any,
    },
    communicationStyle: 'professional' as any,
    predictedLifetimeValue: 200000,
    nextBestAction: {
      action: 'Schedule quarterly review',
      reason: 'Maintain relationship',
      priority: ActionPriority.MEDIUM,
      estimatedImpact: 'Medium',
      suggestedDate: new Date('2024-02-01'),
    },
    insights: [],
    lastAnalyzed: new Date('2024-01-15'),
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('ClientAnalytics', () => {
  const mockOnActionClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    expect(screen.getByText('Client Analytics')).toBeInTheDocument();
    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders analytics data after loading', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Client Analytics')).toBeInTheDocument();
      expect(screen.getByText('AI-powered insights for Test Company')).toBeInTheDocument();
    });

    // Check key metrics
    expect(screen.getByText('75')).toBeInTheDocument(); // Health score
    expect(screen.getByText('30%')).toBeInTheDocument(); // Churn risk (0.3 * 100)
    expect(screen.getByText('1')).toBeInTheDocument(); // Actions pending
  });

  it('displays health score breakdown', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Check that health factors are displayed
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Financial')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
    expect(screen.getByText('Loyalty')).toBeInTheDocument();
  });

  it('displays churn risk factors and retention strategies', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Click on churn tab
    fireEvent.click(screen.getByText('Churn Risk'));

    await waitFor(() => {
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
      expect(screen.getByText('Retention Strategies')).toBeInTheDocument();
    });

    expect(screen.getByText('Low Engagement')).toBeInTheDocument();
    expect(screen.getByText('Proactive Outreach')).toBeInTheDocument();
  });

  it('displays communication suggestions', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Click on communication tab
    fireEvent.click(screen.getByText('Communication'));

    await waitFor(() => {
      expect(screen.getByText('Communication Suggestions')).toBeInTheDocument();
    });

    expect(screen.getByText('Check-in with Test Company')).toBeInTheDocument();
    expect(screen.getByText('Re-engage client')).toBeInTheDocument();
  });

  it('displays insights and next best actions', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Click on insights tab
    fireEvent.click(screen.getByText('Insights'));

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
      expect(screen.getByText('Next Best Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('Upsell Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Schedule quarterly review')).toBeInTheDocument();
  });

  it('calls onActionClick when action buttons are clicked', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Click on communication tab
    fireEvent.click(screen.getByText('Communication'));

    await waitFor(() => {
      expect(screen.getByText('Take Action')).toBeInTheDocument();
    });

    // Click the action button
    fireEvent.click(screen.getByText('Take Action'));

    expect(mockOnActionClick).toHaveBeenCalledWith('Check-in with Test Company');
  });

  it('handles prospect clients with lead scoring', async () => {
    const prospectClient = {
      ...mockClient,
      relationship: {
        ...mockClient.relationship,
        status: ClientStatus.PROSPECT,
      },
    };

    // Mock lead score for prospect
    const mockAnalyticsService = require('../../../lib/services/client-analytics').ClientAnalyticsService;
    mockAnalyticsService.mockImplementation(() => ({
      generateClientAnalytics: jest.fn().mockReturnValue({
        healthScore: {
          overall: 75,
          factors: {
            engagement: 80,
            financial: 70,
            communication: 75,
            satisfaction: 80,
            loyalty: 85,
          },
          trend: 'improving',
          lastUpdated: new Date('2024-01-15'),
        },
        churnPrediction: {
          riskScore: 0.3,
          confidence: 0.8,
          riskFactors: [],
          retentionStrategies: [],
          lastUpdated: new Date('2024-01-15'),
        },
        leadScore: {
          score: 85,
          grade: 'A',
          conversionProbability: 0.8,
          factors: [
            {
              factor: 'Company Size',
              weight: 0.25,
              score: 80,
              description: 'Medium company',
            },
          ],
          priority: ActionPriority.HIGH,
          lastUpdated: new Date('2024-01-15'),
        },
        communicationSuggestions: [],
        insights: [],
        nextBestActions: [],
      }),
    }));

    render(<ClientAnalytics client={prospectClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lead Score')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  it('handles empty states gracefully', async () => {
    // Mock empty analytics
    const mockAnalyticsService = require('../../../lib/services/client-analytics').ClientAnalyticsService;
    mockAnalyticsService.mockImplementation(() => ({
      generateClientAnalytics: jest.fn().mockReturnValue({
        healthScore: {
          overall: 50,
          factors: {
            engagement: 50,
            financial: 50,
            communication: 50,
            satisfaction: 50,
            loyalty: 50,
          },
          trend: 'stable',
          lastUpdated: new Date('2024-01-15'),
        },
        churnPrediction: {
          riskScore: 0.1,
          confidence: 0.5,
          riskFactors: [],
          retentionStrategies: [],
          lastUpdated: new Date('2024-01-15'),
        },
        leadScore: null,
        communicationSuggestions: [],
        insights: [],
        nextBestActions: [],
      }),
    }));

    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Check empty states
    fireEvent.click(screen.getByText('Churn Risk'));
    await waitFor(() => {
      expect(screen.getByText('No significant risk factors identified')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Communication'));
    await waitFor(() => {
      expect(screen.getByText('No communication suggestions at this time')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Insights'));
    await waitFor(() => {
      expect(screen.getByText('No insights available at this time')).toBeInTheDocument();
    });
  });

  it('displays correct priority colors and badges', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Score Breakdown')).toBeInTheDocument();
    });

    // Check that priority badges are displayed
    const highPriorityBadges = screen.getAllByText('high');
    expect(highPriorityBadges.length).toBeGreaterThan(0);

    const mediumPriorityBadges = screen.getAllByText('medium');
    expect(mediumPriorityBadges.length).toBeGreaterThan(0);
  });

  it('formats dates correctly', async () => {
    render(<ClientAnalytics client={mockClient} onActionClick={mockOnActionClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('Last updated: 1/15/2024')).toBeInTheDocument();
    });
  });
});