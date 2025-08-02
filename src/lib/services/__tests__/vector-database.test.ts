import { VectorDatabaseService } from '../vector-database';
import { DocumentChunk, RAGConfig } from '@/types/rag';
import { Pinecone } from '@pinecone-database/pinecone';

// Mock Pinecone
jest.mock('@pinecone-database/pinecone');
const MockedPinecone = Pinecone as jest.MockedClass<typeof Pinecone>;

describe('VectorDatabaseService', () => {
  let vectorDbService: VectorDatabaseService;
  let mockPinecone: jest.Mocked<Pinecone>;
  let mockIndex: any;

  const mockConfig: RAGConfig['vectorDatabase'] = {
    provider: 'pinecone',
    apiKey: 'test-api-key',
    environment: 'us-east-1-aws',
    indexName: 'test-index',
    dimension: 1536
  };

  beforeEach(() => {
    mockIndex = {
      upsert: jest.fn(),
      query: jest.fn(),
      deleteMany: jest.fn(),
      describeIndexStats: jest.fn()
    };

    mockPinecone = {
      listIndexes: jest.fn(),
      createIndex: jest.fn(),
      index: jest.fn().mockReturnValue(mockIndex)
    } as any;

    MockedPinecone.mockImplementation(() => mockPinecone);
    vectorDbService = new VectorDatabaseService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeIndex', () => {
    it('should create index if it does not exist', async () => {
      mockPinecone.listIndexes.mockResolvedValue({
        indexes: []
      } as any);

      mockIndex.describeIndexStats.mockResolvedValue({
        totalVectorCount: 0
      });

      await vectorDbService.initializeIndex(1536);

      expect(mockPinecone.createIndex).toHaveBeenCalledWith({
        name: 'test-index',
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
    });

    it('should not create index if it already exists', async () => {
      mockPinecone.listIndexes.mockResolvedValue({
        indexes: [{ name: 'test-index' }]
      } as any);

      await vectorDbService.initializeIndex(1536);

      expect(mockPinecone.createIndex).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockPinecone.listIndexes.mockRejectedValue(new Error('API Error'));

      await expect(
        vectorDbService.initializeIndex(1536)
      ).rejects.toThrow('Failed to initialize vector database');
    });
  });

  describe('upsertChunks', () => {
    it('should upsert chunks to the vector database', async () => {
      const chunks: DocumentChunk[] = [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'Test content 1',
          embeddings: new Array(1536).fill(0.1),
          chunkIndex: 0,
          startPosition: 0,
          endPosition: 100,
          metadata: {
            wordCount: 10,
            characterCount: 100
          }
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          content: 'Test content 2',
          embeddings: new Array(1536).fill(0.2),
          chunkIndex: 1,
          startPosition: 100,
          endPosition: 200,
          metadata: {
            wordCount: 10,
            characterCount: 100
          }
        }
      ];

      mockIndex.upsert.mockResolvedValue({});

      await vectorDbService.upsertChunks(chunks);

      expect(mockIndex.upsert).toHaveBeenCalledWith([
        {
          id: 'chunk-1',
          values: chunks[0].embeddings,
          metadata: {
            documentId: 'doc-1',
            content: 'Test content 1',
            chunkIndex: 0,
            startPosition: 0,
            endPosition: 100,
            wordCount: 10,
            characterCount: 100,
            section: undefined,
            heading: undefined,
            pageNumber: undefined
          }
        },
        {
          id: 'chunk-2',
          values: chunks[1].embeddings,
          metadata: {
            documentId: 'doc-1',
            content: 'Test content 2',
            chunkIndex: 1,
            startPosition: 100,
            endPosition: 200,
            wordCount: 10,
            characterCount: 100,
            section: undefined,
            heading: undefined,
            pageNumber: undefined
          }
        }
      ]);
    });

    it('should batch upsert large number of chunks', async () => {
      const chunks: DocumentChunk[] = new Array(250).fill(null).map((_, i) => ({
        id: `chunk-${i}`,
        documentId: 'doc-1',
        content: `Test content ${i}`,
        embeddings: new Array(1536).fill(0.1),
        chunkIndex: i,
        startPosition: i * 100,
        endPosition: (i + 1) * 100,
        metadata: {
          wordCount: 10,
          characterCount: 100
        }
      }));

      mockIndex.upsert.mockResolvedValue({});

      await vectorDbService.upsertChunks(chunks);

      // Should be called 3 times (250 / 100 = 3 batches)
      expect(mockIndex.upsert).toHaveBeenCalledTimes(3);
    });

    it('should handle upsert errors', async () => {
      const chunks: DocumentChunk[] = [{
        id: 'chunk-1',
        documentId: 'doc-1',
        content: 'Test content',
        embeddings: new Array(1536).fill(0.1),
        chunkIndex: 0,
        startPosition: 0,
        endPosition: 100,
        metadata: {
          wordCount: 10,
          characterCount: 100
        }
      }];

      mockIndex.upsert.mockRejectedValue(new Error('Upsert Error'));

      await expect(
        vectorDbService.upsertChunks(chunks)
      ).rejects.toThrow('Failed to upsert chunks');
    });
  });

  describe('searchSimilar', () => {
    it('should search for similar vectors', async () => {
      const queryVector = new Array(1536).fill(0.1);
      const mockResponse = {
        matches: [
          {
            id: 'chunk-1',
            score: 0.95,
            metadata: { content: 'Test content 1' },
            values: queryVector
          },
          {
            id: 'chunk-2',
            score: 0.85,
            metadata: { content: 'Test content 2' }
          }
        ]
      };

      mockIndex.query.mockResolvedValue(mockResponse);

      const request = {
        vector: queryVector,
        topK: 5,
        includeValues: true,
        includeMetadata: true
      };

      const results = await vectorDbService.searchSimilar(request);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('chunk-1');
      expect(results[0].score).toBe(0.95);
      expect(results[0].metadata.content).toBe('Test content 1');
      expect(results[0].values).toEqual(queryVector);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        filter: undefined,
        includeValues: true,
        includeMetadata: true
      });
    });

    it('should handle search with filters', async () => {
      const queryVector = new Array(1536).fill(0.1);
      const filter = { documentId: { $eq: 'doc-1' } };

      mockIndex.query.mockResolvedValue({ matches: [] });

      const request = {
        vector: queryVector,
        topK: 5,
        filter
      };

      await vectorDbService.searchSimilar(request);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        filter,
        includeValues: false,
        includeMetadata: true
      });
    });

    it('should handle search errors', async () => {
      mockIndex.query.mockRejectedValue(new Error('Search Error'));

      const request = {
        vector: new Array(1536).fill(0.1),
        topK: 5
      };

      await expect(
        vectorDbService.searchSimilar(request)
      ).rejects.toThrow('Failed to search vectors');
    });

    it('should return empty array when no matches', async () => {
      mockIndex.query.mockResolvedValue({ matches: null });

      const request = {
        vector: new Array(1536).fill(0.1),
        topK: 5
      };

      const results = await vectorDbService.searchSimilar(request);
      expect(results).toEqual([]);
    });
  });

  describe('deleteChunks', () => {
    it('should delete chunks by IDs', async () => {
      const chunkIds = ['chunk-1', 'chunk-2', 'chunk-3'];
      mockIndex.deleteMany.mockResolvedValue({});

      await vectorDbService.deleteChunks(chunkIds);

      expect(mockIndex.deleteMany).toHaveBeenCalledWith(chunkIds);
    });

    it('should batch delete large number of chunks', async () => {
      const chunkIds = new Array(2500).fill(null).map((_, i) => `chunk-${i}`);
      mockIndex.deleteMany.mockResolvedValue({});

      await vectorDbService.deleteChunks(chunkIds);

      // Should be called 3 times (2500 / 1000 = 3 batches)
      expect(mockIndex.deleteMany).toHaveBeenCalledTimes(3);
    });

    it('should handle delete errors', async () => {
      mockIndex.deleteMany.mockRejectedValue(new Error('Delete Error'));

      await expect(
        vectorDbService.deleteChunks(['chunk-1'])
      ).rejects.toThrow('Failed to delete chunks');
    });
  });

  describe('deleteDocumentChunks', () => {
    it('should delete all chunks for a document', async () => {
      const documentId = 'doc-1';
      mockIndex.deleteMany.mockResolvedValue({});

      await vectorDbService.deleteDocumentChunks(documentId);

      expect(mockIndex.deleteMany).toHaveBeenCalledWith({
        filter: {
          documentId: { $eq: documentId }
        }
      });
    });

    it('should handle document deletion errors', async () => {
      mockIndex.deleteMany.mockRejectedValue(new Error('Delete Error'));

      await expect(
        vectorDbService.deleteDocumentChunks('doc-1')
      ).rejects.toThrow('Failed to delete document chunks');
    });
  });

  describe('getIndexStats', () => {
    it('should return index statistics', async () => {
      const mockStats = {
        totalVectorCount: 1000,
        indexFullness: 0.5
      };

      mockIndex.describeIndexStats.mockResolvedValue(mockStats);

      const stats = await vectorDbService.getIndexStats();

      expect(stats).toEqual(mockStats);
      expect(mockIndex.describeIndexStats).toHaveBeenCalled();
    });

    it('should handle stats errors', async () => {
      mockIndex.describeIndexStats.mockRejectedValue(new Error('Stats Error'));

      await expect(
        vectorDbService.getIndexStats()
      ).rejects.toThrow('Failed to get index stats');
    });
  });

  describe('indexExists', () => {
    it('should return true if index exists', async () => {
      mockPinecone.listIndexes.mockResolvedValue({
        indexes: [{ name: 'test-index' }, { name: 'other-index' }]
      } as any);

      const exists = await vectorDbService.indexExists();

      expect(exists).toBe(true);
    });

    it('should return false if index does not exist', async () => {
      mockPinecone.listIndexes.mockResolvedValue({
        indexes: [{ name: 'other-index' }]
      } as any);

      const exists = await vectorDbService.indexExists();

      expect(exists).toBe(false);
    });

    it('should return false on error', async () => {
      mockPinecone.listIndexes.mockRejectedValue(new Error('API Error'));

      const exists = await vectorDbService.indexExists();

      expect(exists).toBe(false);
    });
  });
});