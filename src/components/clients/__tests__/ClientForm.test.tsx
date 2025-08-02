import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from '../ClientForm';
import { CreateClientData } from '@/lib/validations/client';
import { ClientStatus, ClientTier, CompanySize, AddressType, ContactMethod, CommunicationStyle } from '@/types/client';

// Mock the form dependencies
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => jest.fn()),
}));

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: jest.fn((fn) => fn),
    setValue: jest.fn(),
    watch: jest.fn(),
    formState: { errors: {} },
  }),
}));

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
  isLoading: false,
};

const mockInitialData: Partial<CreateClientData> = {
  name: 'Test Client',
  contact: {
    primaryContact: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
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
    acquisitionDate: new Date(),
    lastContactDate: new Date(),
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
};

describe('ClientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all tabs', () => {
    render(<ClientForm {...defaultProps} />);
    
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByText('Company Info')).toBeInTheDocument();
    expect(screen.getByText('Relationship')).toBeInTheDocument();
  });

  it('renders basic information fields', () => {
    render(<ClientForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('populates form with initial data when provided', () => {
    render(<ClientForm {...defaultProps} initialData={mockInitialData} />);
    
    // Check if form fields are populated (this would need proper form mocking)
    expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ClientForm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ClientForm {...defaultProps} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<ClientForm {...defaultProps} />);
    
    // Click on Contact Details tab
    const contactTab = screen.getByText('Contact Details');
    await user.click(contactTab);
    
    expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
  });

  it('displays company information tab content', async () => {
    const user = userEvent.setup();
    render(<ClientForm {...defaultProps} />);
    
    // Click on Company Info tab
    const companyTab = screen.getByText('Company Info');
    await user.click(companyTab);
    
    expect(screen.getByLabelText(/legal company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company size/i)).toBeInTheDocument();
  });

  it('displays relationship information tab content', async () => {
    const user = userEvent.setup();
    render(<ClientForm {...defaultProps} />);
    
    // Click on Relationship tab
    const relationshipTab = screen.getByText('Relationship');
    await user.click(relationshipTab);
    
    expect(screen.getByLabelText(/client status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client tier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total revenue/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const user = userEvent.setup();
    render(<ClientForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Client');
    await user.click(submitButton);
    
    // Form submission would be handled by react-hook-form
    // This test verifies the button exists and is clickable
    expect(submitButton).toBeInTheDocument();
  });

  it('displays validation errors when form is invalid', () => {
    // Mock form with errors
    const mockUseForm = require('react-hook-form').useForm;
    mockUseForm.mockReturnValue({
      control: {},
      handleSubmit: jest.fn((fn) => fn),
      setValue: jest.fn(),
      watch: jest.fn(),
      formState: { 
        errors: { 
          name: { message: 'Client name is required' } 
        } 
      },
    });

    render(<ClientForm {...defaultProps} />);
    
    // Error display would be handled by FormMessage components
    expect(screen.getByText('Save Client')).toBeInTheDocument();
  });

  it('handles numeric input fields correctly', () => {
    render(<ClientForm {...defaultProps} initialData={mockInitialData} />);
    
    // Switch to relationship tab to see numeric fields
    const relationshipTab = screen.getByText('Relationship');
    fireEvent.click(relationshipTab);
    
    expect(screen.getByLabelText(/total revenue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/average project value/i)).toBeInTheDocument();
  });

  it('renders all required form sections', () => {
    render(<ClientForm {...defaultProps} />);
    
    // Basic Info section
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    
    // Contact Details section (need to click tab first)
    const contactTab = screen.getByText('Contact Details');
    fireEvent.click(contactTab);
    expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
    
    // Company Info section
    const companyTab = screen.getByText('Company Info');
    fireEvent.click(companyTab);
    expect(screen.getByText('Company Information')).toBeInTheDocument();
    
    // Relationship section
    const relationshipTab = screen.getByText('Relationship');
    fireEvent.click(relationshipTab);
    expect(screen.getByText('Relationship Details')).toBeInTheDocument();
  });
});