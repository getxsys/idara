# RAG (Retrieval-Augmented Generation) System Implementation

## Overview

This document describes the implementation of the RAG-powered knowledge retrieval system for the modern business dashboard. The system enables intelligent document indexing, semantic search, and context-aware information retrieval.

## Architecture

### Core Components

1. **Vector Database Service** (`vector-database.ts`)
   - Manages Pinecone vector database operations
   - Handles vector storage, search, and deletion
   - Supports batch operations for performance

2. **Embedding Service** (`embedding.ts`)
   - Generates embeddings using OpenAI's text-embedding models
   - Supports batch processing with rate limiting
   - Includes utility functions for similarity calculations

3. **Document Processor** (`document-processor.ts`)
   - Processes multiple document formats (PDF, DOCX, TXT, HTML, MD, JSON, CSV)
   - Extracts metadata and performs text cleaning
   - Implements intelligent document chunking

4. **RAG Indexing Service** (`rag-indexing.ts`)
   - Orchestrates the complete indexing pipeline
   - Manages document validation and processing
   - Provides health monitoring and statistics

5. **Configuration System** (`rag-config.ts`)
   - Environment-based configuration management
   - Validation and merging of configurations
   - Support for different deployment environments

## Features Implemented

### ✅ Vector Database Integration
- Pinecone vector database setup and management
- Automatic index creation and initialization
- Batch upsert operations for performance
- Vector similarity search with filtering
- Document chunk deletion and cleanup

### ✅ Document Processing
- Multi-format document support:
  - PDF files (with metadata extraction)
  - DOCX files
  - Plain text files
  - HTML files (with tag removal)
  - Markdown files (with syntax cleaning)
  - JSON files (with object flattening)
  - CSV files (with structured parsing)

### ✅ Intelligent Chunking
- Configurable chunk size and overlap
- Structure-preserving chunking (paragraphs, sections)
- Sentence boundary detection
- Metadata preservation for each chunk

### ✅ Embedding Generation
- OpenAI text-embedding-ada-002 integration
- Batch processing with rate limiting
- Token estimation and truncation
- Embedding validation and normalization

### ✅ Metadata Extraction
- Automatic keyword extraction
- Language detection
- Document summarization
- Author and date information (where available)

### ✅ Configuration Management
- Environment variable support
- Validation and error handling
- Environment-specific configurations
- Configuration merging and overrides

### ✅ Comprehensive Testing
- Unit tests for all core components
- Mock implementations for external services
- Configuration validation tests
- Error handling and edge case coverage

## Installation and Setup

### 1. Install Dependencies

```bash
npm install @pinecone-database/pinecone openai pdf-parse mammoth cheerio --legacy-peer-deps
npm install @types/pdf-parse @types/cheerio --legacy-peer-deps
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"
OPENAI_EMBEDDING_MODEL="text-embedding-ada-002"
OPENAI_EMBEDDING_DIMENSION="1536"

# Pinecone Configuration
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="us-east-1-aws"
PINECONE_INDEX_NAME="idara-knowledge-base"
PINECONE_DIMENSION="1536"

# RAG Configuration
RAG_MAX_CHUNK_SIZE="1000"
RAG_CHUNK_OVERLAP="200"
RAG_PRESERVE_STRUCTURE="true"
RAG_DEFAULT_TOP_K="5"
RAG_SIMILARITY_THRESHOLD="0.7"
RAG_MAX_CONTEXT_LENGTH="4000"
```

### 3. Initialize the System

```typescript
import { getRAGConfig } from '@/lib/config/rag-config';
import { RAGIndexingService } from '@/lib/services/rag-indexing';

const config = getRAGConfig();
const ragService = new RAGIndexingService(config);

// Initialize the vector database
await ragService.initialize();
```

## Usage Examples

### Document Indexing

