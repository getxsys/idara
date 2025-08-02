import { Client as PrismaClient } from '../../generated/prisma';
import { Client, ClientStatus, ClientTier, ContactMethod, CommunicationStyle, CompanySize, AddressType, PaymentMethod, PaymentStatus, ContractType, ContractStatus, EngagementLevel, CommunicationFrequency, DecisionMakingStyle, ResponseTimeExpectation, ProjectManagementStyle, ActionPriority } from '@/types/client';
import { clientRepository } from '@/lib/database/repository/client';
import { getMockClients, getMockClientById, searchMockClients } from './mock-client-data';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { CreateClientData } from '@/lib/validations/client';
// import { SupabaseClientService } from './supabase-client-service';

/**
 * Service to handle client data transformation and business logic
 * This bridges the gap between the simple Prisma model and complex Client types
 */
export class ClientService {
  /**
   * Transform a Prisma Client to our complex Client type
   */
  static transformPrismaClientToClient(prismaClient: PrismaClient): Client {
    // Parse AI profile if it exists
    let aiProfile;
    try {
      aiProfile = prismaClient.aiProfile ? JSON.parse(prismaClient.aiProfile as string) : null;
    } catch (error) {
      console.warn('Failed to parse AI profile for client:', prismaClient.id);
      aiProfile = null;
    }

    // Create a mock client structure based on available data
    const client: Client = {
      id: prismaClient.id,
      name: prismaClient.name,
      contact: {
        primaryContact: {
          id: `${prismaClient.id}-primary`,
          firstName: this.extractFirstName(prismaClient.name),
          lastName: this.extractLastName(prismaClient.name),
          email: prismaClient.email || 'no-email@example.com',
          phone: prismaClient.phone || '+1-000-000-0000',
          role: 'Primary Contact',
          department: 'General',
          isPrimary: true,
          preferences: {
            preferredContactMethod: ContactMethod.EMAIL,
            bestTimeToContact: [],
            timezone: 'America/New_York',
            language: 'en',
            communicationStyle: aiProfile?.preferences?.communicationStyle === 'formal' 
              ? CommunicationStyle.FORMAL 
              : CommunicationStyle.CASUAL,
          },
        },
        additionalContacts: [],
        company: {
          legalName: prismaClient.company || prismaClient.name,
          industry: 'Technology', // Default industry
          size: CompanySize.MEDIUM,
          website: `https://www.${prismaClient.name.toLowerCase().replace(/\s+/g, '')}.com`,
        },
        address: {
          street: prismaClient.address || '123 Business Street',
          city: 'Business City',
          state: 'BC',
          postalCode: '12345',
          country: 'United States',
          type: AddressType.OFFICE,
        },
        socialMedia: {},
      },
      relationship: {
        status: ClientStatus.ACTIVE, // Default to active
        tier: this.determineTier(aiProfile?.healthScore || 75),
        acquisitionDate: prismaClient.createdAt,
        lastContactDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        totalRevenue: Math.floor(Math.random() * 500000) + 50000, // Random revenue between 50k-550k
        averageProjectValue: Math.floor(Math.random() * 100000) + 25000, // Random between 25k-125k
        paymentTerms: {
          method: PaymentMethod.BANK_TRANSFER,
          terms: 'Net 30',
          currency: 'USD',
          paymentHistory: [],
        },
        contractDetails: {
          type: ContractType.SERVICE_AGREEMENT,
          startDate: prismaClient.createdAt,
          endDate: new Date(prismaClient.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from creation
          terms: 'Standard service agreement terms',
          value: Math.floor(Math.random() * 200000) + 100000,
          status: ContractStatus.ACTIVE,
        },
        satisfactionScore: (aiProfile?.healthScore || 75) / 10, // Convert to 0-10 scale
        loyaltyScore: aiProfile?.healthScore || 75,
      },
      projects: [], // Will be populated separately if needed
      interactions: [], // Will be populated separately if needed
      aiProfile: {
        healthScore: aiProfile?.healthScore || 75,
        engagementLevel: this.mapEngagementLevel(aiProfile?.engagementLevel),
        churnRisk: aiProfile?.churnRisk || 0.2,
        preferences: {
          communicationFrequency: CommunicationFrequency.WEEKLY,
          preferredMeetingTypes: [],
          decisionMakingStyle: DecisionMakingStyle.ANALYTICAL,
          responseTimeExpectation: ResponseTimeExpectation.SAME_DAY,
          projectManagementStyle: ProjectManagementStyle.AGILE,
        },
        communicationStyle: aiProfile?.preferences?.communicationStyle === 'formal' 
          ? CommunicationStyle.FORMAL 
          : CommunicationStyle.CASUAL,
        predictedLifetimeValue: Math.floor(Math.random() * 1000000) + 200000,
        nextBestAction: {
          action: 'Schedule quarterly business review',
          reason: 'Maintain strong client relationship',
          priority: ActionPriority.MEDIUM,
          estimatedImpact: 'High client satisfaction and retention',
          suggestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        },
        insights: [],
        lastAnalyzed: new Date(),
      },
      createdAt: prismaClient.createdAt,
      updatedAt: prismaClient.updatedAt,
    };

    return client;
  }

  /**
   * Extract first name from full name
   */
  private static extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts[0] || 'Unknown';
  }

