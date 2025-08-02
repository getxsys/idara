import { getRAGConfig } from '../config/rag-config';
import { RAGIndexingService } from './rag-indexing';
import { AccessLevel, DocumentType } from '@/types/rag';

/**
 * Example usage of the RAG indexing system
 * This demonstrates how to initialize and use the RAG system
 */
export async function demonstrateRAGSystem() {
  try {
    // Get configuration
    const config = getRAGConfig();
    
    // Initialize RAG service
    const ragService = new RAGIndexingService(config);
    
    // Initialize the system (creates vector database index if needed)
    await ragService.initialize();
    
    // Example document content
    const documentContent = `
      # Business Strategy Document
      
      ## Executive Summary
      This document outlines our company's strategic direction for the next fiscal year.
      
      ## Key Objectives
      1. Increase market share by 15%
      2. Improve customer satisfaction scores
      3. Expand into new geographic markets
      
      ## Implementation Plan
      The implementation will be phased over 12 months with quarterly reviews.
    `;
    
    const documentBuffer = Buffer.from(documentContent, 'utf-8');
    
    // Index the document
    const indexingJob = await ragService.indexDocument(
      documentBuffer,
      'business-strategy-2024.md',
      {
        accessLevel: AccessLevel.INTERNAL,
        tags: ['strategy', 'business', '2024'],
        category: 'strategic-planning',
        userId: 'demo-user'
      }
    );
    
    console.log('Document indexed successfully:', {
      jobId: indexingJob.id,
      status: indexingJob.status,
      chunksProcessed: indexingJob.chunksProcessed,
      totalChunks: indexingJob.totalChunks
    });
    
    // Get indexing statistics
    const stats = await ragService.getIndexingStats();
    console.log('Index statistics:', stats);
    
    // Perform health check
    const health = await ragService.healthCheck();
    console.log('System health:', health);
    
    return {
      indexingJob,
      stats,
      health
    };
    
  } catch (error) {
    console.error('Error demonstrating RAG system:', error);
    throw error;
  }
}

/**
 * Example of validating a document before indexing
 */
export function validateDocumentExample() {
  const config = getRAGConfig();
  const ragService = new RAGIndexingService(config);
  
  // Example documents to validate
  const documents = [
    {
      name: 'valid-document.txt',
      content: 'This is a valid document with reasonable content.',
      size: 1024 // 1KB
    },
    {
      name: 'too-large.pdf',
      content: 'Large document content',
      size: 60 * 1024 * 1024 // 60MB - too large
    },
    {
      name: 'unsupported.xyz',
      content: 'Content',
      size: 100
    },
    {
      name: 'empty.txt',
      content: '',
      size: 0
    }
  ];
  
  documents.forEach(doc => {
    const buffer = Buffer.alloc(doc.size);
    const validation = ragService.validateDocument(buffer, doc.name);
    
    console.log(`Validation for ${doc.name}:`, {
      isValid: validation.isValid,
      errors: validation.errors
    });
  });
}

/**
 * Example configuration usage
 */
export function configurationExample() {
  // Get default configuration
  const defaultConfig = getRAGConfig();
  console.log('Default configuration:', {
    vectorDatabase: {
      provider: defaultConfig.vectorDatabase.provider,
      indexName: defaultConfig.vectorDatabase.indexName,
      dimension: defaultConfig.vectorDatabase.dimension
    },
    embeddings: {
      provider: defaultConfig.embeddings.provider,
      model: defaultConfig.embeddings.model,
      dimension: defaultConfig.embeddings.dimension
    },
    chunking: defaultConfig.chunking,
    retrieval: defaultConfig.retrieval
  });
  
  // Example of custom configuration
  const customConfig = {
    ...defaultConfig,
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
  
  console.log('Custom configuration applied:', {
    chunking: customConfig.chunking,
    retrieval: customConfig.retrieval
  });
  
  return { defaultConfig, customConfig };
}

// Export for potential CLI usage
if (require.main === module) {
  console.log('=== RAG System Configuration Example ===');
  configurationExample();
  
  console.log('\n=== Document Validation Example ===');
  validateDocumentExample();
  
  console.log('\n=== RAG System Demonstration ===');
  console.log('Note: This requires valid API keys in environment variables');
  console.log('Set PINECONE_API_KEY and OPENAI_API_KEY to run the full demo');
}