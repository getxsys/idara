import { EmbeddingService } from '../embedding';
import { RAGConfig } from '@/types/rag';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockConfig: RAGConfig['embeddings'] = {
    provider: 'openai',
    model: 'text-embedding-ada-002',
    apiKey: 'test-api-key',
    dimension: 1536
  };

  beforeEach(() => {
    mockOpenAI = {
      embeddings: {
        create: jest.fn()
      }
    } as any;

    MockedOpenAI.mockImplementation(() => mockOpenAI);
    embeddingService = new EmbeddingService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for single text', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResponse = {
        data: [{
          embedding: mockEmbedding
        }],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 10,
          total_tokens: 10
        }
      };

      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse as any);

      const result = await embeddingService.generateEmbedding({
        text: 'This is a test text'
      });

      expect(result.embeddings).toEqual(mockEmbedding);
      expect(result.model).toBe('text-embedding-ada-002');
      expect(result.usage.promptTokens).toBe(10);
      expect(result.usage.totalTokens).toBe(10);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: 'This is a test text',
        encoding_format: 'float'
      });
    });

    it('should use custom model when provided', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResponse = {
        data: [{
          embedding: mockEmbedding
        }],
        model: 'text-embedding-3-small',
        usage: {
          prompt_tokens: 10,
          total_tokens: 10
        }
      };

      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse as any);

      await embeddingService.generateEmbedding({
        text: 'This is a test text',
        model: 'text-embedding-3-small'
      });

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'This is a test text',
        encoding_format: 'float'
      });
    });

    it('should handle API errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));

      await expect(
        embeddingService.generateEmbedding({ text: 'test' })
      ).rejects.toThrow('Failed to generate embedding');
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbedding1 = new Array(1536).fill(0.1);
      const mockEmbedding2 = new Array(1536).fill(0.2);
      const mockResponse = {
        data: [
          { embedding: mockEmbedding1 },
          { embedding: mockEmbedding2 }
        ],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 20,
          total_tokens: 20
        }
      };

      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse as any);

      const texts = ['First text', 'Second text'];
      const results = await embeddingService.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(2);
      expect(results[0].embeddings).toEqual(mockEmbedding1);
      expect(results[1].embeddings).toEqual(mockEmbedding2);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: texts,
        encoding_format: 'float'
      });
    });

    it('should process large batches in chunks', async () => {
      const texts = new Array(250).fill('test text'); // More than batch size of 100
      const mockEmbedding = new Array(1536).fill(0.1);
      
      // Mock different responses for each batch
      const mockResponse1 = {
        data: new Array(100).fill({ embedding: mockEmbedding }),
        model: 'text-embedding-ada-002',
        usage: { prompt_tokens: 1000, total_tokens: 1000 }
      };
      const mockResponse2 = {
        data: new Array(100).fill({ embedding: mockEmbedding }),
        model: 'text-embedding-ada-002',
        usage: { prompt_tokens: 1000, total_tokens: 1000 }
      };
      const mockResponse3 = {
        data: new Array(50).fill({ embedding: mockEmbedding }),
        model: 'text-embedding-ada-002',
        usage: { prompt_tokens: 500, total_tokens: 500 }
      };

      mockOpenAI.embeddings.create
        .mockResolvedValueOnce(mockResponse1 as any)
        .mockResolvedValueOnce(mockResponse2 as any)
        .mockResolvedValueOnce(mockResponse3 as any);

      const results = await embeddingService.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(250);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(3); // 250 / 100 = 3 batches
    });

    it('should handle batch processing errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('Batch API Error'));

      await expect(
        embeddingService.generateBatchEmbeddings(['text1', 'text2'])
      ).rejects.toThrow('Failed to generate batch embeddings');
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];
      const embedding3 = [1, 0, 0];

      const similarity1 = embeddingService.calculateSimilarity(embedding1, embedding2);
      const similarity2 = embeddingService.calculateSimilarity(embedding1, embedding3);

      expect(similarity1).toBe(0); // Orthogonal vectors
      expect(similarity2).toBe(1); // Identical vectors
    });

    it('should handle zero vectors', () => {
      const embedding1 = [0, 0, 0];
      const embedding2 = [1, 0, 0];

      const similarity = embeddingService.calculateSimilarity(embedding1, embedding2);
      expect(similarity).toBe(0);
    });

    it('should throw error for mismatched dimensions', () => {
      const embedding1 = [1, 0];
      const embedding2 = [1, 0, 0];

      expect(() => {
        embeddingService.calculateSimilarity(embedding1, embedding2);
      }).toThrow('Embeddings must have the same dimension');
    });
  });

  describe('utility methods', () => {
    it('should return correct dimension', () => {
      expect(embeddingService.getDimension()).toBe(1536);
    });

    it('should return correct model', () => {
      expect(embeddingService.getModel()).toBe('text-embedding-ada-002');
    });

    it('should validate embedding dimensions', () => {
      const validEmbedding = new Array(1536).fill(0.1);
      const invalidEmbedding = new Array(512).fill(0.1);

      expect(embeddingService.validateEmbedding(validEmbedding)).toBe(true);
      expect(embeddingService.validateEmbedding(invalidEmbedding)).toBe(false);
    });

    it('should normalize embeddings', () => {
      const embedding = [3, 4, 0]; // Magnitude = 5
      const normalized = embeddingService.normalizeEmbedding(embedding);

      expect(normalized).toEqual([0.6, 0.8, 0]);
      
      // Check that normalized vector has magnitude 1
      const magnitude = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should handle zero vector normalization', () => {
      const embedding = [0, 0, 0];
      const normalized = embeddingService.normalizeEmbedding(embedding);

      expect(normalized).toEqual([0, 0, 0]);
    });
  });

  describe('token estimation', () => {
    it('should estimate token count', () => {
      const text = 'This is a test text with multiple words';
      const tokenCount = embeddingService.estimateTokenCount(text);

      expect(tokenCount).toBeGreaterThan(0);
      expect(tokenCount).toBeLessThan(text.length); // Should be less than character count
    });

    it('should check token limits', () => {
      const shortText = 'Short text';
      const longText = 'A'.repeat(50000); // Very long text

      expect(embeddingService.isWithinTokenLimit(shortText)).toBe(true);
      expect(embeddingService.isWithinTokenLimit(longText)).toBe(false);
    });

    it('should truncate text to token limit', () => {
      const longText = 'A'.repeat(50000);
      const truncated = embeddingService.truncateToTokenLimit(longText, 1000);

      expect(truncated.length).toBeLessThan(longText.length);
      expect(embeddingService.isWithinTokenLimit(truncated, 1000)).toBe(true);
    });

    it('should not truncate text within limits', () => {
      const shortText = 'This is a short text';
      const result = embeddingService.truncateToTokenLimit(shortText, 1000);

      expect(result).toBe(shortText);
    });
  });
});