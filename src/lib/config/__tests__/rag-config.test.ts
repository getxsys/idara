import {
  defaultRAGConfig,
  getRAGConfig,
  validateRAGConfig,
  getEnvironmentConfig,
  mergeConfigs
} from '../rag-config';
import { RAGConfig } from '@/types/rag';

describe('RAG Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('defaultRAGConfig', () => {
    it('should have valid default configuration', () => {
      expect(defaultRAGConfig.vectorDatabase.provider).toBe('pinecone');
      expect(defaultRAGConfig.embeddings.provider).toBe('openai');
      expect(defaultRAGConfig.embeddings.model).toBe('text-embedding-ada-002');
      expect(defaultRAGConfig.embeddings.dimension).toBe(1536);
      expect(defaultRAGConfig.chunking.maxChunkSize).toBe(1000);
      expect(defaultRAGConfig.chunking.chunkOverlap).toBe(200);
      expect(defaultRAGConfig.retrieval.defaultTopK).toBe(5);
    });
  });

  describe('getRAGConfig', () => {
    it('should use environment variables when available', () => {
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.PINECONE_INDEX_NAME = 'custom-index';
      process.env.RAG_MAX_CHUNK_SIZE = '1500';
      process.env.RAG_DEFAULT_TOP_K = '10';

      const config = getRAGConfig();

      expect(config.vectorDatabase.apiKey).toBe('test-pinecone-key');
      expect(config.embeddings.apiKey).toBe('test-openai-key');
      expect(config.vectorDatabase.indexName).toBe('custom-index');
      expect(config.chunking.maxChunkSize).toBe(1500);
      expect(config.retrieval.defaultTopK).toBe(10);
    });

    it('should fall back to defaults when environment variables are not set', () => {
      delete process.env.PINECONE_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const config = getRAGConfig();

      expect(config.vectorDatabase.apiKey).toBe('');
      expect(config.embeddings.apiKey).toBe('');
      expect(config.vectorDatabase.indexName).toBe('idara-knowledge-base');
    });

    it('should parse numeric environment variables correctly', () => {
      process.env.PINECONE_DIMENSION = '768';
      process.env.OPENAI_EMBEDDING_DIMENSION = '768';
      process.env.RAG_CHUNK_OVERLAP = '100';
      process.env.RAG_SIMILARITY_THRESHOLD = '0.8';

      const config = getRAGConfig();

      expect(config.vectorDatabase.dimension).toBe(768);
      expect(config.embeddings.dimension).toBe(768);
      expect(config.chunking.chunkOverlap).toBe(100);
      expect(config.retrieval.defaultSimilarityThreshold).toBe(0.8);
    });

    it('should handle boolean environment variables', () => {
      process.env.RAG_PRESERVE_STRUCTURE = 'true';

      const config = getRAGConfig();

      expect(config.chunking.preserveStructure).toBe(true);

      process.env.RAG_PRESERVE_STRUCTURE = 'false';

      const config2 = getRAGConfig();

      expect(config2.chunking.preserveStructure).toBe(false);
    });
  });

  describe('validateRAGConfig', () => {
    it('should validate a correct configuration', () => {
      const validConfig: RAGConfig = {
        vectorDatabase: {
          provider: 'pinecone',
          apiKey: 'valid-key',
          indexName: 'valid-index',
          dimension: 1536
        },
        embeddings: {
          provider: 'openai',
          model: 'text-embedding-ada-002',
          apiKey: 'valid-key',
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

      const result = validateRAGConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing API keys', () => {
      const invalidConfig: RAGConfig = {
        ...defaultRAGConfig,
        vectorDatabase: {
          ...defaultRAGConfig.vectorDatabase,
          apiKey: ''
        },
        embeddings: {
          ...defaultRAGConfig.embeddings,
          apiKey: ''
        }
      };

      const result = validateRAGConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vector database API key is required');
      expect(result.errors).toContain('Embeddings API key is required');
    });

    it('should detect invalid dimensions', () => {
      const invalidConfig: RAGConfig = {
        ...defaultRAGConfig,
        vectorDatabase: {
          ...defaultRAGConfig.vectorDatabase,
          dimension: 0
        },
        embeddings: {
          ...defaultRAGConfig.embeddings,
          dimension: -1
        }
      };

      const result = validateRAGConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vector database dimension must be positive');
      expect(result.errors).toContain('Embeddings dimension must be positive');
    });

    it('should detect invalid chunking configuration', () => {
      const invalidConfig: RAGConfig = {
        ...defaultRAGConfig,
        chunking: {
          maxChunkSize: 0,
          chunkOverlap: -1,
          preserveStructure: true
        }
      };

      const result = validateRAGConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max chunk size must be positive');
      expect(result.errors).toContain('Chunk overlap cannot be negative');
    });

    it('should detect chunk overlap larger than max chunk size', () => {
      const invalidConfig: RAGConfig = {
        ...defaultRAGConfig,
        chunking: {
          maxChunkSize: 100,
          chunkOverlap: 150,
          preserveStructure: true
        }
      };

      const result = validateRAGConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Chunk overlap must be less than max chunk size');
    });

    it('should detect invalid retrieval configuration', () => {
      const invalidConfig: RAGConfig = {
        ...defaultRAGConfig,
        retrieval: {
          defaultTopK: 0,
          defaultSimilarityThreshold: 1.5,
          maxContextLength: -1
        }
      };

      const result = validateRAGConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Default top K must be positive');
      expect(result.errors).toContain('Similarity threshold must be between 0 and 1');
      expect(result.errors).toContain('Max context length must be positive');
    });

    it('should detect similarity threshold below 0', () => {
      const invalidConfig: RAGConfig = {
        ...defaultRAGConfig,
        retrieval: {
          ...defaultRAGConfig.retrieval,
          defaultSimilarityThreshold: -0.1
        }
      };

      const result = validateRAGConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Similarity threshold must be between 0 and 1');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return production configuration', () => {
      process.env.NODE_ENV = 'production';

      const config = getEnvironmentConfig();

      expect(config.chunking?.maxChunkSize).toBe(1500);
      expect(config.chunking?.chunkOverlap).toBe(300);
      expect(config.retrieval?.defaultTopK).toBe(10);
      expect(config.retrieval?.defaultSimilarityThreshold).toBe(0.8);
    });

    it('should return test configuration', () => {
      process.env.NODE_ENV = 'test';

      const config = getEnvironmentConfig();

      expect(config.vectorDatabase?.indexName).toBe('test-knowledge-base');
      expect(config.chunking?.maxChunkSize).toBe(500);
      expect(config.chunking?.preserveStructure).toBe(false);
      expect(config.retrieval?.defaultTopK).toBe(3);
    });

    it('should return development configuration by default', () => {
      process.env.NODE_ENV = 'development';

      const config = getEnvironmentConfig();

      expect(config.chunking?.maxChunkSize).toBe(800);
      expect(config.chunking?.chunkOverlap).toBe(150);
      expect(config.retrieval?.defaultTopK).toBe(5);
    });

    it('should return development configuration for unknown environment', () => {
      process.env.NODE_ENV = 'unknown';

      const config = getEnvironmentConfig();

      expect(config.chunking?.maxChunkSize).toBe(800);
      expect(config.retrieval?.defaultTopK).toBe(5);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge multiple configurations correctly', () => {
      const config1: Partial<RAGConfig> = {
        vectorDatabase: {
          provider: 'pinecone',
          apiKey: 'key1',
          indexName: 'index1',
          dimension: 1536
        }
      };

      const config2: Partial<RAGConfig> = {
        vectorDatabase: {
          provider: 'pinecone',
          apiKey: 'key2', // Should override
          environment: 'us-west-1',
          indexName: 'index1',
          dimension: 1536
        },
        embeddings: {
          provider: 'openai',
          model: 'text-embedding-3-small',
          apiKey: 'embedding-key',
          dimension: 1536
        }
      };

      const merged = mergeConfigs(config1, config2);

      expect(merged.vectorDatabase.apiKey).toBe('key2'); // Later config wins
      expect(merged.vectorDatabase.environment).toBe('us-west-1');
      expect(merged.embeddings.model).toBe('text-embedding-3-small');
      expect(merged.chunking).toEqual(defaultRAGConfig.chunking); // Default preserved
    });

    it('should handle empty configurations', () => {
      const merged = mergeConfigs({}, {});

      expect(merged).toEqual(defaultRAGConfig);
    });

    it('should preserve default values when not overridden', () => {
      const config: Partial<RAGConfig> = {
        chunking: {
          maxChunkSize: 2000,
          chunkOverlap: 400,
          preserveStructure: false
        }
      };

      const merged = mergeConfigs(config);

      expect(merged.chunking.maxChunkSize).toBe(2000);
      expect(merged.chunking.chunkOverlap).toBe(400);
      expect(merged.chunking.preserveStructure).toBe(false);
      expect(merged.vectorDatabase).toEqual(defaultRAGConfig.vectorDatabase);
      expect(merged.embeddings).toEqual(defaultRAGConfig.embeddings);
    });

    it('should handle partial nested configurations', () => {
      const config: Partial<RAGConfig> = {
        vectorDatabase: {
          apiKey: 'new-key'
        } as any,
        retrieval: {
          defaultTopK: 10
        } as any
      };

      const merged = mergeConfigs(config);

      expect(merged.vectorDatabase.apiKey).toBe('new-key');
      expect(merged.vectorDatabase.provider).toBe(defaultRAGConfig.vectorDatabase.provider);
      expect(merged.retrieval.defaultTopK).toBe(10);
      expect(merged.retrieval.defaultSimilarityThreshold).toBe(defaultRAGConfig.retrieval.defaultSimilarityThreshold);
    });
  });
});