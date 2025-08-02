import { RAGSearchService, SearchResult } from '../rag-search';
import { VectorDatabaseService } from '../vector-database';
import { EmbeddingService } from '../embedding';
import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  VectorSearchResult,
  AccessLevel,
  QueryContext,
  SearchFilters,
  RAGConfig
} from '@/types/rag';

// Mock the dependencies
jest.mock('../vector-database');
jest.mock('../embedding');

const MockVectorDatabaseService = VectorDatabaseService as jest.MockedClass<typeof VectorDatabaseService>;
const MockEmbeddingService = EmbeddingService as jest.MockedClass<typeof EmbeddingService>;

describe('RAGSearchService', () => {
  let ragSearchService: RAGSearchService;
  let mockVectorDb: jest.Mocked<VectorDatabaseService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockConfig: RAGConfig;

  beforeEach(() => {
    // Reset mocks
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

    // Create mocked instances
    mockVectorDb = new MockVectorDatabaseService(mockConfig.vectorDatabase) as jest.Mocked<VectorDatabaseService>;
    mockEmbeddingService = new MockEmbeddingService(mockConfig.embeddings) as jest.Mocked<EmbeddingService>;

    // Mock constructor calls
    MockVectorDatabaseService.mockImplementation(() => mockVectorDb);
    MockEmbeddingService.mockImplementation(() => mockEmbeddingService);

    ragSearchService = new RAGSearchService(mockConfig);
  });

  describe('search', () => {
    const mockQuery: RAGQuery = {
      query: 'business strategy planning',
      userId: 'test-user',
      maxResults: 5,
      similarityThreshold: 0.5 // Lower threshold to allow test results through
    };

    const mockEmbeddingResponse = {
      embeddings: [0.1, 0.2, 0.3, 0.4, 0.5],
      model: 'text-embedding-ada-002',
      usage: { promptTokens: 10, totalTokens: 10 }
    };

    const mockVectorResults: VectorSearchResult[] = [
      {
        id: 'chunk_1',
        score: 0.95,
        metadata: {
          documentId: 'doc_1',
          title: 'Business Strategy 2024',
          content: 'Our business strategy focuses on growth and innovation.',
          fileName: 'strategy-2024.pdf',
          author: 'John Doe',
          createdDate: '2024-01-15T00:00:00Z',
          accessLevel: AccessLevel.INTERNAL,
          category: 'strategy'
        }
      },
      {
        id: 'chunk_2',
        score: 0.87,
        metadata: {
          documentId: 'doc_2',
          title: 'Market Analysis Report',
          content: 'Market analysis shows strong growth potential in emerging markets.',
          fileName: 'market-analysis.pdf',
          author: 'Jane Smith',
          createdDate: '2024-02-01T00:00:00Z',
          accessLevel: AccessLevel.INTERNAL,
          category: 'analysis'
        }
      }
    ];

    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbeddingResponse);
      mockVectorDb.searchSimilar.mockResolvedValue(mockVectorResults);
    });

    it('should perform semantic search successfully', async () => {
      const result = await ragSearchService.search(mockQuery);

      expect(result).toBeDefined();
      expect(result.sources.length).toBeGreaterThanOrEqual(1);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.queryId).toBeDefined();
    });

    it('should generate embeddings for the query', async () => {
      await ragSearchService.search(mockQuery);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith({
        text: mockQuery.query
      });
    });

    it('should call vector database with correct parameters', async () => {
      await ragSearchService.search(mockQuery);

      expect(mockVectorDb.searchSimilar).toHaveBeenCalledWith({
        vector: mockEmbeddingResponse.embeddings,
        topK: 10, // maxResults * 2 for re-ranking
        filter: {},
        includeMetadata: true,
        includeValues: false
      });
    });

    it('should apply similarity threshold filtering', async () => {
      const lowScoreResults: VectorSearchResult[] = [
        {
          id: 'chunk_low',
          score: 0.5, // Below threshold
          metadata: {
            documentId: 'doc_low',
            title: 'Low Relevance Doc',
            content: 'This document has low relevance.',
            fileName: 'low-relevance.txt'
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(lowScoreResults);

      const result = await ragSearchService.search(mockQuery);

      expect(result.sources).toHaveLength(0); // Should be filtered out
    });

    it('should limit results to maxResults', async () => {
      const manyResults: VectorSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `chunk_${i}`,
        score: 0.9 - (i * 0.02), // Smaller decrement to stay above threshold
        metadata: {
          documentId: `doc_${i}`,
          title: `Document ${i}`,
          content: `Content for document ${i}`,
          fileName: `doc${i}.txt`
        }
      }));

      mockVectorDb.searchSimilar.mockResolvedValue(manyResults);

      const result = await ragSearchService.search(mockQuery);

      expect(result.sources).toHaveLength(5); // Limited by maxResults
    });

    it('should handle search errors gracefully', async () => {
      mockVectorDb.searchSimilar.mockRejectedValue(new Error('Vector search failed'));

      await expect(ragSearchService.search(mockQuery)).rejects.toThrow('Search failed');
    });
  });

  describe('search with filters', () => {
    const mockQueryWithFilters: RAGQuery = {
      query: 'project management',
      userId: 'test-user',
      filters: {
        documentTypes: ['pdf', 'docx'],
        categories: ['project', 'management'],
        accessLevel: AccessLevel.INTERNAL,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        authors: ['John Doe'],
        tags: ['project', 'planning']
      }
    };

    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });
      mockVectorDb.searchSimilar.mockResolvedValue([]);
    });

    it('should apply search filters correctly', async () => {
      await ragSearchService.search(mockQueryWithFilters);

      expect(mockVectorDb.searchSimilar).toHaveBeenCalledWith({
        vector: expect.any(Array),
        topK: expect.any(Number),
        filter: {
          accessLevel: { $eq: AccessLevel.INTERNAL },
          fileType: { $in: ['pdf', 'docx'] },
          category: { $in: ['project', 'management'] },
          author: { $in: ['John Doe'] },
          createdDate: {
            $gte: '2024-01-01T00:00:00.000Z',
            $lte: '2024-12-31T00:00:00.000Z'
          },
          tags: { $in: ['project', 'planning'] }
        },
        includeMetadata: true,
        includeValues: false
      });
    });
  });

  describe('search with context', () => {
    const mockContext: QueryContext = {
      currentProject: 'project-123',
      currentClient: 'client-456',
      userRole: 'manager',
      workspaceId: 'workspace-789',
      sessionId: 'session-abc'
    };

    const mockQueryWithContext: RAGQuery = {
      query: 'client requirements',
      userId: 'test-user',
      context: mockContext
    };

    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });
    });

    it('should apply context-based filtering', async () => {
      mockVectorDb.searchSimilar.mockResolvedValue([]);

      await ragSearchService.search(mockQueryWithContext);

      expect(mockVectorDb.searchSimilar).toHaveBeenCalledWith({
        vector: expect.any(Array),
        topK: expect.any(Number),
        filter: {
          projectId: { $eq: 'project-123' },
          clientId: { $eq: 'client-456' },
          workspaceId: { $eq: 'workspace-789' }
        },
        includeMetadata: true,
        includeValues: false
      });
    });

    it('should boost context-matching results', async () => {
      const contextResults: VectorSearchResult[] = [
        {
          id: 'chunk_context',
          score: 0.8,
          metadata: {
            documentId: 'doc_context',
            title: 'Project Document',
            content: 'This document is related to the current project.',
            projectId: 'project-123', // Matches context
            clientId: 'client-456' // Matches context
          }
        },
        {
          id: 'chunk_no_context',
          score: 0.85,
          metadata: {
            documentId: 'doc_no_context',
            title: 'General Document',
            content: 'This is a general document.'
            // No context match
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(contextResults);

      const result = await ragSearchService.search(mockQueryWithContext);

      // The context-matching document should be ranked higher despite lower similarity score
      expect(result.sources[0].documentId).toBe('doc_context');
    });

    it('should filter out restricted documents for viewer role', async () => {
      const restrictedResults: VectorSearchResult[] = [
        {
          id: 'chunk_restricted',
          score: 0.9,
          metadata: {
            documentId: 'doc_restricted',
            title: 'Confidential Document',
            content: 'This is confidential information.',
            accessLevel: AccessLevel.CONFIDENTIAL
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(restrictedResults);

      const viewerQuery: RAGQuery = {
        ...mockQueryWithContext,
        context: { ...mockContext, userRole: 'viewer' }
      };

      const result = await ragSearchService.search(viewerQuery);

      expect(result.sources).toHaveLength(0); // Should be filtered out
    });
  });

  describe('retrieveContextualDocuments', () => {
    const mockContext: QueryContext = {
      currentProject: 'project-123',
      sessionId: 'session-abc'
    };

    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });

      mockVectorDb.searchSimilar.mockResolvedValue([
        {
          id: 'chunk_1',
          score: 0.9,
          metadata: {
            documentId: 'doc_1',
            title: 'Contextual Document',
            content: 'This document is contextually relevant.',
            projectId: 'project-123'
          }
        }
      ]);
    });

    it('should retrieve contextual documents', async () => {
      const result = await ragSearchService.retrieveContextualDocuments(
        'project requirements',
        mockContext,
        3
      );

      expect(result).toHaveLength(1);
      expect(result[0].documentId).toBe('doc_1');
      expect(result[0].title).toBe('Contextual Document');
    });
  });

  describe('findSimilarDocuments', () => {
    beforeEach(() => {
      // Mock finding the source document
      mockVectorDb.searchSimilar
        .mockResolvedValueOnce([
          {
            id: 'source_chunk',
            score: 1.0,
            metadata: { documentId: 'source_doc' },
            values: [0.1, 0.2, 0.3, 0.4, 0.5]
          }
        ])
        // Mock finding similar documents
        .mockResolvedValueOnce([
          {
            id: 'similar_chunk',
            score: 0.85,
            metadata: {
              documentId: 'similar_doc',
              title: 'Similar Document',
              content: 'This document is similar to the source.'
            }
          }
        ]);
    });

    it('should find similar documents', async () => {
      const result = await ragSearchService.findSimilarDocuments('source_doc', 3);

      expect(result).toHaveLength(1);
      expect(result[0].documentId).toBe('similar_doc');
      expect(result[0].title).toBe('Similar Document');
    });

    it('should exclude the source document from results', async () => {
      await ragSearchService.findSimilarDocuments('source_doc', 3);
      
      expect(mockVectorDb.searchSimilar).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { documentId: { $ne: 'source_doc' } }
        })
      );
    });

    it('should handle case when source document is not found', async () => {
      // Reset the mock to only return empty for this test
      mockVectorDb.searchSimilar.mockReset();
      mockVectorDb.searchSimilar.mockResolvedValue([]); // No source document found

      const result = await ragSearchService.findSimilarDocuments('nonexistent_doc', 3);

      expect(result).toHaveLength(0);
    });
  });

  describe('confidence scoring', () => {
    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });
    });

    it('should boost confidence for recent documents', async () => {
      const recentResult: VectorSearchResult[] = [
        {
          id: 'recent_chunk',
          score: 0.8,
          metadata: {
            documentId: 'recent_doc',
            title: 'Recent Document',
            content: 'This is a recent document.',
            createdDate: new Date().toISOString() // Very recent
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(recentResult);

      const result = await ragSearchService.search({
        query: 'test query',
        userId: 'test-user',
        similarityThreshold: 0.5 // Lower threshold to allow results through
      });

      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should boost confidence for confidential documents', async () => {
      const confidentialResult: VectorSearchResult[] = [
        {
          id: 'confidential_chunk',
          score: 0.8,
          metadata: {
            documentId: 'confidential_doc',
            title: 'Confidential Document',
            content: 'This is confidential information.',
            accessLevel: AccessLevel.CONFIDENTIAL
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(confidentialResult);

      const result = await ragSearchService.search({
        query: 'test query',
        userId: 'test-user',
        similarityThreshold: 0.5 // Lower threshold to allow results through
      });

      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('citation generation', () => {
    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });
    });

    it('should generate proper citations', async () => {
      const resultWithMetadata: VectorSearchResult[] = [
        {
          id: 'chunk_citation',
          score: 0.9,
          metadata: {
            documentId: 'doc_citation',
            title: 'Test Document',
            content: 'Test content',
            author: 'John Doe',
            createdDate: '2024-01-15T00:00:00Z'
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(resultWithMetadata);

      const result = await ragSearchService.search({
        query: 'test query',
        userId: 'test-user'
      });

      expect(result.sources[0].citation).toBe('Test Document by John Doe (1/15/2024)');
    });

    it('should handle missing metadata in citations', async () => {
      const resultWithoutMetadata: VectorSearchResult[] = [
        {
          id: 'chunk_no_metadata',
          score: 0.9,
          metadata: {
            documentId: 'doc_no_metadata',
            content: 'Test content'
            // Missing title, author, createdDate
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(resultWithoutMetadata);

      const result = await ragSearchService.search({
        query: 'test query',
        userId: 'test-user',
        similarityThreshold: 0.5 // Lower threshold to allow results through
      });

      expect(result.sources[0].citation).toBe('Untitled by Unknown (Unknown date)');
    });
  });

  describe('highlight extraction', () => {
    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });
    });

    it('should extract relevant highlights', async () => {
      const resultWithContent: VectorSearchResult[] = [
        {
          id: 'chunk_highlights',
          score: 0.9,
          metadata: {
            documentId: 'doc_highlights',
            title: 'Document with Highlights',
            content: 'This document contains business strategy information. The strategy focuses on growth. Our business model is innovative.'
          }
        }
      ];

      mockVectorDb.searchSimilar.mockResolvedValue(resultWithContent);

      const result = await ragSearchService.search({
        query: 'business strategy',
        userId: 'test-user',
        similarityThreshold: 0.5 // Lower threshold to allow results through
      });

      const source = result.sources[0];
      expect(source.content).toContain('business strategy');
      // Highlights would be extracted based on query terms
    });
  });

  describe('error handling', () => {
    it('should handle embedding service errors', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding failed'));

      await expect(ragSearchService.search({
        query: 'test query',
        userId: 'test-user'
      })).rejects.toThrow('Search failed');
    });

    it('should handle vector database errors', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embeddings: [0.1, 0.2, 0.3],
        model: 'test-model',
        usage: { promptTokens: 5, totalTokens: 5 }
      });

      mockVectorDb.searchSimilar.mockRejectedValue(new Error('Vector search failed'));

      await expect(ragSearchService.search({
        query: 'test query',
        userId: 'test-user'
      })).rejects.toThrow('Search failed');
    });
  });

  describe('search statistics', () => {
    it('should return search statistics', async () => {
      const stats = await ragSearchService.getSearchStats();

      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('avgResponseTime');
      expect(stats).toHaveProperty('avgConfidence');
      expect(stats).toHaveProperty('topQueries');
    });
  });
});