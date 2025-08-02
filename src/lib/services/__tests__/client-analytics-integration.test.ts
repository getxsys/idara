import { ClientAnalyticsIntegration } from '../client-analytics-integration';
import { ClientAnalyticsService } from '../client-analytics';
import { ClientRepository } from '../../database/repository/client';
import { ActionPriority } from '../../../types/client';

// Mock the dependencies
jest.mock('../client-analytics');
jest.mock('../../database/repository/client');
jest.mock('../../database/connection', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('ClientAnalyticsIntegration', () => {
  let integration: ClientAnalyticsIntegration;
  let mockAnalyticsService: jest.Mocked<ClientAnalyticsService>;
  let mockClientRepository: jest.Mocked<ClientRepository>;

  const mockClient = {
    id: 'client-1',
    name: 'Test Company',
    email: 'test@company.com',
    phone: '+1234567890',
    company: 'Test Company Inc.',
    address: '123 Main St',
    ownerId: 'owner-1',
    aiProfile: JSON.stringify({
      healthScore: 70,
      engagementLevel: 'medium',
      churnRisk: 0.3,
      lastAnalyzed: new Date('2024-01-01'),
    }),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockAnalytics = {
    healthScore: {
      overall: 85,
      factors: {
        engagement: 80,
        financial: 90,
        communication: 85,
        satisfaction: 80,
        loyalty: 90,
      },
      trend: 'improving' as const,
      lastUpdated: new Date(),
    },
    churnPrediction: {
      riskScore: 0.2,
      confidence: 0.8,
      riskFactors: [],
      retentionStrategies: [],
      lastUpdated: new Date(),
    },
    leadScore: null,
    communicationSuggestions: [],
    insights: [
      {
        id: 'insight-1',
        type: 'opportunity' as const,
        title: 'Upsell Opportunity',
        description: 'Client ready for additional services',
        confidence: 0.8,
        actionable: true,
        createdAt: new Date(),
      },
    ],
    nextBestActions: [
      {
        action: 'Schedule quarterly review',
        reason: 'Maintain strong relationship',
        priority: ActionPriority.HIGH,
        estimatedImpact: 'High - strengthen relationship',
        suggestedDate: new Date('2024-02-01'),
      },
    ],
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockAnalyticsService = {
      generateClientAnalytics: jest.fn().mockReturnValue(mockAnalytics),
    } as any;

    mockClientRepository = {
      findById: jest.fn().mockResolvedValue(mockClient),
      findMany: jest.fn().mockResolvedValue([mockClient]),
      updateAIProfile: jest.fn().mockResolvedValue(mockClient),
    } as any;

    // Mock the constructors
    (ClientAnalyticsService as jest.Mock).mockImplementation(() => mockAnalyticsService);
    (ClientRepository as jest.Mock).mockImplementation(() => mockClientRepository);

    integration = new ClientAnalyticsIntegration();
  });

  describe('updateClientAnalytics', () => {
    it('should successfully update client analytics', async () => {
      const result = await integration.updateClientAnalytics('client-1');

      expect(mockClientRepository.findById).toHaveBeenCalledWith('client-1');
      expect(mockAnalyticsService.generateClientAnalytics).toHaveBeenCalled();
      expect(mockClientRepository.updateAIProfile).toHaveBeenCalledWith(
        'client-1',
        expect.objectContaining({
          healthScore: 85,
          churnRisk: 0.2,
          insights: mockAnalytics.insights,
          lastAnalyzed: expect.any(Date),
        })
      );

      expect(result).toEqual({
        clientId: 'client-1',
        analytics: mockAnalytics,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error when client not found', async () => {
      mockClientRepository.findById.mockResolvedValue(null);

      await expect(integration.updateClientAnalytics('nonexistent-client'))
        .rejects.toThrow('Client with ID nonexistent-client not found');
    });

    it('should handle analytics generation errors', async () => {
      mockAnalyticsService.generateClientAnalytics.mockImplementation(() => {
        throw new Error('Analytics generation failed');
      });

      await expect(integration.updateClientAnalytics('client-1'))
        .rejects.toThrow('Failed to update analytics for client client-1: Analytics generation failed');
    });

    it('should handle database update errors', async () => {
      mockClientRepository.updateAIProfile.mockRejectedValue(new Error('Database update failed'));

      await expect(integration.updateClientAnalytics('client-1'))
        .rejects.toThrow('Failed to update analytics for client client-1: Database update failed');
    });
  });

  describe('batchUpdateClientAnalytics', () => {
    it('should process multiple clients successfully', async () => {
      const clientIds = ['client-1', 'client-2', 'client-3'];
      
      // Mock different clients
      mockClientRepository.findById
        .mockResolvedValueOnce({ ...mockClient, id: 'client-1' })
        .mockResolvedValueOnce({ ...mockClient, id: 'client-2' })
        .mockResolvedValueOnce({ ...mockClient, id: 'client-3' });

      const result = await integration.batchUpdateClientAnalytics(clientIds);

      expect(result.totalProcessed).toBe(3);
      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.successful[0].clientId).toBe('client-1');
      expect(result.successful[1].clientId).toBe('client-2');
      expect(result.successful[2].clientId).toBe('client-3');
    });

    it('should handle partial failures gracefully', async () => {
      const clientIds = ['client-1', 'client-2', 'client-3'];
      
      mockClientRepository.findById
        .mockResolvedValueOnce({ ...mockClient, id: 'client-1' })
        .mockResolvedValueOnce(null) // Client not found
        .mockResolvedValueOnce({ ...mockClient, id: 'client-3' });

      const result = await integration.batchUpdateClientAnalytics(clientIds);

      expect(result.totalProcessed).toBe(3);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual({
        clientId: 'client-2',
        error: 'Failed to update analytics for client client-2: Client with ID client-2 not found',
      });
    });

    it('should handle empty client list', async () => {
      const result = await integration.batchUpdateClientAnalytics([]);

      expect(result.totalProcessed).toBe(0);
      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('getClientsNeedingAnalyticsUpdate', () => {
    it('should return client IDs that need updates', async () => {
      const clients = [
        { ...mockClient, id: 'client-1' },
        { ...mockClient, id: 'client-2' },
        { ...mockClient, id: 'client-3' },
      ];
      mockClientRepository.findMany.mockResolvedValue(clients);

      const result = await integration.getClientsNeedingAnalyticsUpdate(24);

      expect(result).toEqual(['client-1', 'client-2', 'client-3']);
      expect(mockClientRepository.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should handle empty client list', async () => {
      mockClientRepository.findMany.mockResolvedValue([]);

      const result = await integration.getClientsNeedingAnalyticsUpdate();

      expect(result).toEqual([]);
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should calculate analytics summary correctly', async () => {
      const clients = [
        { ...mockClient, id: 'client-1' },
        { ...mockClient, id: 'client-2' },
      ];
      mockClientRepository.findMany.mockResolvedValue(clients);

      // Mock different analytics for each client
      mockAnalyticsService.generateClientAnalytics
        .mockReturnValueOnce({
          ...mockAnalytics,
          healthScore: { ...mockAnalytics.healthScore, overall: 80 },
          churnPrediction: { ...mockAnalytics.churnPrediction, riskScore: 0.7 }, // High risk
        })
        .mockReturnValueOnce({
          ...mockAnalytics,
          healthScore: { ...mockAnalytics.healthScore, overall: 90 },
          churnPrediction: { ...mockAnalytics.churnPrediction, riskScore: 0.2 }, // Low risk
        });

      const result = await integration.getAnalyticsSummary();

      expect(result).toEqual({
        totalClients: 2,
        highRiskClients: 1, // One client with risk > 0.6
        opportunityClients: 1, // Only one client meets both criteria (high health + opportunity insights)
        avgHealthScore: 85, // (80 + 90) / 2
        avgChurnRisk: 0.45, // (0.7 + 0.2) / 2
      });
    });

    it('should handle empty client list', async () => {
      mockClientRepository.findMany.mockResolvedValue([]);

      const result = await integration.getAnalyticsSummary();

      expect(result).toEqual({
        totalClients: 0,
        highRiskClients: 0,
        opportunityClients: 0,
        avgHealthScore: 0,
        avgChurnRisk: 0,
      });
    });
  });

  describe('getHighPriorityActions', () => {
    it('should return high priority actions across clients', async () => {
      const clients = [
        { ...mockClient, id: 'client-1', name: 'Company A' },
        { ...mockClient, id: 'client-2', name: 'Company B' },
      ];
      mockClientRepository.findMany.mockResolvedValue(clients);

      const urgentAction = {
        action: 'Urgent retention call',
        reason: 'High churn risk',
        priority: ActionPriority.URGENT,
        estimatedImpact: 'Critical',
        suggestedDate: new Date('2024-01-20'),
      };

      const highAction = {
        action: 'Schedule review',
        reason: 'Maintain relationship',
        priority: ActionPriority.HIGH,
        estimatedImpact: 'High',
        suggestedDate: new Date('2024-01-25'),
      };

      mockAnalyticsService.generateClientAnalytics
        .mockReturnValueOnce({
          ...mockAnalytics,
          nextBestActions: [urgentAction, highAction],
        })
        .mockReturnValueOnce({
          ...mockAnalytics,
          nextBestActions: [
            {
              ...highAction,
              action: 'Follow up meeting',
              suggestedDate: new Date('2024-01-22'),
            },
          ],
        });

      const result = await integration.getHighPriorityActions();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        clientId: 'client-1',
        clientName: 'Company A',
        action: 'Urgent retention call',
        priority: ActionPriority.URGENT,
        suggestedDate: new Date('2024-01-20'),
      });

      // Should be sorted by priority (urgent first) then by date
      expect(result[0].priority).toBe(ActionPriority.URGENT);
      expect(result[1].priority).toBe(ActionPriority.HIGH);
      expect(result[2].priority).toBe(ActionPriority.HIGH);
    });

    it('should handle clients with no high priority actions', async () => {
      const clients = [{ ...mockClient, id: 'client-1' }];
      mockClientRepository.findMany.mockResolvedValue(clients);

      mockAnalyticsService.generateClientAnalytics.mockReturnValue({
        ...mockAnalytics,
        nextBestActions: [
          {
            action: 'Low priority task',
            reason: 'Routine maintenance',
            priority: ActionPriority.LOW,
            estimatedImpact: 'Low',
            suggestedDate: new Date(),
          },
        ],
      });

      const result = await integration.getHighPriorityActions();

      expect(result).toHaveLength(0);
    });
  });

  describe('scheduleAnalyticsUpdates', () => {
    it('should process analytics updates in batches', async () => {
      // Mock 25 clients to test batching (batch size is 10)
      const clientIds = Array.from({ length: 25 }, (_, i) => `client-${i + 1}`);
      
      jest.spyOn(integration, 'getClientsNeedingAnalyticsUpdate')
        .mockResolvedValue(clientIds);
      
      jest.spyOn(integration, 'batchUpdateClientAnalytics')
        .mockResolvedValue({
          successful: Array.from({ length: 10 }, (_, i) => ({
            clientId: `client-${i + 1}`,
            analytics: mockAnalytics,
            updatedAt: new Date(),
          })),
          failed: [],
          totalProcessed: 10,
        });

      // Mock console.log to verify batch processing
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await integration.scheduleAnalyticsUpdates();

      expect(integration.batchUpdateClientAnalytics).toHaveBeenCalledTimes(3); // 25 clients / 10 batch size = 3 batches
      expect(consoleSpy).toHaveBeenCalledWith('Scheduling analytics updates for 25 clients');
      
      consoleSpy.mockRestore();
    });

    it('should handle case when no clients need updates', async () => {
      jest.spyOn(integration, 'getClientsNeedingAnalyticsUpdate')
        .mockResolvedValue([]);

      const batchSpy = jest.spyOn(integration, 'batchUpdateClientAnalytics');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await integration.scheduleAnalyticsUpdates();

      expect(consoleSpy).toHaveBeenCalledWith('No clients need analytics updates');
      expect(batchSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('mapDatabaseClientToDomain', () => {
    it('should map database client to domain model correctly', () => {
      // Access the private method through type assertion for testing
      const mappedClient = (integration as any).mapDatabaseClientToDomain(mockClient);

      expect(mappedClient).toMatchObject({
        id: 'client-1',
        name: 'Test Company',
        contact: {
          primaryContact: {
            firstName: 'Test',
            lastName: 'Company',
            email: 'test@company.com',
            phone: '+1234567890',
          },
          company: {
            legalName: 'Test Company Inc.',
          },
        },
        relationship: {
          status: 'active',
          satisfactionScore: 7,
          loyaltyScore: 70,
        },
      });
    });

    it('should handle clients with minimal data', () => {
      const minimalClient = {
        id: 'client-minimal',
        name: 'MinimalCorp',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mappedClient = (integration as any).mapDatabaseClientToDomain(minimalClient);

      expect(mappedClient.id).toBe('client-minimal');
      expect(mappedClient.name).toBe('MinimalCorp');
      expect(mappedClient.contact.primaryContact.email).toBe('');
      expect(mappedClient.contact.company.legalName).toBe('MinimalCorp');
    });
  });
});