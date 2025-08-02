import { describe, it, expect } from '@jest/globals';
import { DataTransformer } from '../data-transform';
import { z } from 'zod';
import {
  ProjectStatus,
  PhaseStatus,
  RiskLevel,
  ClientStatus,
  EngagementLevel,
  DocumentType,
  AccessLevel,
  ComplexityLevel,
} from '@/types';

// Mock data for testing
const mockProject = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Project',
  description: 'A test project',
  status: ProjectStatus.ACTIVE,
  timeline: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    milestones: [],
    phases: [
      {
        id: '1',
        name: 'Phase 1',
        description: 'First phase',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        status: PhaseStatus.COMPLETED,
        tasks: [],
        progress: 100,
      },
      {
        id: '2',
        name: 'Phase 2',
        description: 'Second phase',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        status: PhaseStatus.IN_PROGRESS,
        tasks: [],
        progress: 50,
      },
    ],
  },
  resources: [],
  risks: [
    {
      id: '1',
      title: 'High Risk',
      description: 'A high severity risk',
      category: 'technical' as any,
      probability: 0.8,
      impact: 0.9,
      severity: 'high' as any,
      mitigation: 'Mitigation plan',
      owner: 'John Doe',
      status: 'identified' as any,
      identifiedAt: new Date(),
      reviewDate: new Date(),
    },
  ],
  aiInsights: {
    healthScore: 75,
    riskLevel: RiskLevel.MEDIUM,
    completionPrediction: new Date('2024-12-15'),
    budgetVariance: 10,
    scheduleVariance: -5,
    recommendations: [],
    trends: [],
    lastUpdated: new Date(),
  },
  collaborators: [],
  documents: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
};

const mockClient = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Client',
  contact: {
    primaryContact: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '+1234567890',
      role: 'CEO',
      isPrimary: true,
      preferences: {
        preferredContactMethod: 'email' as any,
        bestTimeToContact: [],
        timezone: 'UTC',
        language: 'en',
        communicationStyle: 'formal' as any,
      },
    },
    additionalContacts: [],
    company: {
      legalName: 'Test Company',
      industry: 'Technology',
      size: 'medium' as any,
    },
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'Test Country',
      type: 'office' as any,
    },
    socialMedia: {},
  },
  relationship: {
    status: ClientStatus.ACTIVE,
    tier: 'gold' as any,
    acquisitionDate: new Date('2023-01-01'),
    lastContactDate: new Date('2024-05-01'),
    totalRevenue: 150000,
    averageProjectValue: 50000,
    paymentTerms: {
      method: 'bank_transfer' as any,
      terms: 'Net 30',
      currency: 'USD',
      paymentHistory: [],
    },
    contractDetails: {
      type: 'service_agreement' as any,
      startDate: new Date('2023-01-01'),
      terms: 'Standard terms',
      value: 200000,
      status: 'active' as any,
    },
    satisfactionScore: 8.5,
    loyaltyScore: 85,
  },
  projects: [],
  interactions: [
    {
      id: '1',
      type: 'email' as any,
      subject: 'Test',
      description: 'Test interaction',
      contactId: '1',
      userId: '1',
      date: new Date('2024-05-01'),
      duration: 30,
      outcome: 'positive' as any,
      followUpRequired: false,
      sentiment: {
        overall: 0.8,
        confidence: 0.9,
        emotions: [],
      },
      tags: [],
      attachments: [],
      createdAt: new Date(),
    },
  ],
  aiProfile: {
    healthScore: 85,
    engagementLevel: EngagementLevel.HIGH,
    churnRisk: 0.1,
    preferences: {
      communicationFrequency: 'weekly' as any,
      preferredMeetingTypes: [],
      decisionMakingStyle: 'analytical' as any,
      responseTimeExpectation: 'same_day' as any,
      projectManagementStyle: 'agile' as any,
    },
    communicationStyle: 'formal' as any,
    predictedLifetimeValue: 500000,
    nextBestAction: {
      action: 'Schedule review',
      reason: 'Maintain relationship',
      priority: 'medium' as any,
      estimatedImpact: 'High satisfaction',
      suggestedDate: new Date('2024-07-01'),
    },
    insights: [],
    lastAnalyzed: new Date(),
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-05-01'),
};

