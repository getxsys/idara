import { IntegratedRAGService, getRAGService, initializeRAGService } from '../rag-service-integration';
import { RAGSearchService } from '../rag-search';
import { RAGIndexingService } from '../rag-indexing';
import { getRAGConfig } from '../../config/rag-config';

// Mock the document processor to avoid cheerio import issues
jest.mock('../document-processor', () => ({
  DocumentProcessor: jest.fn().mockImplementation(() => ({
    processDocument: jest.fn(),
    chunkDocument: jest.fn(),
    getDocumentType: jest.fn()
  }))
}));
import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  IndexingJob,
  IndexingStatus,
  AccessLevel,
  QueryContext,
  RAGConfig
} from '@/types/rag';

// Mock the dependencies
jest.mock('../rag-search');
jest.mock('../rag-indexing');
jest.mock('../../config/rag-config');

const MockRAGSearchService = RAGSearchService as jest.MockedClass<typeof RAGSearchService>;
const MockRAGIndexingService = RAGIndexingService as jest.MockedClass<typeof RAGIndexingService>;
const mockGetRAGConfig = getRAGConfig as jest.MockedFunction<typeof getRAGConfig>;

describe('IntegratedRAGService', () => {
  let integratedService: IntegratedRAGService;
  let mockSearchService: jest.Mocked<RAGSearchService>;
  let mockIndexingService: jest.Mocked<RAGIndexingService>;
  let mockConfig: RAGConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock configuration
    mockConfig = {
      vectorDatabase: {
        provider: 'pinecone',
        apiKey: 'test-key',
        environment: 'test',
        indexName: 'test-index',
        dimension: 1536
      },
      embeddings: {
        provider: 'openai',
        model: 'text-embedding-ada-002',
        apiKey: 'test-key',
        dimension: 1536
      },
      chunking: {
        maxChunkSize: 1000,
        chunkOverlap: 200,
        preserveStructure: true
      },
      retrieval: {
        defaultTopK: 5,
        defaultSimilarityThreshold: 0.7,
        maxContextLength: 4000
      }
    };

    mockGetRAGConfig.mockReturnValue(mockConfig);

    // Create mocked instances
    mockSearchService = new MockRAGSearchService(mockConfig) as jest.Mocked<RAGSearchService>;
    mockIndexingService = new MockRAGIndexingService(mockConfig) as jest.Mocked<RAGIndexingService>;

    // Mock constructor calls
    MockRAGSearchService.mockImplementation(() => mockSearchService);
    MockRAGIndexingService.mockImplementation(() => mockIndexingService);

    integratedService = new IntegratedRAGService(mockConfig);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockIndexingService.initialize.mockResolvedValue();

      await integratedService.initialize();

      expect(mockIndexingService.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockIndexingService.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(integratedService.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('search functionality', () => {
    const mockQuery: RAGQuery = {
      query: 'business strategy',
      userId: 'test-user',
      maxResults: 5,
      similarityThreshold: 0.7
    };

    const mockResponse: RAGResponse = {
      answer: 'Business strategy focuses on growth and innovation.',
      sources: [
        {
          documentId: 'doc_1',
          title: 'Business Strategy 2024',
          chunkId: 'chunk_1',
          content: 'Our business strategy focuses on growth.',
          relevanceScore: 0.95,
          metadata: {
            fileName: 'strategy.pdf',
            fileType: 'pdf',
            fileSize: 1024,
            createdDate: new Date('2024-01-15')
          },
          citation: 'Business Strategy 2024 (1/15/2024)'
        }
      ],
      confidence: 0.91,
      suggestions: ['growth strategy', 'innovation plans'],
      processingTime: 1250,
      queryId: 'query_123'
    };

    beforeEach(() => {
      mockSearchService.search.mockResolvedValue(mockResponse);
    });

    it('should perform search and return results', async () => {
      const result = await integratedService.search(mockQuery);

      expect(mockSearchService.search).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should cache search results', async () => {
      // First search
      const result1 = await integratedService.search(mockQuery);
      expect(mockSearchService.search).toHaveBeenCalledTimes(1);

      // Second identical search should use cache
      const result2 = await integratedService.search(mockQuery);
      expect(mockSearchService.search).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toEqual(result1);
    });

    it('should record search analytics', async () => {
      await integratedService.search(mockQuery);

      const analytics = integratedService.getSearchAnalytics();
      expect(analytics).toHaveLength(1);
      expect(analytics[0]).toMatchObject({
        query: mockQuery.query,
        userId: mockQuery.userId,
        confidence: mockResponse.confidence,
        resultsCount: mockResponse.sources.length
      });
    });

    it('should handle search errors', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Search failed'));

      await expect(integratedService.search(mockQuery)).rejects.toThrow('Search failed');
    });
  });

  describe('contextual document retrieval', () => {
    const mockContext: QueryContext = {
      currentProject: 'project-123',
      currentClient: 'client-456',
      userRole: 'manager',
      workspaceId: 'workspace-789',
      sessionId: 'session-abc'
    };

    const mockContextualResponse: RAGResponse = {
      answer: 'Contextual answer',
      sources: [
        {
          documentId: 'doc_1',
          title: 'Project Document',
          chunkId: 'chunk_1',
          content: 'Project-specific content.',
          relevanceScore: 0.8,
          metadata: {
            fileName: 'project.pdf',
            fileType: 'pdf',
            fileSize: 1024,
            projectId: 'project-123',
            createdDate: new Date('2024-01-15')
          },
          citation: 'Project Document (1/15/2024)'
        },
        {
          documentId: 'doc_2',
          title: 'General Document',
          chunkId: 'chunk_2',
          content: 'General content.',
          relevanceScore: 0.75,
          metadata: {
            fileName: 'general.pdf',
            fileType: 'pdf',
            fileSize: 1024,
            createdDate: new Date('2024-01-10')
          },
          citation: 'General Document (1/10/2024)'
        }
      ],
      confidence: 0.85,
      suggestions: [],
      processingTime: 1000,
      queryId: 'query_456'
    };

    beforeEach(() => {
      mockSearchService.search.mockResolvedValue(mockContextualResponse);
    });

    it('should retrieve contextual documents with boosting', async () => {
      const result = await integratedService.retrieveContextualDocuments(
        'project requirements',
        mockContext,
        { maxResults: 3, boostContextual: true }
      );

      expect(result).toHaveLength(2);
      // Project document should be ranked higher due to contextual boosting
      expect(result[0].metadata.projectId).toBe('project-123');
    });

    it('should apply recency boosting when enabled', async () => {
      const result = await integratedService.retrieveContextualDocuments(
        'project requirements',
        mockContext,
        { maxResults: 3, boostRecent: true }
      );

      expect(result).toHaveLength(2);
      // More recent document should be ranked higher
      expect(new Date(result[0].metadata.createdDate!).getTime())
        .toBeGreaterThan(new Date(result[1].metadata.createdDate!).getTime());
    });

    it('should build contextual filters based on user role', async () => {
      const viewerContext: QueryContext = {
        ...mockContext,
        userRole: 'viewer'
      };

      await integratedService.retrieveContextualDocuments(
        'test query',
        viewerContext
      );

      expect(mockSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            accessLevel: AccessLevel.PUBLIC
          })
        })
      );
    });
  });

  describe('similar documents', () => {
    const mockSimilarDocs: DocumentSource[] = [
      {
        documentId: 'similar_1',
        title: 'Similar Document 1',
        chunkId: 'chunk_similar_1',
        content: 'Similar content 1',
        relevanceScore: 0.85,
        metadata: {
          fileName: 'similar1.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          category: 'strategy'
        },
        citation: 'Similar Document 1'
      },
      {
        documentId: 'similar_2',
        title: 'Similar Document 2',
        chunkId: 'chunk_similar_2',
        content: 'Similar content 2',
        relevanceScore: 0.75,
        metadata: {
          fileName: 'similar2.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          category: 'analysis'
        },
        citation: 'Similar Document 2'
      },
      {
        documentId: 'similar_3',
        title: 'Low Similarity Document',
        chunkId: 'chunk_similar_3',
        content: 'Low similarity content',
        relevanceScore: 0.5, // Below threshold
        metadata: {
          fileName: 'low.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          category: 'other'
        },
        citation: 'Low Similarity Document'
      }
    ];

    beforeEach(() => {
      mockSearchService.findSimilarDocuments.mockResolvedValue(mockSimilarDocs);
    });

    it('should find similar documents with filtering', async () => {
      const result = await integratedService.findSimilarDocuments('source_doc', {
        maxResults: 3,
        minSimilarity: 0.7,
        excludeCategories: ['analysis']
      });

      expect(result).toHaveLength(1); // Only one document meets criteria
      expect(result[0].documentId).toBe('similar_1');
      expect(result[0].relevanceScore).toBeGreaterThanOrEqual(0.7);
      expect(result[0].metadata.category).not.toBe('analysis');
    });

    it('should sort results by relevance', async () => {
      const result = await integratedService.findSimilarDocuments('source_doc', {
        minSimilarity: 0.6
      });

      expect(result[0].relevanceScore).toBeGreaterThanOrEqual(result[1].relevanceScore);
    });

    it('should handle errors in finding similar documents', async () => {
      mockSearchService.findSimilarDocuments.mockRejectedValue(new Error('Find failed'));

      await expect(
        integratedService.findSimilarDocuments('source_doc')
      ).rejects.toThrow('Find failed');
    });
  });

  describe('document indexing', () => {
    const mockFile = Buffer.from('test document content');
    const mockFileName = 'test-document.pdf';
    const mockIndexingJob: IndexingJob = {
      id: 'job_123',
      documentId: 'doc_123',
      status: IndexingStatus.COMPLETED,
      progress: 100,
      startedAt: new Date(),
      completedAt: new Date(),
      chunksProcessed: 5,
      totalChunks: 5
    };

    beforeEach(() => {
      mockIndexingService.indexDocument.mockResolvedValue(mockIndexingJob);
    });

    it('should index a single document', async () => {
      const options = {
        accessLevel: AccessLevel.INTERNAL,
        tags: ['test', 'document'],
        category: 'test',
        userId: 'test-user'
      };

      const result = await integratedService.indexDocument(mockFile, mockFileName, options);

      expect(mockIndexingService.indexDocument).toHaveBeenCalledWith(
        mockFile,
        mockFileName,
        expect.objectContaining(options)
      );
      expect(result).toEqual(mockIndexingJob);
    });

    it('should batch index multiple documents with progress tracking', async () => {
      const documents = [
        {
          file: Buffer.from('doc1'),
          fileName: 'doc1.pdf',
          options: { userId: 'test-user', category: 'test' }
        },
        {
          file: Buffer.from('doc2'),
          fileName: 'doc2.pdf',
          options: { userId: 'test-user', category: 'test' }
        }
      ];

      const progressCallback = jest.fn();

      const results = await integratedService.indexDocuments(documents, progressCallback);

      expect(results).toHaveLength(2);
      expect(progressCallback).toHaveBeenCalledWith(0, 2, 'doc1.pdf');
      expect(progressCallback).toHaveBeenCalledWith(1, 2, 'doc2.pdf');
      expect(progressCallback).toHaveBeenCalledWith(2, 2, '');
    });

    it('should continue batch indexing even if some documents fail', async () => {
      const documents = [
        {
          file: Buffer.from('doc1'),
          fileName: 'doc1.pdf',
          options: { userId: 'test-user' }
        },
        {
          file: Buffer.from('doc2'),
          fileName: 'doc2.pdf',
          options: { userId: 'test-user' }
        }
      ];

      // First document succeeds, second fails
      mockIndexingService.indexDocument
        .mockResolvedValueOnce(mockIndexingJob)
        .mockRejectedValueOnce(new Error('Indexing failed'));

      const results = await integratedService.indexDocuments(documents);

      expect(results).toHaveLength(1); // Only successful indexing
      expect(mockIndexingService.indexDocument).toHaveBeenCalledTimes(2);
    });
  });

  describe('service statistics', () => {
    const mockStats = {
      indexing: {
        totalDocuments: 100,
        totalChunks: 500,
        indexSize: 0.8,
        lastUpdated: new Date()
      },
      search: {
        totalQueries: 50,
        avgResponseTime: 1200,
        avgConfidence: 0.85,
        topQueries: ['business strategy', 'market analysis']
      },
      health: {
        isHealthy: true,
        vectorDbStatus: 'healthy',
        embeddingServiceStatus: 'healthy',
        lastChecked: new Date()
      }
    };

    beforeEach(() => {
      mockIndexingService.getIndexingStats.mockResolvedValue(mockStats.indexing);
      mockSearchService.getSearchStats.mockResolvedValue(mockStats.search);
      mockIndexingService.healthCheck.mockResolvedValue(mockStats.health);
    });

    it('should get comprehensive service statistics', async () => {
      const result = await integratedService.getServiceStats();

      expect(result).toEqual(mockStats);
      expect(mockIndexingService.getIndexingStats).toHaveBeenCalled();
      expect(mockSearchService.getSearchStats).toHaveBeenCalled();
      expect(mockIndexingService.healthCheck).toHaveBeenCalled();
    });

    it('should handle errors in getting statistics', async () => {
      mockIndexingService.getIndexingStats.mockRejectedValue(new Error('Stats failed'));

      await expect(integratedService.getServiceStats()).rejects.toThrow('Stats failed');
    });
  });

  describe('search analytics', () => {
    beforeEach(() => {
      mockSearchService.search.mockResolvedValue({
        answer: 'Test answer',
        sources: [],
        confidence: 0.8,
        suggestions: [],
        processingTime: 1000,
        queryId: 'query_test'
      });
    });

    it('should record and retrieve search analytics', async () => {
      const query: RAGQuery = {
        query: 'test query',
        userId: 'user1',
        context: { sessionId: 'session1' }
      };

      await integratedService.search(query);

      const analytics = integratedService.getSearchAnalytics();
      expect(analytics).toHaveLength(1);
      expect(analytics[0].query).toBe('test query');
      expect(analytics[0].userId).toBe('user1');
    });

    it('should filter analytics by date range', async () => {
      const query: RAGQuery = { query: 'test', userId: 'user1' };
      await integratedService.search(query);

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const analytics = integratedService.getSearchAnalytics({
        startDate: yesterday,
        endDate: tomorrow
      });

      expect(analytics).toHaveLength(1);
    });

    it('should filter analytics by user', async () => {
      const query1: RAGQuery = { query: 'test1', userId: 'user1' };
      const query2: RAGQuery = { query: 'test2', userId: 'user2' };

      await integratedService.search(query1);
      await integratedService.search(query2);

      const user1Analytics = integratedService.getSearchAnalytics({ userId: 'user1' });
      expect(user1Analytics).toHaveLength(1);
      expect(user1Analytics[0].userId).toBe('user1');
    });

    it('should limit analytics results', async () => {
      // Create multiple searches
      for (let i = 0; i < 5; i++) {
        await integratedService.search({ query: `test${i}`, userId: 'user1' });
      }

      const analytics = integratedService.getSearchAnalytics({ limit: 3 });
      expect(analytics).toHaveLength(3);
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      mockSearchService.search.mockResolvedValue({
        answer: 'Test answer',
        sources: [],
        confidence: 0.8,
        suggestions: [],
        processingTime: 1000,
        queryId: 'query_test'
      });
    });

    it('should clear cache manually', async () => {
      const query: RAGQuery = { query: 'test', userId: 'user1' };
      
      // First search
      await integratedService.search(query);
      expect(mockSearchService.search).toHaveBeenCalledTimes(1);

      // Second search should use cache
      await integratedService.search(query);
      expect(mockSearchService.search).toHaveBeenCalledTimes(1);

      // Clear cache
      integratedService.clearCache();

      // Third search should not use cache
      await integratedService.search(query);
      expect(mockSearchService.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        retrieval: {
          defaultTopK: 10,
          defaultSimilarityThreshold: 0.8,
          maxContextLength: 5000
        }
      };

      integratedService.updateConfig(newConfig);

      expect(mockIndexingService.updateConfig).toHaveBeenCalledWith(newConfig);
    });
  });
});

