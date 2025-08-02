'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ClientForm from '@/components/clients/ClientForm';
import { Client, ContactMethod, CommunicationStyle, CompanySize, AddressType, ClientStatus, ClientTier, PaymentMethod, ContractType, ContractStatus, EngagementLevel, CommunicationFrequency, MeetingType, DecisionMakingStyle, ResponseTimeExpectation, ProjectManagementStyle, ActionPriority, InsightType, DayOfWeek } from '@/types/client';
import { CreateClientData } from '@/lib/validations/client';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        
        setClient(clientData); // set client as the flat Client type
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load client');
      }
    } catch (error) {
      console.error('Error loading client:', error);
      setError('Failed to load client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CreateClientData) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        router.push(`/dashboard/clients`);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details ? JSON.stringify(errorData.details) : (errorData.error || 'Failed to update client');
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/clients`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {error || 'Client not found'}
          </h1>
          <Button onClick={() => router.push('/dashboard/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

const mapClientToFormData = (client: Client): Partial<CreateClientData> => {
  if (!client) {
    return {};
  }

  // Map flat Client object to nested CreateClientData structure
  return {
    name: client.name || '',
    contact: {
      primaryContact: {
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        role: client.role || '',
        department: client.department || '',
        isPrimary: true, // Assuming the client has a primary contact
        preferences: {
          preferredContactMethod: client.preferredContactMethod as ContactMethod || ContactMethod.EMAIL,
          bestTimeToContact: [], // This data is not available in the flat Client model
          timezone: client.timezone || 'UTC',
          language: client.language || 'en',
          communicationStyle: client.communicationStyle as CommunicationStyle || CommunicationStyle.FORMAL,
        },
      },
      additionalContacts: [], // This data is not available in the flat Client model
      company: {
        legalName: client.companyLegalName || '',
        industry: client.industry || '',
        size: client.companySize as CompanySize || CompanySize.SMALL,
        website: client.website || '',
        taxId: client.taxId || '',
        registrationNumber: client.registrationNumber || '',
        foundedYear: client.foundedYear || undefined,
      },
      address: {
        street: client.streetAddress || '',
        city: client.city || '',
        state: client.stateProvince || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        type: AddressType.OFFICE, // Defaulting as it's not in flat Client model
      },
      socialMedia: {}, // This data is not available in the flat Client model
    },
    relationship: {
      status: client.clientStatus as ClientStatus || ClientStatus.PROSPECT,
      tier: client.clientTier as ClientTier || ClientTier.BRONZE,
      acquisitionDate: client.acquisitionDate || new Date(),
      lastContactDate: client.lastContactDate || new Date(),
      totalRevenue: client.totalRevenue || 0,
      averageProjectValue: client.averageProjectValue || 0,
      paymentTerms: {
        method: client.paymentMethod as PaymentMethod || PaymentMethod.BANK_TRANSFER,
        terms: client.paymentTerms || 'Net 30',
        currency: client.currency || 'USD',
        creditLimit: client.creditLimit || undefined,
        paymentHistory: [], // Not available in flat Client model
      },
      contractDetails: {
        type: client.contractType as ContractType || ContractType.SERVICE_AGREEMENT,
        startDate: client.contractStartDate || new Date(),
        endDate: client.contractEndDate || undefined,
        renewalDate: client.contractRenewalDate || undefined,
        terms: client.contractTerms || '',
        value: client.contractValue || 0,
        status: client.contractStatus as ContractStatus || ContractStatus.DRAFT,
      },
      satisfactionScore: client.satisfactionScore || 5,
      loyaltyScore: client.loyaltyScore || 50,
    },
    // The following fields are omitted in createClientSchema, but are on the Client model
    // projects: client.projects,
    // interactions: client.interactions,
    // aiProfile: client.aiProfile,
    // createdAt: client.createdAt,
    // updatedAt: client.updatedAt,
  };
};

return (
  <div className="container mx-auto py-6">
    {/* Navigation */}
    <Button
      variant="ghost"
      onClick={() => router.push(`/dashboard/clients`)}
      className="mb-6"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Client
    </Button>

    {/* Header */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
      <p className="text-muted-foreground">
        Update {client?.name}&#39;s information and preferences
      </p>
    </div>

    {/* Client Form */}
    <ClientForm
      initialData={mapClientToFormData(client)} // Pass mapped data here
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isSaving}
    />
  </div>
);
}
