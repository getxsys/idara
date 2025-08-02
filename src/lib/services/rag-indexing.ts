import {
  KnowledgeDocument,
  DocumentChunk,
  IndexingJob,
  IndexingStatus,
  DocumentType,
  AccessLevel,
  RAGConfig
} from '@/types/rag';
import { VectorDatabaseService } from './vector-database';
import { EmbeddingService } from './embedding';
import { DocumentProcessor } from './document-processor';

export class RAGIndexingService {
  private vectorDb: VectorDatabaseService;
  private embeddingService: EmbeddingService;
  private documentProcessor: DocumentProcessor;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;
    this.vectorDb = new VectorDatabaseService(config.vectorDatabase);
    this.embeddingService = new EmbeddingService(config.embeddings);
    this.documentProcessor = new DocumentProcessor(config.chunking);
  }

  /**
   * Initialize the RAG system
   */
  async initialize(): Promise<void> {
    try {
      await this.vectorDb.initializeIndex(this.config.embeddings.dimension);
      console.log('RAG indexing service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG indexing service:', error);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(
    file: Buffer,
    fileName: string,
    options: {
      accessLevel?: AccessLevel;
      tags?: string[];
      category?: string;
      userId: string;
    }
  ): Promise<IndexingJob> {
    const documentId = this.generateDocumentId(fileName);
    const job: IndexingJob = {
      id: this.generateJobId(),
      documentId,
      status: IndexingStatus.PENDING,
      progress: 0,
      startedAt: new Date(),
      chunksProcessed: 0,
      totalChunks: 0
    };

    try {
      // Update job status
      job.status = IndexingStatus.PROCESSING;

      // Determine document type
      const documentType = DocumentProcessor.getDocumentType(fileName);

      // Process document
      const { content, metadata } = await this.documentProcessor.processDocument(
        file,
        fileName,
        documentType
      );

      // Create knowledge document
      const knowledgeDoc: KnowledgeDocument = {
        id: documentId,
        title: fileName,
        content,
        metadata: {
          ...metadata,
          category: options.category
        },
        tags: options.tags || [],
        accessLevel: options.accessLevel || AccessLevel.INTERNAL,
        lastIndexed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Chunk the document
      const chunks = this.documentProcessor.chunkDocument(
        documentId,
        content,
        metadata
      );

      job.totalChunks = chunks.length;

      // Generate embeddings for chunks
      const chunkTexts = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddingService.generateBatchEmbeddings(chunkTexts);

      // Add embeddings to chunks
      const enrichedChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        embeddings: embeddings[index].embeddings
      }));

      // Store chunks in vector database
      await this.vectorDb.upsertChunks(enrichedChunks);

      // Update job progress
      job.chunksProcessed = chunks.length;
      job.progress = 100;
      job.status = IndexingStatus.COMPLETED;
      job.completedAt = new Date();

      console.log(`Successfully indexed document: ${fileName} with ${chunks.length} chunks`);

      return job;
    } catch (error) {
      console.error('Error indexing document:', error);
      job.status = IndexingStatus.FAILED;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(
    documents: Array<{
      file: Buffer;
      fileName: string;
      options: {
        accessLevel?: AccessLevel;
        tags?: string[];
        category?: string;
        userId: string;
      };
    }>
  ): Promise<IndexingJob[]> {
    const jobs: IndexingJob[] = [];

    for (const doc of documents) {
      try {
        const job = await this.indexDocument(doc.file, doc.fileName, doc.options);
        jobs.push(job);
      } catch (error) {
        console.error(`Failed to index document ${doc.fileName}:`, error);
        // Continue with other documents
      }
    }

    return jobs;
  }

  /**
   * Re-index an existing document
   */
  async reindexDocument(documentId: string, file: Buffer, fileName: string): Promise<IndexingJob> {
    try {
      // Delete existing chunks
      await this.vectorDb.deleteDocumentChunks(documentId);

      // Index the document again
      return await this.indexDocument(file, fileName, {
        userId: 'system' // System re-indexing
      });
    } catch (error) {
      console.error('Error re-indexing document:', error);
      throw error;
    }
  }

  /**
   * Delete a document from the index
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.vectorDb.deleteDocumentChunks(documentId);
      console.log(`Successfully deleted document: ${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get indexing statistics
   */
  async getIndexingStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    indexSize: number;
    lastUpdated: Date;
  }> {
    try {
      const stats = await this.vectorDb.getIndexStats();
      
      return {
        totalDocuments: stats.namespaces?.['']?.vectorCount || 0,
        totalChunks: stats.totalVectorCount || 0,
        indexSize: stats.indexFullness || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting indexing stats:', error);
      throw error;
    }
  }

  /**
   * Validate document before indexing
   */
  validateDocument(file: Buffer, fileName: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check file size (max 50MB)
    if (file.length > 50 * 1024 * 1024) {
      errors.push('File size exceeds 50MB limit');
    }

    // Check file type
    try {
      DocumentProcessor.getDocumentType(fileName);
    } catch (error) {
      errors.push('Unsupported file type');
    }

    // Check if file is empty
    if (file.length === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract metadata without full indexing
   */
  async extractMetadata(file: Buffer, fileName: string): Promise<any> {
    try {
      const documentType = DocumentProcessor.getDocumentType(fileName);
      const { metadata } = await this.documentProcessor.processDocument(
        file,
        fileName,
        documentType
      );
      return metadata;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      throw error;
    }
  }

  /**
   * Check if vector database is healthy
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    vectorDbStatus: string;
    embeddingServiceStatus: string;
    lastChecked: Date;
  }> {
    const result = {
      isHealthy: true,
      vectorDbStatus: 'healthy',
      embeddingServiceStatus: 'healthy',
      lastChecked: new Date()
    };

    try {
      // Check vector database
      await this.vectorDb.getIndexStats();
    } catch (error) {
      result.isHealthy = false;
      result.vectorDbStatus = 'unhealthy';
    }

    try {
      // Check embedding service
      await this.embeddingService.generateEmbedding({ text: 'health check' });
    } catch (error) {
      result.isHealthy = false;
      result.embeddingServiceStatus = 'unhealthy';
    }

    return result;
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(fileName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    return `doc_${cleanFileName}_${timestamp}_${random}`;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `job_${timestamp}_${random}`;
  }

  /**
   * Get configuration
   */
  getConfig(): RAGConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize services if needed
    if (newConfig.vectorDatabase) {
      this.vectorDb = new VectorDatabaseService(this.config.vectorDatabase);
    }
    
    if (newConfig.embeddings) {
      this.embeddingService = new EmbeddingService(this.config.embeddings);
    }
    
    if (newConfig.chunking) {
      this.documentProcessor = new DocumentProcessor(this.config.chunking);
    }
  }
}