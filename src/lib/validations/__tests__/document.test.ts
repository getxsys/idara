import { describe, it, expect } from '@jest/globals';
import {
  documentSchema,
  createDocumentSchema,
  updateDocumentSchema,
  ragDocumentSchema,
  ragQuerySchema,
  ragResponseSchema,
  documentMetadataSchema,
  documentChunkSchema,
} from '../document';
import {
  DocumentType,
  DocumentFormat,
  AccessLevel,
  SourceType,
  EntityType,
  RelationshipType,
  ComplexityLevel,
  InsightType,
  IndexingStatus,
} from '@/types/document';

describe('Document Validation Schemas', () => {
  describe('documentMetadataSchema', () => {
    it('should validate valid document metadata', () => {
      const validMetadata = {
        type: DocumentType.REPORT,
        format: DocumentFormat.PDF,
        size: 1024000,
        language: 'en',
        author: 'John Doe',
        source: {
          type: SourceType.UPLOAD,
          filename: 'quarterly-report.pdf',
          uploadedBy: '123e4567-e89b-12d3-a456-426614174000',
        },
        category: 'Financial Reports',
        subcategory: 'Quarterly',
        keywords: ['finance', 'quarterly', 'revenue'],
        summary: 'Q4 2023 financial performance report',
        extractedEntities: [],
        customFields: {},
      };

      const result = documentMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should reject metadata with negative size', () => {
      const invalidMetadata = {
        type: DocumentType.REPORT,
        format: DocumentFormat.PDF,
        size: -1000,
        language: 'en',
        author: 'John Doe',
        source: {
          type: SourceType.UPLOAD,
          filename: 'test.pdf',
        },
        category: 'Reports',
        summary: 'Test document',
        extractedEntities: [],
        customFields: {},
      };

      const result = documentMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with empty author', () => {
      const invalidMetadata = {
        type: DocumentType.REPORT,
        format: DocumentFormat.PDF,
        size: 1000,
        language: 'en',
        author: '',
        source: {
          type: SourceType.UPLOAD,
        },
        category: 'Reports',
        summary: 'Test document',
        extractedEntities: [],
        customFields: {},
      };

      const result = documentMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });
  });

  describe('documentSchema', () => {
    it('should validate a complete document', () => {
      const validDocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Quarterly Business Report',
        content: 'This is the content of the quarterly business report...',
        metadata: {
          type: DocumentType.REPORT,
          format: DocumentFormat.PDF,
          size: 2048000,
          language: 'en',
          author: 'Jane Smith',
          source: {
            type: SourceType.UPLOAD,
            filename: 'q4-report.pdf',
            uploadedBy: '123e4567-e89b-12d3-a456-426614174001',
          },
          category: 'Business Reports',
          keywords: ['business', 'quarterly', 'performance'],
          summary: 'Comprehensive quarterly business performance analysis',
          extractedEntities: [],
          customFields: {},
        },
        embeddings: [0.1, 0.2, 0.3, 0.4, 0.5],
        tags: ['business', 'report', 'q4'],
        accessLevel: AccessLevel.INTERNAL,
        relationships: [],
        versions: [],
        collaborators: [],
        aiAnalysis: {
          sentiment: {
            overall: 0.2,
            confidence: 0.8,
            emotions: [],
            tone: {
              formal: 0.9,
              confident: 0.7,
              analytical: 0.8,
              tentative: 0.2,
            },
          },
          topics: [],
          readabilityScore: 75,
          complexity: ComplexityLevel.MEDIUM,
          keyInsights: [],
          suggestedTags: ['business', 'analysis'],
          relatedDocuments: [],
          qualityScore: 85,
          lastAnalyzed: new Date(),
        },
        lastIndexed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = documentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should reject document with empty title', () => {
      const invalidDocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
        content: 'Some content',
        // ... other fields would be required
      };

      const result = documentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
    });

    it('should reject document with empty content', () => {
      const invalidDocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Document',
        content: '',
        // ... other fields would be required
      };

      const result = documentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
    });
  });

  describe('documentChunkSchema', () => {
    it('should validate a valid document chunk', () => {
      const validChunk = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        content: 'This is a chunk of document content for RAG processing.',
        embeddings: [0.1, 0.2, 0.3, 0.4, 0.5],
        metadata: {
          chunkIndex: 0,
          totalChunks: 5,
          overlapWithPrevious: 0,
          overlapWithNext: 0.1,
          tokenCount: 15,
          characterCount: 65,
        },
        position: {
          startPosition: 0,
          endPosition: 65,
          section: 'Introduction',
          paragraph: 1,
          page: 1,
        },
      };

      const result = documentChunkSchema.safeParse(validChunk);
      expect(result.success).toBe(true);
    });

    it('should reject chunk with empty content', () => {
      const invalidChunk = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        content: '',
        embeddings: [0.1, 0.2, 0.3],
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          overlapWithPrevious: 0,
          overlapWithNext: 0,
          tokenCount: 0,
          characterCount: 0,
        },
        position: {
          startPosition: 0,
          endPosition: 0,
        },
      };

      const result = documentChunkSchema.safeParse(invalidChunk);
      expect(result.success).toBe(false);
    });

    it('should reject chunk with empty embeddings', () => {
      const invalidChunk = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Some content',
        embeddings: [],
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          overlapWithPrevious: 0,
          overlapWithNext: 0,
          tokenCount: 2,
          characterCount: 12,
        },
        position: {
          startPosition: 0,
          endPosition: 12,
        },
      };

      const result = documentChunkSchema.safeParse(invalidChunk);
      expect(result.success).toBe(false);
    });
  });

  describe('ragDocumentSchema', () => {
    it('should validate a RAG document', () => {
      const validRAGDocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'RAG Test Document',
        content: 'This is content for RAG processing.',
        metadata: {
          type: DocumentType.TECHNICAL,
          format: DocumentFormat.MD,
          size: 1000,
          language: 'en',
          author: 'AI System',
          source: {
            type: SourceType.SYSTEM_GENERATED,
          },
          category: 'Technical Documentation',
          keywords: ['rag', 'ai', 'processing'],
          summary: 'Document for RAG system testing',
          extractedEntities: [],
          customFields: {},
        },
        tags: ['rag', 'test'],
        accessLevel: AccessLevel.INTERNAL,
        relationships: [],
        versions: [],
        collaborators: [],
        aiAnalysis: {
          sentiment: {
            overall: 0,
            confidence: 0.5,
            emotions: [],
            tone: {
              formal: 0.8,
              confident: 0.6,
              analytical: 0.9,
              tentative: 0.1,
            },
          },
          topics: [],
          readabilityScore: 80,
          complexity: ComplexityLevel.LOW,
          keyInsights: [],
          suggestedTags: [],
          relatedDocuments: [],
          qualityScore: 90,
          lastAnalyzed: new Date(),
        },
        lastIndexed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        chunks: [],
        indexingStatus: IndexingStatus.COMPLETED,
        retrievalMetrics: {
          queryCount: 0,
          averageRelevanceScore: 0,
          lastQueried: new Date(),
          popularChunks: [],
          retrievalHistory: [],
        },
      };

      const result = ragDocumentSchema.safeParse(validRAGDocument);
      expect(result.success).toBe(true);
    });
  });

  describe('ragQuerySchema', () => {
    it('should validate a valid RAG query', () => {
      const validQuery = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        query: 'What are the key findings from the quarterly report?',
        context: {
          currentProject: '123e4567-e89b-12d3-a456-426614174001',
          userRole: 'analyst',
          workContext: ['financial-analysis', 'reporting'],
          previousQueries: [],
        },
        filters: {
          documentTypes: [DocumentType.REPORT],
          minRelevanceScore: 0.7,
        },
        userId: '123e4567-e89b-12d3-a456-426614174002',
        timestamp: new Date(),
      };

      const result = ragQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should reject query with empty query string', () => {
      const invalidQuery = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        query: '',
        context: {
          userRole: 'analyst',
          workContext: [],
          previousQueries: [],
        },
        filters: {},
        userId: '123e4567-e89b-12d3-a456-426614174002',
        timestamp: new Date(),
      };

      const result = ragQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject query with empty user role', () => {
      const invalidQuery = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        query: 'Test query',
        context: {
          userRole: '',
          workContext: [],
          previousQueries: [],
        },
        filters: {},
        userId: '123e4567-e89b-12d3-a456-426614174002',
        timestamp: new Date(),
      };

      const result = ragQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('ragResponseSchema', () => {
    it('should validate a valid RAG response', () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        query: 'What are the key findings?',
        answer: 'The key findings include improved revenue and customer satisfaction.',
        sources: [
          {
            type: SourceType.UPLOAD,
            filename: 'report.pdf',
          },
        ],
        confidence: 0.85,
        suggestions: ['Review detailed metrics', 'Compare with previous quarters'],
        relatedQueries: ['What caused the revenue increase?'],
        processingTime: 1250,
        timestamp: new Date(),
      };

      const result = ragResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response with empty query', () => {
      const invalidResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        query: '',
        answer: 'Some answer',
        sources: [],
        confidence: 0.8,
        suggestions: [],
        relatedQueries: [],
        processingTime: 1000,
        timestamp: new Date(),
      };

      const result = ragResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject response with empty answer', () => {
      const invalidResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        query: 'Test query',
        answer: '',
        sources: [],
        confidence: 0.8,
        suggestions: [],
        relatedQueries: [],
        processingTime: 1000,
        timestamp: new Date(),
      };

      const result = ragResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('createDocumentSchema', () => {
    it('should validate document creation data', () => {
      const createData = {
        title: 'New Document',
        content: 'This is the content of the new document.',
        metadata: {
          type: DocumentType.MANUAL,
          format: DocumentFormat.MD,
          language: 'en',
          author: 'User',
          source: {
            type: SourceType.MANUAL_ENTRY,
          },
          category: 'Documentation',
          keywords: ['manual', 'documentation'],
          summary: 'User-created documentation',
          customFields: {},
        },
        tags: ['manual'],
        accessLevel: AccessLevel.INTERNAL,
        collaborators: [],
      };

      const result = createDocumentSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateDocumentSchema', () => {
    it('should validate partial document update data', () => {
      const updateData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Document Title',
        tags: ['updated', 'modified'],
      };

      const result = updateDocumentSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should require id field for updates', () => {
      const updateData = {
        title: 'Updated Document Title',
      };

      const result = updateDocumentSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });
});