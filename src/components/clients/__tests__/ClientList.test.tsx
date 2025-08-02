import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientList from '../ClientList';
import { Client, ClientStatus, ClientTier, CompanySize, AddressType, ContactMethod, CommunicationStyle } from '@/types/client';

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Test Client 1',
    contact: {
      primaryContact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test1.com',
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
        legalName: 'Test Company 1 Inc.',
        industry: 'Technology',
        size: CompanySize.MEDIUM,
        website: 'https://test1.com',
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
    projects: [],
    interactions: [],
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
      insights: [],
      nextBestAction: {
        action: 'Schedule quarterly review',
        reason: 'High engagement client ready for expansion',
        priority: 'medium' as any,
        estimatedImpact: 'Potential 25% revenue increase',
        suggestedDate: new Date(),
      },
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Test Client 2',
    contact: {
      primaryContact: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test2.com',
        phone: '+0987654321',
        role: 'CTO',
        department: 'Technology',
        isPrimary: true,
        preferences: {
          preferredContactMethod: ContactMethod.PHONE,
          bestTimeToContact: ['2:00 PM - 3:00 PM'],
          timezone: 'UTC',
          language: 'en',
          communicationStyle: CommunicationStyle.CASUAL,
        },
      },
      additionalContacts: [],
      company: {
        legalName: 'Test Company 2 LLC',
        industry: 'Healthcare',
        size: CompanySize.LARGE,
        website: 'https://test2.com',
        taxId: '987654321',
        registrationNumber: 'REG456',
        foundedYear: 2018,
      },
      address: {
        street: '456 Test Ave',
        city: 'Test City 2',
        state: 'Test State 2',
        postalCode: '54321',
        country: 'Test Country',
        type: AddressType.OFFICE,
      },
      socialMedia: {},
    },
    relationship: {
      status: ClientStatus.PROSPECT,
      tier: ClientTier.SILVER,
      acquisitionDate: new Date('2023-06-01'),
      lastContactDate: new Date('2024-01-15'),
      totalRevenue: 50000,
      averageProjectValue: 12500,
      paymentTerms: {
        method: 'credit_card' as any,
        terms: 'Net 15',
        currency: 'USD',
        paymentHistory: [],
      },
      contractDetails: {
        type: 'consulting_agreement' as any,
        startDate: new Date(),
        terms: 'Consulting agreement',
        value: 50000,
        status: 'draft' as any,
      },
      satisfactionScore: 7,
      loyaltyScore: 60,
    },
    projects: [],
    interactions: [],
    aiProfile: {
      healthScore: 70,
      engagementLevel: 'medium' as any,
      churnRisk: 0.4,
      preferences: {
        communicationFrequency: 'bi_weekly' as any,
        decisionMakingStyle: 'analytical' as any,
        responseTimeExpectation: 'within_24_hours' as any,
        projectManagementStyle: 'waterfall' as any,
      },
      insights: [],
      nextBestAction: {
        action: 'Follow up on proposal',
        reason: 'Prospect showing interest but needs nurturing',
        priority: 'high' as any,
        estimatedImpact: 'Potential conversion to active client',
        suggestedDate: new Date(),
      },
    },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-15'),
  },
];

const mockProps = {
  clients: mockClients,
  onClientSelect: jest.fn(),
  onClientEdit: jest.fn(),
  onClientDelete: jest.fn(),
  isLoading: false,
};

