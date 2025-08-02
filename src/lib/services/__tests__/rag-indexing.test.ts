import { RAGIndexingService } from '../rag-indexing';
import { VectorDatabaseService } from '../vector-database';
import { EmbeddingService } from '../embedding';
import { DocumentProcessor } from '../document-processor';
import { AccessLevel, DocumentType, IndexingStatus, RAGConfig } from '@/types/rag';

// Mock the services
jest.mock('../vector-database');
jest.mock('../embedding');
jest.mock('../document-processor');

const MockedVectorDatabaseService = VectorDatabaseService as jest.MockedClass<typeof VectorDatabaseService>;
const MockedEmbeddingService = EmbeddingService as jest.MockedClass<typeof EmbeddingService>;
const MockedDocumentProcessor = DocumentProcessor as jest.MockedClass<typeof DocumentProcessor>;

describe('RAGIndexingService', () => {
  let ragIndexingService: RAGIndexingService;
  let mockVectorDb: jest.Mocked<VectorDatabaseService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockDocumentProcessor: jest.Mocked<DocumentProcessor>;

  const mockConfig: RAGConfig = {
    vectorDatabase: {
      provider: 'pinecone',
      apiKey: 'test-api-key',
      environment: 'us-east-1-aws',
      indexName: 'test-index',
      dimension: 1536
    },
    embeddings: {
      provider: 'openai',
      model: 'text-embedding-ada-002',
      apiKey: 'test-openai-key',
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

  beforeEach(() => {
    mockVectorDb = {
      initializeIndex: jest.fn(),
      upsertChunks: jest.fn(),
      deleteDocumentChunks: jest.fn(),
      getIndexStats: jest.fn()
    } as any;

    mockEmbeddingService = {
      generateBatchEmbeddings: jest.fn()
    } as any;

    mockDocumentProcessor = {
      processDocument: jest.fn(),
      chunkDocument: jest.fn()
    } as any;

    MockedVectorDatabaseService.mockImplementation(() => mockVectorDb);
    MockedEmbeddingService.mockImplementation(() => mockEmbeddingService);
    MockedDocumentProcessor.mockImplementation(() => mockDocumentProcessor);

    // Mock static method
    (DocumentProcessor.getDocumentType as jest.Mock) = jest.fn();

    ragIndexingService = new RAGIndexingService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the RAG system successfully', async () => {
      mockVectorDb.initializeIndex.mockResolvedValue();

      await ragIndexingService.initialize();

      expect(mockVectorDb.initializeIndex).toHaveBeenCalledWith(1536);
    });

    it('should handle initialization errors', async () => {
      mockVectorDb.initializeIndex.mockRejectedValue(new Error('Init Error'));

      await expect(ragIndexingService.initialize()).rejects.toThrow('Init Error');
    });
  });

  describe('indexDocument', () => {
    const mockFile = Buffer.from('Test document content', 'utf-8');
    const mockFileName = 'test.txt';
    const mockOptions = {
      accessLevel: AccessLevel.INTERNAL,
      tags: ['test', 'document'],
      category: 'test-category',
      userId: 'user-123'
    };

    beforeEach(() => {
      (DocumentProcessor.getDocumentType as jest.Mock).mockReturnValue(DocumentType.TXT);
      
      mockDocumentProcessor.processDocument.mockResolvedValue({
        content: 'Processed document content',
        metadata: {
          fileName: mockFileName,
          fileType: DocumentType.TXT,
          fileSize: mockFile.length,
          language: 'en',
          keywords: ['test', 'document'],
          summary: 'Test document summary'
        }
      });

      mockDocumentProcessor.chunkDocument.mockReturnValue([
        {
          id: 'chunk-1',
          documentId: 'doc-123',
          content: 'First chunk content',
          embeddings: [],
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
          documentId: 'doc-123',
          content: 'Second chunk content',
          embeddings: [],
          chunkIndex: 1,
          startPosition: 100,
          endPosition: 200,
          metadata: {
            wordCount: 10,
            characterCount: 100
          }
        }
      ]);

      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        {
          embeddings: new Array(1536).fill(0.1),
          model: 'text-embedding-ada-002',
          usage: { promptTokens: 10, totalTokens: 10 }
        },
        {
          embeddings: new Array(1536).fill(0.2),
          model: 'text-embedding-ada-002',
          usage: { promptTokens: 10, totalTokens: 10 }
        }
      ]);

      mockVectorDb.upsertChunks.mockResolvedValue();
    });

    it('should successfully index a document', async () => {
      const job = await ragIndexingService.indexDocument(mockFile, mockFileName, mockOptions);

      expect(job.status).toBe(IndexingStatus.COMPLETED);
      expect(job.progress).toBe(100);
      expect(job.chunksProcessed).toBe(2);
      expect(job.totalChunks).toBe(2);
      expect(job.completedAt).toBeDefined();

      expect(DocumentProcessor.getDocumentType).toHaveBeenCalledWith(mockFileName);
      expect(mockDocumentProcessor.processDocument).toHaveBeenCalledWith(
        mockFile,
        mockFileName,
        DocumentType.TXT
      );
      expect(mockDocumentProcessor.chunkDocument).toHaveBeenCalled();
      expect(mockEmbeddingService.generateBatchEmbeddings).toHaveBeenCalledWith([
        'First chunk content',
        'Second chunk content'
      ]);
      expect(mockVectorDb.upsertChunks).toHaveBeenCalled();
    });

    it('should handle document processing errors', async () => {
      mockDocumentProcessor.processDocument.mockRejectedValue(new Error('Processing Error'));

      const job = await expect(
        ragIndexingService.indexDocument(mockFile, mockFileName, mockOptions)
      ).rejects.toThrow('Processing Error');
    });

    it('should handle embedding generation errors', async () => {
      mockEmbeddingService.generateBatchEmbeddings.mockRejectedValue(new Error('Embedding Error'));

      await expect(
        ragIndexingService.indexDocument(mockFile, mockFileName, mockOptions)
      ).rejects.toThrow('Embedding Error');
    });

    it('should handle vector database errors', async () => {
      mockVectorDb.upsertChunks.mockRejectedValue(new Error('Vector DB Error'));

      await expect(
        ragIndexingService.indexDocument(mockFile, mockFileName, mockOptions)
      ).rejects.toThrow('Vector DB Error');
    });

    it('should set default access level if not provided', async () => {
      const optionsWithoutAccessLevel = {
        tags: ['test'],
        userId: 'user-123'
      };

      const job = await ragIndexingService.indexDocument(
        mockFile,
        mockFileName,
        optionsWithoutAccessLevel
      );

      expect(job.status).toBe(IndexingStatus.COMPLETED);
    });
  });

  describe('indexDocuments', () => {
    it('should index multiple documents', async () => {
      const documents = [
        {
          file: Buffer.from('Document 1', 'utf-8'),
          fileName: 'doc1.txt',
          options: { userId: 'user-123' }
        },
        {
          file: Buffer.from('Document 2', 'utf-8'),
          fileName: 'doc2.txt',
          options: { userId: 'user-123' }
        }
      ];

      // Setup mocks for successful indexing
      (DocumentProcessor.getDocumentType as jest.Mock).mockReturnValue(DocumentType.TXT);
      mockDocumentProcessor.processDocument.mockResolvedValue({
        content: 'Processed content',
        metadata: {
          fileName: 'test.txt',
          fileType: DocumentType.TXT,
          fileSize: 100
        }
      });
      mockDocumentProcessor.chunkDocument.mockReturnValue([{
        id: 'chunk-1',
        documentId: 'doc-123',
        content: 'Chunk content',
        embeddings: [],
        chunkIndex: 0,
        startPosition: 0,
        endPosition: 100,
        metadata: { wordCount: 10, characterCount: 100 }
      }]);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([{
        embeddings: new Array(1536).fill(0.1),
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 10, totalTokens: 10 }
      }]);
      mockVectorDb.upsertChunks.mockResolvedValue();

      const jobs = await ragIndexingService.indexDocuments(documents);

      expect(jobs).toHaveLength(2);
      expect(jobs[0].status).toBe(IndexingStatus.COMPLETED);
      expect(jobs[1].status).toBe(IndexingStatus.COMPLETED);
    });

    it('should continue processing other documents if one fails', async () => {
      const documents = [
        {
          file: Buffer.from('Document 1', 'utf-8'),
          fileName: 'doc1.txt',
          options: { userId: 'user-123' }
        },
        {
          file: Buffer.from('Document 2', 'utf-8'),
          fileName: 'doc2.txt',
          options: { userId: 'user-123' }
        }
      ];

      (DocumentProcessor.getDocumentType as jest.Mock)
        .mockReturnValueOnce(DocumentType.TXT)
        .mockImplementationOnce(() => {
          throw new Error('Unsupported file type');
        });

      // Setup successful processing for first document
      mockDocumentProcessor.processDocument.mockResolvedValue({
        content: 'Processed content',
        metadata: {
          fileName: 'test.txt',
          fileType: DocumentType.TXT,
          fileSize: 100
        }
      });
      mockDocumentProcessor.chunkDocument.mockReturnValue([{
        id: 'chunk-1',
        documentId: 'doc-123',
        content: 'Chunk content',
        embeddings: [],
        chunkIndex: 0,
        startPosition: 0,
        endPosition: 100,
        metadata: { wordCount: 10, characterCount: 100 }
      }]);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([{
        embeddings: new Array(1536).fill(0.1),
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 10, totalTokens: 10 }
      }]);
      mockVectorDb.upsertChunks.mockResolvedValue();

      const jobs = await ragIndexingService.indexDocuments(documents);

      expect(jobs).toHaveLength(1); // Only successful document
      expect(jobs[0].status).toBe(IndexingStatus.COMPLETED);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document chunks', async () => {
      const documentId = 'doc-123';
      mockVectorDb.deleteDocumentChunks.mockResolvedValue();

      await ragIndexingService.deleteDocument(documentId);

      expect(mockVectorDb.deleteDocumentChunks).toHaveBeenCalledWith(documentId);
    });

    it('should handle deletion errors', async () => {
      mockVectorDb.deleteDocumentChunks.mockRejectedValue(new Error('Delete Error'));

      await expect(
        ragIndexingService.deleteDocument('doc-123')
      ).rejects.toThrow('Delete Error');
    });
  });

  describe('getIndexingStats', () => {
    it('should return indexing statistics', async () => {
      const mockStats = {
        namespaces: {
          '': { vectorCount: 100 }
        },
        totalVectorCount: 100,
        indexFullness: 0.5
      };

      mockVectorDb.getIndexStats.mockResolvedValue(mockStats);

      const stats = await ragIndexingService.getIndexingStats();

      expect(stats.totalDocuments).toBe(100);
      expect(stats.totalChunks).toBe(100);
      expect(stats.indexSize).toBe(0.5);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle missing stats gracefully', async () => {
      mockVectorDb.getIndexStats.mockResolvedValue({});

      const stats = await ragIndexingService.getIndexingStats();

      expect(stats.totalDocuments).toBe(0);
      expect(stats.totalChunks).toBe(0);
      expect(stats.indexSize).toBe(0);
    });
  });

  describe('validateDocument', () => {
    it('should validate a valid document', () => {
      const file = Buffer.from('Valid content', 'utf-8');
      (DocumentProcessor.getDocumentType as jest.Mock).mockReturnValue(DocumentType.TXT);

      const result = ragIndexingService.validateDocument(file, 'test.txt');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const file = Buffer.alloc(60 * 1024 * 1024); // 60MB
      (DocumentProcessor.getDocumentType as jest.Mock).mockReturnValue(DocumentType.TXT);

      const result = ragIndexingService.validateDocument(file, 'large.txt');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds 50MB limit');
    });

    it('should reject unsupported file types', () => {
      const file = Buffer.from('Content', 'utf-8');
      (DocumentProcessor.getDocumentType as jest.Mock).mockImplementation(() => {
        throw new Error('Unsupported file type');
      });

      const result = ragIndexingService.validateDocument(file, 'test.xyz');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported file type');
    });

    it('should reject empty files', () => {
      const file = Buffer.alloc(0);
      (DocumentProcessor.getDocumentType as jest.Mock).mockReturnValue(DocumentType.TXT);

      const result = ragIndexingService.validateDocument(file, 'empty.txt');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are working', async () => {
      mockVectorDb.getIndexStats.mockResolvedValue({});
      mockEmbeddingService.generateEmbedding = jest.fn().mockResolvedValue({
        embeddings: new Array(1536).fill(0.1),
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 1, totalTokens: 1 }
      });

      const health = await ragIndexingService.healthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.vectorDbStatus).toBe('healthy');
      expect(health.embeddingServiceStatus).toBe('healthy');
      expect(health.lastChecked).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when vector database fails', async () => {
      mockVectorDb.getIndexStats.mockRejectedValue(new Error('DB Error'));
      mockEmbeddingService.generateEmbedding = jest.fn().mockResolvedValue({
        embeddings: new Array(1536).fill(0.1),
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 1, totalTokens: 1 }
      });

      const health = await ragIndexingService.healthCheck();

      expect(health.isHealthy).toBe(false);
      expect(health.vectorDbStatus).toBe('unhealthy');
      expect(health.embeddingServiceStatus).toBe('healthy');
    });

    it('should return unhealthy status when embedding service fails', async () => {
      mockVectorDb.getIndexStats.mockResolvedValue({});
      mockEmbeddingService.generateEmbedding = jest.fn().mockRejectedValue(new Error('Embedding Error'));

      const health = await ragIndexingService.healthCheck();

      expect(health.isHealthy).toBe(false);
      expect(health.vectorDbStatus).toBe('healthy');
      expect(health.embeddingServiceStatus).toBe('unhealthy');
    });
  });

  describe('configuration management', () => {
    it('should return current configuration', () => {
      const config = ragIndexingService.getConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should update configuration', () => {
      const newConfig = {
        chunking: {
          maxChunkSize: 1500,
          chunkOverlap: 300,
          preserveStructure: false
        }
      };

      ragIndexingService.updateConfig(newConfig);

      const updatedConfig = ragIndexingService.getConfig();
      expect(updatedConfig.chunking.maxChunkSize).toBe(1500);
      expect(updatedConfig.chunking.chunkOverlap).toBe(300);
      expect(updatedConfig.chunking.preserveStructure).toBe(false);
    });
  });
});