describe('Singleton functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton
    (global as any).ragServiceInstance = null;
  });

  it('should return singleton instance', () => {
    const service1 = getRAGService();
    const service2 = getRAGService();

    expect(service1).toBe(service2);
  });

  it('should initialize RAG service', async () => {
    const mockIndexingService = {
      initialize: jest.fn().mockResolvedValue(undefined)
    };

    MockRAGIndexingService.mockImplementation(() => mockIndexingService as any);

    await initializeRAGService();

    expect(mockIndexingService.initialize).toHaveBeenCalled();
  });

  it('should initialize RAG service with custom config', async () => {
    const customConfig: RAGConfig = {
      vectorDatabase: {
        provider: 'pinecone',
        apiKey: 'custom-key',
        indexName: 'custom-index',
        dimension: 1536
      },
      embeddings: {
        provider: 'openai',
        model: 'custom-model',
        apiKey: 'custom-key',
        dimension: 1536
      },
      chunking: {
        maxChunkSize: 2000,
        chunkOverlap: 400,
        preserveStructure: false
      },
      retrieval: {
        defaultTopK: 10,
        defaultSimilarityThreshold: 0.8,
        maxContextLength: 5000
      }
    };

    const mockIndexingService = {
      initialize: jest.fn().mockResolvedValue(undefined)
    };

    MockRAGIndexingService.mockImplementation(() => mockIndexingService as any);

    await initializeRAGService(customConfig);

    expect(mockIndexingService.initialize).toHaveBeenCalled();
  });
});