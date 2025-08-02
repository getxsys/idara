import { ClientAnalyticsService, ClientAnalytics } from './client-analytics';
import { ClientRepository } from '../database/repository/client';
import { Client } from '../../types/client';

export interface ClientAnalyticsUpdate {
  clientId: string;
  analytics: ClientAnalytics;
  updatedAt: Date;
}

export interface BatchAnalyticsResult {
  successful: ClientAnalyticsUpdate[];
  failed: { clientId: string; error: string }[];
  totalProcessed: number;
}

export class ClientAnalyticsIntegration {
  private analyticsService: ClientAnalyticsService;
  private clientRepository: ClientRepository;

  constructor() {
    this.analyticsService = new ClientAnalyticsService();
    this.clientRepository = new ClientRepository();
  }

  /**
   * Generate analytics for a single client and update their AI profile
   */
  async updateClientAnalytics(clientId: string): Promise<ClientAnalyticsUpdate> {
    try {
      // Fetch client with all related data
      const client = await this.clientRepository.findById(clientId);
      if (!client) {
        throw new Error(`Client with ID ${clientId} not found`);
      }

      // Convert database client to domain client (this would need proper mapping)
      const domainClient = this.mapDatabaseClientToDomain(client);

      // Generate analytics
      const analytics = this.analyticsService.generateClientAnalytics(domainClient);

      // Update client's AI profile with new analytics
      const updatedAIProfile = {
        ...domainClient.aiProfile,
        healthScore: analytics.healthScore.overall,
        churnRisk: analytics.churnPrediction.riskScore,
        nextBestAction: analytics.nextBestActions[0] || domainClient.aiProfile.nextBestAction,
        insights: analytics.insights,
        lastAnalyzed: new Date(),
      };

      await this.clientRepository.updateAIProfile(clientId, updatedAIProfile);

      return {
        clientId,
        analytics,
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to update analytics for client ${clientId}: ${error.message}`);
    }
  }

  /**
   * Generate analytics for multiple clients in batch
   */
  async batchUpdateClientAnalytics(clientIds: string[]): Promise<BatchAnalyticsResult> {
    const successful: ClientAnalyticsUpdate[] = [];
    const failed: { clientId: string; error: string }[] = [];

    for (const clientId of clientIds) {
      try {
        const result = await this.updateClientAnalytics(clientId);
        successful.push(result);
      } catch (error) {
        failed.push({
          clientId,
          error: error.message,
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: clientIds.length,
    };
  }

  /**
   * Get clients that need analytics updates (haven't been analyzed recently)
   */
  async getClientsNeedingAnalyticsUpdate(maxAgeHours: number = 24): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    // This would need to be implemented in the repository
    // For now, return all active clients
    const clients = await this.clientRepository.findMany({
      where: {
        // Add filter for clients that need updates
      },
    });

    return clients.map(client => client.id);
  }

  /**
   * Schedule automatic analytics updates for all clients
   */
  async scheduleAnalyticsUpdates(): Promise<void> {
    const clientIds = await this.getClientsNeedingAnalyticsUpdate();
    
    if (clientIds.length === 0) {
      console.log('No clients need analytics updates');
      return;
    }

    console.log(`Scheduling analytics updates for ${clientIds.length} clients`);
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < clientIds.length; i += batchSize) {
      const batch = clientIds.slice(i, i + batchSize);
      const result = await this.batchUpdateClientAnalytics(batch);
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${result.successful.length} successful, ${result.failed.length} failed`);
      
      if (result.failed.length > 0) {
        console.error('Failed updates:', result.failed);
      }

      // Add delay between batches to prevent rate limiting
      if (i + batchSize < clientIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(): Promise<{
    totalClients: number;
    highRiskClients: number;
    opportunityClients: number;
    avgHealthScore: number;
    avgChurnRisk: number;
  }> {
    const clients = await this.clientRepository.findMany();
    
    if (clients.length === 0) {
      return {
        totalClients: 0,
        highRiskClients: 0,
        opportunityClients: 0,
        avgHealthScore: 0,
        avgChurnRisk: 0,
      };
    }

    let totalHealthScore = 0;
    let totalChurnRisk = 0;
    let highRiskCount = 0;
    let opportunityCount = 0;

    for (const client of clients) {
      const domainClient = this.mapDatabaseClientToDomain(client);
      const analytics = this.analyticsService.generateClientAnalytics(domainClient);

      totalHealthScore += analytics.healthScore.overall;
      totalChurnRisk += analytics.churnPrediction.riskScore;

      if (analytics.churnPrediction.riskScore > 0.6) {
        highRiskCount++;
      }

      if (analytics.healthScore.overall > 80 && analytics.insights.some(i => i.type === 'opportunity')) {
        opportunityCount++;
      }
    }

    return {
      totalClients: clients.length,
      highRiskClients: highRiskCount,
      opportunityClients: opportunityCount,
      avgHealthScore: Math.round(totalHealthScore / clients.length),
      avgChurnRisk: Math.round((totalChurnRisk / clients.length) * 100) / 100,
    };
  }

  /**
   * Get high-priority actions across all clients
   */
  async getHighPriorityActions(): Promise<{
    clientId: string;
    clientName: string;
    action: string;
    priority: string;
    suggestedDate: Date;
  }[]> {
    const clients = await this.clientRepository.findMany();
    const highPriorityActions: any[] = [];

    for (const client of clients) {
      const domainClient = this.mapDatabaseClientToDomain(client);
      const analytics = this.analyticsService.generateClientAnalytics(domainClient);

      const urgentActions = analytics.nextBestActions.filter(
        action => action.priority === 'urgent' || action.priority === 'high'
      );

      urgentActions.forEach(action => {
        highPriorityActions.push({
          clientId: client.id,
          clientName: client.name,
          action: action.action,
          priority: action.priority,
          suggestedDate: action.suggestedDate,
        });
      });
    }

    // Sort by priority and date
    return highPriorityActions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.suggestedDate.getTime() - b.suggestedDate.getTime();
    });
  }

  /**
   * Map database client to domain client
   * This is a simplified mapping - in a real implementation, you'd need proper data transformation
   */
  private mapDatabaseClientToDomain(dbClient: any): Client {
    // This is a placeholder implementation
    // In reality, you'd need to properly map the database schema to the domain model
    return {
      id: dbClient.id,
      name: dbClient.name,
      contact: {
        primaryContact: {
          id: 'contact-1',
          firstName: dbClient.name.split(' ')[0] || 'Unknown',
          lastName: dbClient.name.split(' ')[1] || 'User',
          email: dbClient.email || '',
          phone: dbClient.phone || '',
          role: 'Primary Contact',
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
          legalName: dbClient.company || dbClient.name,
          industry: 'unknown',
          size: 'medium' as any,
        },
        address: {
          street: dbClient.address || '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
          type: 'office' as any,
        },
        socialMedia: {},
      },
      relationship: {
        status: 'active' as any,
        tier: 'silver' as any,
        acquisitionDate: dbClient.createdAt,
        lastContactDate: dbClient.updatedAt,
        totalRevenue: 50000,
        averageProjectValue: 25000,
        paymentTerms: {
          method: 'bank_transfer' as any,
          terms: 'Net 30',
          currency: 'USD',
          paymentHistory: [],
        },
        contractDetails: {
          type: 'service_agreement' as any,
          startDate: dbClient.createdAt,
          terms: 'Standard service agreement',
          value: 50000,
          status: 'active' as any,
        },
        satisfactionScore: 7,
        loyaltyScore: 70,
      },
      projects: [],
      interactions: [],
      aiProfile: JSON.parse(dbClient.aiProfile || '{}') || {
        healthScore: 70,
        engagementLevel: 'medium' as any,
        churnRisk: 0.3,
        preferences: {
          communicationFrequency: 'weekly' as any,
          preferredMeetingTypes: [],
          decisionMakingStyle: 'analytical' as any,
          responseTimeExpectation: 'same_day' as any,
          projectManagementStyle: 'agile' as any,
        },
        communicationStyle: 'professional' as any,
        predictedLifetimeValue: 100000,
        nextBestAction: {
          action: 'Schedule check-in',
          reason: 'Maintain relationship',
          priority: 'medium' as any,
          estimatedImpact: 'Medium',
          suggestedDate: new Date(),
        },
        insights: [],
        lastAnalyzed: new Date(),
      },
      createdAt: dbClient.createdAt,
      updatedAt: dbClient.updatedAt,
    };
  }
}

// Export singleton instance
export const clientAnalyticsIntegration = new ClientAnalyticsIntegration();