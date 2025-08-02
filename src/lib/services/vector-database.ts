import { Pinecone } from '@pinecone-database/pinecone';
import {
  VectorSearchRequest,
  VectorSearchResult,
  DocumentChunk,
  RAGConfig
} from '@/types/rag';

export class VectorDatabaseService {
  private pinecone: Pinecone;
  private indexName: string;

  constructor(config: RAGConfig['vectorDatabase']) {
    this.pinecone = new Pinecone({
      apiKey: config.apiKey,
      environment: config.environment
    });
    this.indexName = config.indexName;
  }

  /**
   * Initialize the vector database index
   */
  async initializeIndex(dimension: number): Promise<void> {
    try {
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      }
    } catch (error) {
      console.error('Error initializing vector database index:', error);
      throw new Error(`Failed to initialize vector database: ${error}`);
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndexReady(): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
        if (indexStats) {
          return;
        }
      } catch (error) {
        // Index not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Index failed to become ready within timeout period');
  }

  /**
   * Upsert document chunks to the vector database
   */
  async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const vectors = chunks.map(chunk => ({
        id: chunk.id,
        values: chunk.embeddings,
        metadata: {
          documentId: chunk.documentId,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          startPosition: chunk.startPosition,
          endPosition: chunk.endPosition,
          wordCount: chunk.metadata.wordCount,
          characterCount: chunk.metadata.characterCount,
          section: chunk.metadata.section,
          heading: chunk.metadata.heading,
          pageNumber: chunk.metadata.pageNumber
        }
      }));

      // Batch upsert in chunks of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }
    } catch (error) {
      console.error('Error upserting chunks to vector database:', error);
      throw new Error(`Failed to upsert chunks: ${error}`);
    }
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(request: VectorSearchRequest): Promise<VectorSearchResult[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const queryResponse = await index.query({
        vector: request.vector,
        topK: request.topK,
        filter: request.filter,
        includeValues: request.includeValues || false,
        includeMetadata: request.includeMetadata !== false
      });

      return queryResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata || {},
        values: match.values
      })) || [];
    } catch (error) {
      console.error('Error searching vector database:', error);
      throw new Error(`Failed to search vectors: ${error}`);
    }
  }

  /**
   * Delete document chunks from the vector database
   */
  async deleteChunks(chunkIds: string[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      // Delete in batches
      const batchSize = 1000;
      for (let i = 0; i < chunkIds.length; i += batchSize) {
        const batch = chunkIds.slice(i, i + batchSize);
        await index.deleteMany(batch);
      }
    } catch (error) {
      console.error('Error deleting chunks from vector database:', error);
      throw new Error(`Failed to delete chunks: ${error}`);
    }
  }

  /**
   * Delete all chunks for a specific document
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      await index.deleteMany({
        filter: {
          documentId: { $eq: documentId }
        }
      });
    } catch (error) {
      console.error('Error deleting document chunks:', error);
      throw new Error(`Failed to delete document chunks: ${error}`);
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const index = this.pinecone.index(this.indexName);
      return await index.describeIndexStats();
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw new Error(`Failed to get index stats: ${error}`);
    }
  }

  /**
   * Check if index exists
   */
  async indexExists(): Promise<boolean> {
    try {
      const indexList = await this.pinecone.listIndexes();
      return indexList.indexes?.some(index => index.name === this.indexName) || false;
    } catch (error) {
      console.error('Error checking if index exists:', error);
      return false;
    }
  }
}