const mockDocument = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Document',
  content: 'This is a test document with some content for testing purposes. It has multiple sentences and should provide a good test case for word counting and reading time calculations.',
  metadata: {
    type: DocumentType.REPORT,
    format: 'pdf' as any,
    size: 1024,
    language: 'en',
    author: 'Test Author',
    source: {
      type: 'upload' as any,
      filename: 'test.pdf',
    },
    category: 'Test',
    keywords: ['test'],
    summary: 'Test document',
    extractedEntities: [],
    customFields: {},
  },
  tags: ['test'],
  accessLevel: AccessLevel.CONFIDENTIAL,
  relationships: [],
  versions: [],
  collaborators: [],
  aiAnalysis: {
    sentiment: {
      overall: 0.5,
      confidence: 0.8,
      emotions: [],
      tone: {
        formal: 0.8,
        confident: 0.7,
        analytical: 0.6,
        tentative: 0.3,
      },
    },
    topics: [],
    readabilityScore: 75,
    complexity: ComplexityLevel.MEDIUM,
    keyInsights: [],
    suggestedTags: [],
    relatedDocuments: [],
    qualityScore: 80,
    lastAnalyzed: new Date(),
  },
  lastIndexed: new Date(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('DataTransformer', () => {
  describe('safeValidate', () => {
    it('should validate correct data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      const validData = { name: 'John', age: 30 };
      const result = DataTransformer.safeValidate(schema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      const invalidData = { name: '', age: -5 };
      const result = DataTransformer.safeValidate(schema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should handle validation exceptions', () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = DataTransformer.safeValidate(schema, null);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('enrichProject', () => {
    it('should add computed fields to project', () => {
      const enriched = DataTransformer.enrichProject(mockProject as any);

      expect(enriched.computedFields).toBeDefined();
      expect(enriched.computedFields.completionPercentage).toBe(50); // 1 of 2 phases completed
      expect(typeof enriched.computedFields.isOverdue).toBe('boolean');
      expect(typeof enriched.computedFields.riskScore).toBe('number');
      expect(typeof enriched.computedFields.daysRemaining).toBe('number');
    });

    it('should calculate completion percentage correctly', () => {
      const projectWithNoPhases = {
        ...mockProject,
        timeline: {
          ...mockProject.timeline,
          phases: [],
        },
      };

      const enriched = DataTransformer.enrichProject(projectWithNoPhases as any);
      expect(enriched.computedFields.completionPercentage).toBe(0);
    });

    it('should detect overdue projects', () => {
      const overdueProject = {
        ...mockProject,
        timeline: {
          ...mockProject.timeline,
          endDate: new Date('2020-01-01'), // Past date
        },
      };

      const enriched = DataTransformer.enrichProject(overdueProject as any);
      expect(enriched.computedFields.isOverdue).toBe(true);
    });
  });

  describe('enrichClient', () => {
    it('should add computed fields to client', () => {
      const enriched = DataTransformer.enrichClient(mockClient as any);

      expect(enriched.computedFields).toBeDefined();
      expect(enriched.computedFields.totalInteractions).toBe(1);
      expect(typeof enriched.computedFields.lastInteractionDays).toBe('number');
      expect(typeof enriched.computedFields.averageResponseTime).toBe('number');
      expect(['up', 'down', 'stable']).toContain(enriched.computedFields.engagementTrend);
      expect(typeof enriched.computedFields.revenueGrowth).toBe('number');
    });

    it('should calculate average response time correctly', () => {
      const clientWithMultipleInteractions = {
        ...mockClient,
        interactions: [
          { ...mockClient.interactions[0], duration: 30 },
          { ...mockClient.interactions[0], id: '2', duration: 60 },
          { ...mockClient.interactions[0], id: '3', duration: 45 },
        ],
      };

      const enriched = DataTransformer.enrichClient(clientWithMultipleInteractions as any);
      expect(enriched.computedFields.averageResponseTime).toBe(45); // (30 + 60 + 45) / 3
    });
  });

  describe('enrichDocument', () => {
    it('should add computed fields to document', () => {
      const enriched = DataTransformer.enrichDocument(mockDocument as any);

      expect(enriched.computedFields).toBeDefined();
      expect(enriched.computedFields.wordCount).toBeGreaterThan(0);
      expect(enriched.computedFields.readingTime).toBeGreaterThan(0);
      expect(typeof enriched.computedFields.isStale).toBe('boolean');
      expect(enriched.computedFields.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(enriched.computedFields.relevanceScore).toBeLessThanOrEqual(100);
      expect(enriched.computedFields.securityLevel).toBe(3); // CONFIDENTIAL = 3
    });

    it('should calculate word count correctly', () => {
      const testDoc = {
        ...mockDocument,
        content: 'This is a test with exactly eight words.',
      };

      const enriched = DataTransformer.enrichDocument(testDoc as any);
      expect(enriched.computedFields.wordCount).toBe(8);
    });

    it('should detect stale documents', () => {
      const staleDoc = {
        ...mockDocument,
        updatedAt: new Date('2020-01-01'), // Very old date
      };

      const enriched = DataTransformer.enrichDocument(staleDoc as any);
      expect(enriched.computedFields.isStale).toBe(true);
    });
  });

  describe('normalizeDates', () => {
    it('should convert string dates to Date objects', () => {
      const data = {
        id: '123',
        name: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        description: 'Test description',
      };

      const normalized = DataTransformer.normalizeDates(data, ['createdAt', 'updatedAt']);

      expect(normalized.createdAt).toBeInstanceOf(Date);
      expect(normalized.updatedAt).toBeInstanceOf(Date);
      expect(normalized.name).toBe('Test');
      expect(normalized.description).toBe('Test description');
    });

    it('should leave non-string dates unchanged', () => {
      const data = {
        id: '123',
        createdAt: new Date('2024-01-01'),
        updatedAt: '2024-06-01T00:00:00Z',
      };

      const normalized = DataTransformer.normalizeDates(data, ['createdAt', 'updatedAt']);

      expect(normalized.createdAt).toBeInstanceOf(Date);
      expect(normalized.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('sanitizeForAPI', () => {
    it('should remove sensitive fields', () => {
      const data = {
        id: '123',
        name: 'Test',
        password: 'secret',
        apiKey: 'key123',
        publicInfo: 'visible',
      };

      const sanitized = DataTransformer.sanitizeForAPI(data, ['password', 'apiKey']);

      expect(sanitized.id).toBe('123');
      expect(sanitized.name).toBe('Test');
      expect(sanitized.publicInfo).toBe('visible');
      expect('password' in sanitized).toBe(false);
      expect('apiKey' in sanitized).toBe(false);
    });
  });

  describe('highlightSearchResults', () => {
    it('should highlight search terms in content', () => {
      const content = 'This is a test document with test content for testing purposes.';
      const searchTerms = ['test', 'document'];

      const result = DataTransformer.highlightSearchResults(content, searchTerms, 100);

      expect(result.snippet).toBeDefined();
      expect(result.highlights).toBeDefined();
      expect(result.highlights.length).toBeGreaterThan(0);
      expect(result.highlights.some(h => h.term.toLowerCase().includes('test'))).toBe(true);
    });

    it('should create snippet around first highlight', () => {
      const content = 'A very long document with lots of content before the important keyword appears here.';
      const searchTerms = ['important'];

      const result = DataTransformer.highlightSearchResults(content, searchTerms, 50);

      expect(result.snippet.length).toBeLessThanOrEqual(50);
      expect(result.snippet).toContain('important');
    });

    it('should handle no matches', () => {
      const content = 'This is some content without the search term.';
      const searchTerms = ['missing'];

      const result = DataTransformer.highlightSearchResults(content, searchTerms, 100);

      expect(result.highlights).toHaveLength(0);
      expect(result.snippet).toBe(content);
    });
  });

  describe('aggregateMetrics', () => {
    it('should calculate metrics correctly', () => {
      const data = {
        projects: [mockProject as any],
        clients: [mockClient as any],
        documents: [mockDocument as any],
      };

      const metrics = DataTransformer.aggregateMetrics(data);

      expect(metrics.projectMetrics.total).toBe(1);
      expect(metrics.projectMetrics.active).toBe(1);
      expect(metrics.projectMetrics.averageHealth).toBe(75);

      expect(metrics.clientMetrics.total).toBe(1);
      expect(metrics.clientMetrics.active).toBe(1);
      expect(metrics.clientMetrics.averageSatisfaction).toBe(9); // Rounded from 8.5

      expect(metrics.documentMetrics.total).toBe(1);
      expect(metrics.documentMetrics.indexed).toBe(1);
      expect(metrics.documentMetrics.averageQuality).toBe(80);
    });

    it('should handle empty data', () => {
      const data = {
        projects: [],
        clients: [],
        documents: [],
      };

      const metrics = DataTransformer.aggregateMetrics(data);

      expect(metrics.projectMetrics.total).toBe(0);
      expect(metrics.projectMetrics.averageHealth).toBe(0);
      expect(metrics.clientMetrics.total).toBe(0);
      expect(metrics.clientMetrics.averageSatisfaction).toBe(0);
      expect(metrics.documentMetrics.total).toBe(0);
      expect(metrics.documentMetrics.averageQuality).toBe(0);
    });
  });
});