  /**
   * Extract last name from full name
   */
  private static extractLastName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : 'Client';
  }

  /**
   * Determine client tier based on health score
   */
  private static determineTier(healthScore: number): ClientTier {
    if (healthScore >= 90) return ClientTier.PLATINUM;
    if (healthScore >= 80) return ClientTier.GOLD;
    if (healthScore >= 70) return ClientTier.SILVER;
    return ClientTier.BRONZE;
  }

  /**
   * Map engagement level from string to enum
   */
  private static mapEngagementLevel(level?: string): EngagementLevel {
    switch (level?.toUpperCase()) {
      case 'VERY_HIGH':
        return EngagementLevel.VERY_HIGH;
      case 'HIGH':
        return EngagementLevel.HIGH;
      case 'MEDIUM':
        return EngagementLevel.MEDIUM;
      case 'LOW':
        return EngagementLevel.LOW;
      default:
        return EngagementLevel.MEDIUM;
    }
  }

  /**
   * Get all clients with transformation
   */
  static async getAllClients(): Promise<Client[]> {
    try {
      // Use the API instead of direct database access
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients from API');
      }
      
      const data = await response.json();
      
      // Transform API response to Client objects
      return data.clients.map((client: any) => this.transformApiClientToClient(client));
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Return empty array if API is not available
      return [];
    }
  }

  /**
   * Transform API client data to Client type
   */
  private static transformApiClientToClient(apiClient: unknown): Client {
    return {
      id: apiClient.id,
      name: apiClient.name,
      contact: {
        primaryContact: {
          id: `${apiClient.id}-primary`,
          firstName: this.extractFirstName(apiClient.name),
          lastName: this.extractLastName(apiClient.name),
          email: apiClient.email || 'no-email@example.com',
          phone: apiClient.phone || '+1-000-000-0000',
          role: 'Primary Contact',
          department: 'General',
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
          legalName: apiClient.company || apiClient.name,
          industry: 'Technology',
          size: CompanySize.MEDIUM,
          website: `https://www.${apiClient.name.toLowerCase().replace(/\s+/g, '')}.com`,
        },
        address: {
          street: '123 Business Street',
          city: 'Business City',
          state: 'BC',
          postalCode: '12345',
          country: 'United States',
          type: AddressType.OFFICE,
        },
        socialMedia: {},
      },
      relationship: {
        status: ClientStatus.ACTIVE,
        tier: ClientTier.BRONZE,
        acquisitionDate: new Date(apiClient.createdAt),
        lastContactDate: new Date(),
        totalRevenue: 50000,
        averageProjectValue: 25000,
        paymentTerms: {
          method: PaymentMethod.BANK_TRANSFER,
          terms: 'Net 30',
          currency: 'USD',
          paymentHistory: [],
        },
        contractDetails: {
          type: ContractType.SERVICE_AGREEMENT,
          startDate: new Date(apiClient.createdAt),
          endDate: new Date(new Date(apiClient.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000),
          terms: 'Standard service agreement terms',
          value: 100000,
          status: ContractStatus.ACTIVE,
        },
        satisfactionScore: 8,
        loyaltyScore: 75,
      },
      projects: [],
      interactions: [],
      aiProfile: {
        healthScore: 75,
        engagementLevel: EngagementLevel.MEDIUM,
        churnRisk: 0.2,
        preferences: {
          communicationFrequency: CommunicationFrequency.WEEKLY,
          preferredMeetingTypes: [],
          decisionMakingStyle: DecisionMakingStyle.ANALYTICAL,
          responseTimeExpectation: ResponseTimeExpectation.SAME_DAY,
          projectManagementStyle: ProjectManagementStyle.AGILE,
        },
        communicationStyle: CommunicationStyle.FORMAL,
        predictedLifetimeValue: 200000,
        nextBestAction: {
          action: 'Schedule quarterly business review',
          reason: 'Maintain strong client relationship',
          priority: ActionPriority.MEDIUM,
          estimatedImpact: 'High client satisfaction and retention',
          suggestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        insights: [],
        lastAnalyzed: new Date(),
      },
      createdAt: new Date(apiClient.createdAt),
      updatedAt: new Date(apiClient.updatedAt),
    };
  }

  /**
   * Get client by ID with transformation
   */
  static async getClientById(id: string): Promise<Client | null> {
    try {
      const prismaClient = await clientRepository.findById(id);
      if (!prismaClient) return null;
      return this.transformPrismaClientToClient(prismaClient);
    } catch (error) {
      console.warn('Database not available, using mock data:', error);
      // Fallback to mock data when database is not available
      return getMockClientById(id);
    }
  }

  /**
   * Search clients with transformation
   */
  static async searchClients(query: string, ownerId?: string): Promise<Client[]> {
    try {
      const prismaClients = await clientRepository.searchClients(query, ownerId);
      return prismaClients.map(this.transformPrismaClientToClient);
    } catch (error) {
      console.warn('Database not available, using mock data:', error);
      // Fallback to mock data when database is not available
      return searchMockClients(query);
    }
  }

  /**
   * Create a new client from form data
   */
  static async createClientFromForm(data: CreateClientData, ownerId: string): Promise<Client> {
    try {
      // Use Prisma for client creation
      const prismaData = {
        name: data.name,
        email: data.contact.primaryContact.email,
        phone: data.contact.primaryContact.phone,
        company: data.contact.company.legalName,
        address: `${data.contact.address.street}, ${data.contact.address.city}, ${data.contact.address.state} ${data.contact.address.postalCode}, ${data.contact.address.country}`,
        ownerId,
        aiProfile: {
          healthScore: 75,
          engagementLevel: 'medium',
          churnRisk: 0.2,
          preferences: {
            communicationStyle: data.contact.primaryContact.preferences.communicationStyle,
            preferredContactMethod: data.contact.primaryContact.preferences.preferredContactMethod,
            timezone: data.contact.primaryContact.preferences.timezone,
            language: data.contact.primaryContact.preferences.language
          },
          relationship: data.relationship,
          contact: data.contact
        }
      };

      const prismaClient = await clientRepository.create(prismaData);
      return this.transformPrismaClientToClient(prismaClient);
    } catch (error) {
      console.error('Error creating client from form:', error);
      throw error;
    }
  }

  /**
   * Create a new client (simplified for backward compatibility)
   */
  static async createClient(data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    ownerId: string;
  }): Promise<Client> {
    try {
      // Use the API instead of direct database access
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          address: data.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const result = await response.json();
      
      // Transform API response to Client object
      return this.transformApiClientToClient({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        company: result.company,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Update a client (simplified for now)
   */
  static async updateClient(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  }): Promise<Client> {
    try {
      const prismaClient = await clientRepository.update(id, data);
      return this.transformPrismaClientToClient(prismaClient);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Delete a client
   */
  static async deleteClient(id: string): Promise<void> {
    try {
      // Use the API instead of direct database access
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      // API call successful, client deleted
      return;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
}

// Export a singleton instance for easy use
export const clientService = ClientService;