```typescript
import { AccessLevel } from '@/types/rag';

// Index a document
const documentBuffer = Buffer.from('Document content...', 'utf-8');
const job = await ragService.indexDocument(
  documentBuffer,
  'document.txt',
  {
    accessLevel: AccessLevel.INTERNAL,
    tags: ['business', 'strategy'],
    category: 'planning',
    userId: 'user-123'
  }
);

console.log('Indexing job:', job);
```

### Document Validation

```typescript
// Validate before indexing
const validation = ragService.validateDocument(documentBuffer, 'document.txt');
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### System Health Check

```typescript
// Check system health
const health = await ragService.healthCheck();
console.log('System health:', health);
```

### Get Statistics

```typescript
// Get indexing statistics
const stats = await ragService.getIndexingStats();
console.log('Index stats:', stats);
```

## Configuration Options

### Vector Database Configuration
- `provider`: Vector database provider (currently 'pinecone')
- `apiKey`: API key for the vector database
- `environment`: Deployment environment
- `indexName`: Name of the vector index
- `dimension`: Vector dimension (must match embedding model)

### Embedding Configuration
- `provider`: Embedding provider (currently 'openai')
- `model`: Embedding model name
- `apiKey`: API key for the embedding service
- `dimension`: Embedding dimension

### Chunking Configuration
- `maxChunkSize`: Maximum characters per chunk
- `chunkOverlap`: Overlap between consecutive chunks
- `preserveStructure`: Whether to preserve document structure

### Retrieval Configuration
- `defaultTopK`: Default number of chunks to retrieve
- `defaultSimilarityThreshold`: Minimum similarity score
- `maxContextLength`: Maximum context length for LLM

## Testing

Run the comprehensive test suite:

```bash
# Run all RAG-related tests
npm test -- --testPathPattern="rag|embedding|vector-database"

# Run specific test files
npm test src/lib/config/__tests__/rag-config.test.ts
npm test src/lib/services/__tests__/embedding.test.ts
npm test src/lib/services/__tests__/vector-database.test.ts
```

## Performance Considerations

### Batch Processing
- Documents are processed in batches to optimize API usage
- Embedding generation uses batch requests with rate limiting
- Vector database operations are batched for better performance

### Memory Management
- Large documents are processed in chunks to avoid memory issues
- Streaming processing for very large files
- Garbage collection optimization for long-running processes

### Rate Limiting
- Built-in delays between API requests
- Exponential backoff for failed requests
- Configurable batch sizes and timeouts

## Error Handling

The system includes comprehensive error handling for:
- API failures and timeouts
- Invalid document formats
- Configuration errors
- Vector database connection issues
- Memory and resource constraints

## Security Considerations

- API keys are managed through environment variables
- Document access levels control visibility
- Input validation prevents malicious content
- Secure handling of sensitive document content

## Future Enhancements

The current implementation provides a solid foundation for:
- Advanced search and retrieval interfaces (Task 6.2)
- Multi-modal document support (images, tables)
- Real-time document updates and synchronization
- Advanced analytics and usage tracking
- Integration with other AI services

## Troubleshooting

### Common Issues

1. **Memory Issues**: Reduce chunk size or process documents individually
2. **API Rate Limits**: Increase delays between requests
3. **Vector Database Errors**: Check API keys and network connectivity
4. **Document Processing Failures**: Verify file format support

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL="debug"
```

## Dependencies

### Core Dependencies
- `@pinecone-database/pinecone`: Vector database client
- `openai`: OpenAI API client for embeddings
- `pdf-parse`: PDF document processing
- `mammoth`: DOCX document processing
- `cheerio`: HTML parsing and text extraction

### Development Dependencies
- `@types/pdf-parse`: TypeScript definitions
- `@types/cheerio`: TypeScript definitions
- `jest`: Testing framework
- Various testing utilities and mocks

This implementation successfully completes Task 6.1 of the RAG-powered knowledge retrieval system, providing a robust foundation for intelligent document indexing and management.