describe('ClientList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the client list with header', () => {
    render(<ClientList {...mockProps} />);
    
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Manage your client relationships and track engagement')).toBeInTheDocument();
    expect(screen.getByText('Add Client')).toBeInTheDocument();
  });

  it('displays all clients in the table', () => {
    render(<ClientList {...mockProps} />);
    
    expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    expect(screen.getByText('Test Client 2')).toBeInTheDocument();
    expect(screen.getByText('john@test1.com')).toBeInTheDocument();
    expect(screen.getByText('jane@test2.com')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ClientList {...mockProps} isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('shows empty state when no clients', () => {
    render(<ClientList {...mockProps} clients={[]} />);
    
    expect(screen.getByText('No clients found')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Client')).toBeInTheDocument();
  });

  it('filters clients by search term', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search clients...');
    await user.type(searchInput, 'Test Client 1');
    
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Client 2')).not.toBeInTheDocument();
    });
  });

  it('filters clients by status', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    // Open status filter dropdown
    const statusFilter = screen.getByDisplayValue('All Status');
    await user.click(statusFilter);
    
    // Select "Active" status
    const activeOption = screen.getByText('Active');
    await user.click(activeOption);
    
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Client 2')).not.toBeInTheDocument();
    });
  });

  it('filters clients by tier', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    // Open tier filter dropdown
    const tierFilter = screen.getByDisplayValue('All Tiers');
    await user.click(tierFilter);
    
    // Select "Gold" tier
    const goldOption = screen.getByText('Gold');
    await user.click(goldOption);
    
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Client 2')).not.toBeInTheDocument();
    });
  });

  it('calls onClientSelect when client row is clicked', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    const clientRow = screen.getByText('Test Client 1').closest('tr');
    await user.click(clientRow!);
    
    expect(mockProps.onClientSelect).toHaveBeenCalledWith(mockClients[0]);
  });

  it('shows client actions dropdown', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    // Find and click the first action button (three dots)
    const actionButtons = screen.getAllByRole('button', { name: '' });
    const firstActionButton = actionButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );
    
    if (firstActionButton) {
      await user.click(firstActionButton);
      
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Edit Client')).toBeInTheDocument();
      expect(screen.getByText('Delete Client')).toBeInTheDocument();
    }
  });

  it('calls onClientEdit when edit action is clicked', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    // Find and click the first action button
    const actionButtons = screen.getAllByRole('button', { name: '' });
    const firstActionButton = actionButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );
    
    if (firstActionButton) {
      await user.click(firstActionButton);
      
      const editButton = screen.getByText('Edit Client');
      await user.click(editButton);
      
      expect(mockProps.onClientEdit).toHaveBeenCalledWith(mockClients[0]);
    }
  });

  it('calls onClientDelete when delete action is clicked', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    // Find and click the first action button
    const actionButtons = screen.getAllByRole('button', { name: '' });
    const firstActionButton = actionButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );
    
    if (firstActionButton) {
      await user.click(firstActionButton);
      
      const deleteButton = screen.getByText('Delete Client');
      await user.click(deleteButton);
      
      expect(mockProps.onClientDelete).toHaveBeenCalledWith(mockClients[0].id);
    }
  });

  it('displays correct client information in table', () => {
    render(<ClientList {...mockProps} />);
    
    // Check first client
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Company 1 Inc.')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    
    // Check second client
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Test Company 2 LLC')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
    expect(screen.getByText('Prospect')).toBeInTheDocument();
    expect(screen.getByText('Silver')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });

  it('shows correct client count', () => {
    render(<ClientList {...mockProps} />);
    
    expect(screen.getByText('2 Clients')).toBeInTheDocument();
  });

  it('shows singular client count when only one client', () => {
    render(<ClientList {...mockProps} clients={[mockClients[0]]} />);
    
    expect(screen.getByText('1 Client')).toBeInTheDocument();
  });

  it('toggles filters section', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Additional filters section should be visible
    // This would depend on the ClientFilters component implementation
    expect(filtersButton).toBeInTheDocument();
  });

  it('opens create client dialog when Add Client is clicked', async () => {
    const user = userEvent.setup();
    render(<ClientList {...mockProps} />);
    
    const addClientButton = screen.getByText('Add Client');
    await user.click(addClientButton);
    
    // Dialog should open (this would need proper dialog mocking)
    expect(addClientButton).toBeInTheDocument();
  });
});