import { RAGConfig } from '@/types/rag';

/**
 * Default RAG configuration
 */
export const defaultRAGConfig: RAGConfig = {
  vectorDatabase: {
    provider: 'pinecone',
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws',
    indexName: process.env.PINECONE_INDEX_NAME || 'idara-knowledge-base',
    dimension: 1536 // OpenAI text-embedding-ada-002 dimension
  },
  embeddings: {
    provider: 'openai',
    model: 'text-embedding-ada-002',
    apiKey: process.env.OPENAI_API_KEY || '',
    dimension: 1536
  },
  chunking: {
    maxChunkSize: 1000, // Maximum characters per chunk
    chunkOverlap: 200, // Overlap between chunks
    preserveStructure: true // Try to preserve document structure
  },
  retrieval: {
    defaultTopK: 5, // Default number of chunks to retrieve
    defaultSimilarityThreshold: 0.7, // Minimum similarity score
    maxContextLength: 4000 // Maximum context length for LLM
  }
};

/**
 * Get RAG configuration with environment variable overrides
 */
export function getRAGConfig(): RAGConfig {
  return {
    vectorDatabase: {
      provider: 'pinecone',
      apiKey: process.env.PINECONE_API_KEY || defaultRAGConfig.vectorDatabase.apiKey,
      environment: process.env.PINECONE_ENVIRONMENT || defaultRAGConfig.vectorDatabase.environment,
      indexName: process.env.PINECONE_INDEX_NAME || defaultRAGConfig.vectorDatabase.indexName,
      dimension: parseInt(process.env.PINECONE_DIMENSION || '1536')
    },
    embeddings: {
      provider: 'openai',
      model: process.env.OPENAI_EMBEDDING_MODEL || defaultRAGConfig.embeddings.model,
      apiKey: process.env.OPENAI_API_KEY || defaultRAGConfig.embeddings.apiKey,
      dimension: parseInt(process.env.OPENAI_EMBEDDING_DIMENSION || '1536')
    },
    chunking: {
      maxChunkSize: parseInt(process.env.RAG_MAX_CHUNK_SIZE || '1000'),
      chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200'),
      preserveStructure: process.env.RAG_PRESERVE_STRUCTURE === 'true'
    },
    retrieval: {
      defaultTopK: parseInt(process.env.RAG_DEFAULT_TOP_K || '5'),
      defaultSimilarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.7'),
      maxContextLength: parseInt(process.env.RAG_MAX_CONTEXT_LENGTH || '4000')
    }
  };
}

/**
 * Validate RAG configuration
 */
export function validateRAGConfig(config: RAGConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate vector database config
  if (!config.vectorDatabase.apiKey) {
    errors.push('Vector database API key is required');
  }
  if (!config.vectorDatabase.indexName) {
    errors.push('Vector database index name is required');
  }
  if (config.vectorDatabase.dimension <= 0) {
    errors.push('Vector database dimension must be positive');
  }

  // Validate embeddings config
  if (!config.embeddings.apiKey) {
    errors.push('Embeddings API key is required');
  }
  if (!config.embeddings.model) {
    errors.push('Embeddings model is required');
  }
  if (config.embeddings.dimension <= 0) {
    errors.push('Embeddings dimension must be positive');
  }

  // Validate chunking config
  if (config.chunking.maxChunkSize <= 0) {
    errors.push('Max chunk size must be positive');
  }
  if (config.chunking.chunkOverlap < 0) {
    errors.push('Chunk overlap cannot be negative');
  }
  if (config.chunking.chunkOverlap >= config.chunking.maxChunkSize) {
    errors.push('Chunk overlap must be less than max chunk size');
  }

  // Validate retrieval config
  if (config.retrieval.defaultTopK <= 0) {
    errors.push('Default top K must be positive');
  }
  if (config.retrieval.defaultSimilarityThreshold < 0 || config.retrieval.defaultSimilarityThreshold > 1) {
    errors.push('Similarity threshold must be between 0 and 1');
  }
  if (config.retrieval.maxContextLength <= 0) {
    errors.push('Max context length must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): Partial<RAGConfig> {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        chunking: {
          maxChunkSize: 1500,
          chunkOverlap: 300,
          preserveStructure: true
        },
        retrieval: {
          defaultTopK: 10,
          defaultSimilarityThreshold: 0.8,
          maxContextLength: 6000
        }
      };

    case 'test':
      return {
        vectorDatabase: {
          indexName: 'test-knowledge-base'
        },
        chunking: {
          maxChunkSize: 500,
          chunkOverlap: 100,
          preserveStructure: false
        },
        retrieval: {
          defaultTopK: 3,
          defaultSimilarityThreshold: 0.6,
          maxContextLength: 2000
        }
      };

    default: // development
      return {
        chunking: {
          maxChunkSize: 800,
          chunkOverlap: 150,
          preserveStructure: true
        },
        retrieval: {
          defaultTopK: 5,
          defaultSimilarityThreshold: 0.7,
          maxContextLength: 3000
        }
      };
  }
}

/**
 * Merge configurations with precedence
 */
export function mergeConfigs(...configs: Partial<RAGConfig>[]): RAGConfig {
  let merged = { ...defaultRAGConfig };

  for (const config of configs) {
    if (config.vectorDatabase) {
      merged.vectorDatabase = { ...merged.vectorDatabase, ...config.vectorDatabase };
    }
    if (config.embeddings) {
      merged.embeddings = { ...merged.embeddings, ...config.embeddings };
    }
    if (config.chunking) {
      merged.chunking = { ...merged.chunking, ...config.chunking };
    }
    if (config.retrieval) {
      merged.retrieval = { ...merged.retrieval, ...config.retrieval };
    }
  }

  return merged;
}