import OpenAI from 'openai';
import {
  EmbeddingRequest,
  EmbeddingResponse,
  RAGConfig
} from '@/types/rag';

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;
  private dimension: number;

  constructor(config: RAGConfig['embeddings']) {
    this.openai = new OpenAI({
      apiKey: config.apiKey
    });
    this.model = config.model;
    this.dimension = config.dimension;
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const response = await this.openai.embeddings.create({
        model: request.model || this.model,
        input: request.text,
        encoding_format: 'float'
      });

      const embedding = response.data[0];
      
      return {
        embeddings: embedding.embedding,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    try {
      // Process in batches to avoid rate limits
      const batchSize = 100;
      const results: EmbeddingResponse[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const response = await this.openai.embeddings.create({
          model: model || this.model,
          input: batch,
          encoding_format: 'float'
        });

        const batchResults = response.data.map((embedding, index) => ({
          embeddings: embedding.embedding,
          model: response.model,
          usage: {
            promptTokens: Math.floor(response.usage.prompt_tokens / batch.length),
            totalTokens: Math.floor(response.usage.total_tokens / batch.length)
          }
        }));

        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Get the embedding dimension for the current model
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Get the current model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    return embedding.length === this.dimension;
  }

  /**
   * Normalize embedding vector
   */
  normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? embedding : embedding.map(val => val / magnitude);
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if text is within token limits
   */
  isWithinTokenLimit(text: string, maxTokens: number = 8191): boolean {
    return this.estimateTokenCount(text) <= maxTokens;
  }

  /**
   * Truncate text to fit within token limits
   */
  truncateToTokenLimit(text: string, maxTokens: number = 8191): string {
    const estimatedTokens = this.estimateTokenCount(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Truncate to approximately fit within token limit
    const ratio = maxTokens / estimatedTokens;
    const truncatedLength = Math.floor(text.length * ratio * 0.9); // 10% buffer
    
    return text.substring(0, truncatedLength);
  }
}