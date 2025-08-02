import { RAGSearchService } from './rag-search';
import { RAGIndexingService } from './rag-indexing';
import { getRAGConfig } from '../config/rag-config';
import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  KnowledgeDocument,
  IndexingJob,
  QueryContext,
  SearchFilters,
  AccessLevel,
  RAGConfig
} from '@/types/rag';

export interface RAGServiceStats {
  indexing: {
    totalDocuments: number;
    totalChunks: number;
    indexSize: number;
    lastUpdated: Date;
  };
  search: {
    totalQueries: number;
    avgResponseTime: number;
    avgConfidence: number;
    topQueries: string[];
  };
  health: {
    isHealthy: boolean;
    vectorDbStatus: string;
    embeddingServiceStatus: string;
    lastChecked: Date;
  };
}

export interface SearchAnalytics {
  queryId: string;
  query: string;
  userId: string;
  timestamp: Date;
  responseTime: number;
  confidence: number;
  resultsCount: number;
  context?: QueryContext;
  filters?: SearchFilters;
}

/**
 * Integrated RAG service that combines indexing and search capabilities
 * with analytics, caching, and performance optimization
 */
export class IntegratedRAGService {
  private searchService: RAGSearchService;
  private indexingService: RAGIndexingService;
  private config: RAGConfig;
  private searchCache: Map<string, { response: RAGResponse; timestamp: number }>;
  private analytics: SearchAnalytics[];
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(config?: RAGConfig) {
    this.config = config || getRAGConfig();
    this.searchService = new RAGSearchService(this.config);
    this.indexingService = new RAGIndexingService(this.config);
    this.searchCache = new Map();
    this.analytics = [];
  }

  /**
   * Initialize the integrated RAG system
   */
  async initialize(): Promise<void> {
    try {
      await this.indexingService.initialize();
      console.log('Integrated RAG service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize integrated RAG service:', error);
      throw error;
    }
  }

  /**
   * Perform intelligent search with caching and analytics
   */
  async search(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      const cachedResult = this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        // Update analytics for cached result
        this.recordSearchAnalytics({
          queryId: cachedResult.queryId,
          query: query.query,
          userId: query.userId,
          timestamp: new Date(),
          responseTime: Date.now() - startTime,
          confidence: cachedResult.confidence,
          resultsCount: cachedResult.sources.length,
          context: query.context,
          filters: query.filters
        });
        
        return cachedResult;
      }

      // Perform search
      const response = await this.searchService.search(query);
      
      // Cache the result
      this.cacheResult(cacheKey, response);
      
      // Record analytics
      this.recordSearchAnalytics({
        queryId: response.queryId,
        query: query.query,
        userId: query.userId,
        timestamp: new Date(),
        responseTime: response.processingTime,
        confidence: response.confidence,
        resultsCount: response.sources.length,
        context: query.context,
        filters: query.filters
      });

      return response;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Perform contextual document retrieval with intelligent ranking
   */
  async retrieveContextualDocuments(
    query: string,
    context: QueryContext,
    options: {
      maxResults?: number;
      similarityThreshold?: number;
      boostRecent?: boolean;
      boostContextual?: boolean;
    } = {}
  ): Promise<DocumentSource[]> {
    const {
      maxResults = 5,
      similarityThreshold = 0.7,
      boostRecent = true,
      boostContextual = true
    } = options;

    // Build enhanced query with context-aware filters
    const ragQuery: RAGQuery = {
      query,
      context,
      userId: context.sessionId || 'anonymous',
      maxResults: maxResults * 2, // Get more for re-ranking
      similarityThreshold,
      filters: this.buildContextualFilters(context)
    };

    const response = await this.search(ragQuery);
    
    // Apply additional contextual ranking
    let rankedSources = response.sources;
    
    if (boostContextual) {
      rankedSources = this.applyContextualBoosting(rankedSources, context);
    }
    
    if (boostRecent) {
      rankedSources = this.applyRecencyBoosting(rankedSources);
    }

    return rankedSources.slice(0, maxResults);
  }

  /**
   * Find similar documents with advanced similarity metrics
   */
  async findSimilarDocuments(
    documentId: string,
    options: {
      maxResults?: number;
      includeMetadata?: boolean;
      excludeCategories?: string[];
      minSimilarity?: number;
    } = {}
  ): Promise<DocumentSource[]> {
    const {
      maxResults = 5,
      includeMetadata = true,
      excludeCategories = [],
      minSimilarity = 0.6
    } = options;

    try {
      const similarDocs = await this.searchService.findSimilarDocuments(
        documentId,
        maxResults * 2 // Get more for filtering
      );

      // Apply additional filtering
      let filteredDocs = similarDocs.filter(doc => {
        // Filter by minimum similarity
        if (doc.relevanceScore < minSimilarity) return false;
        
        // Filter by excluded categories
        if (excludeCategories.length > 0 && 
            excludeCategories.includes(doc.metadata.category)) {
          return false;
        }
        
        return true;
      });

      // Sort by relevance and limit results
      filteredDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return filteredDocs.slice(0, maxResults);
    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw error;
    }
  }

  /**
   * Index a document with enhanced metadata extraction
   */
  async indexDocument(
    file: Buffer,
    fileName: string,
    options: {
      accessLevel?: AccessLevel;
      tags?: string[];
      category?: string;
      userId: string;
      extractKeywords?: boolean;
      generateSummary?: boolean;
    }
  ): Promise<IndexingJob> {
    try {
      // Enhanced options with automatic metadata extraction
      const enhancedOptions = {
        ...options,
        extractKeywords: options.extractKeywords ?? true,
        generateSummary: options.generateSummary ?? true
      };

      const job = await this.indexingService.indexDocument(file, fileName, enhancedOptions);
      
      // Clear related cache entries
      this.clearRelatedCache(options.category, options.tags);
      
      return job;
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  }

  /**
   * Batch index multiple documents with progress tracking
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
    }>,
    onProgress?: (completed: number, total: number, currentFile: string) => void
  ): Promise<IndexingJob[]> {
    const jobs: IndexingJob[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      try {
        if (onProgress) {
          onProgress(i, documents.length, doc.fileName);
        }
        
        const job = await this.indexDocument(doc.file, doc.fileName, doc.options);
        jobs.push(job);
      } catch (error) {
        console.error(`Failed to index document ${doc.fileName}:`, error);
        // Continue with other documents
      }
    }
    
    if (onProgress) {
      onProgress(documents.length, documents.length, '');
    }
    
    return jobs;
  }

  /**
   * Get comprehensive service statistics
   */
  async getServiceStats(): Promise<RAGServiceStats> {
    try {
      const [indexingStats, searchStats, healthStats] = await Promise.all([
        this.indexingService.getIndexingStats(),
        this.searchService.getSearchStats(),
        this.indexingService.healthCheck()
      ]);

      return {
        indexing: indexingStats,
        search: searchStats,
        health: healthStats
      };
    } catch (error) {
      console.error('Error getting service stats:', error);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    limit?: number;
  } = {}): SearchAnalytics[] {
    const { startDate, endDate, userId, limit = 100 } = options;
    
    let filtered = this.analytics;
    
    if (startDate) {
      filtered = filtered.filter(a => a.timestamp >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(a => a.timestamp <= endDate);
    }
    
    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    }
    
    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.indexingService.updateConfig(newConfig);
    // Note: SearchService doesn't have updateConfig, would need to recreate
    this.clearCache(); // Clear cache when config changes
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: RAGQuery): string {
    const keyData = {
      query: query.query,
      filters: query.filters,
      context: query.context,
      maxResults: query.maxResults,
      similarityThreshold: query.similarityThreshold
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Get cached search result
   */
  private getCachedResult(cacheKey: string): RAGResponse | null {
    const cached = this.searchCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.searchCache.delete(cacheKey);
      return null;
    }
    
    return cached.response;
  }

  /**
   * Cache search result
   */
  private cacheResult(cacheKey: string, response: RAGResponse): void {
    this.searchCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * Clear cache entries related to specific content
   */
  private clearRelatedCache(category?: string, tags?: string[]): void {
    // Simple implementation - in production, this would be more sophisticated
    this.searchCache.clear();
  }

  /**
   * Record search analytics
   */
  private recordSearchAnalytics(analytics: SearchAnalytics): void {
    this.analytics.push(analytics);
    
    // Keep only last 1000 analytics entries
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }

  /**
   * Build contextual filters based on query context
   */
  private buildContextualFilters(context: QueryContext): SearchFilters {
    const filters: SearchFilters = {};
    
    if (context.currentProject) {
      // This would be implemented based on your metadata structure
    }
    
    if (context.currentClient) {
      // This would be implemented based on your metadata structure
    }
    
    if (context.userRole) {
      // Apply role-based access filtering
      switch (context.userRole) {
        case 'viewer':
          filters.accessLevel = AccessLevel.PUBLIC;
          break;
        case 'user':
          filters.accessLevel = AccessLevel.INTERNAL;
          break;
        // Admin and manager can see all levels
      }
    }
    
    return filters;
  }

  /**
   * Apply contextual boosting to search results
   */
  private applyContextualBoosting(
    sources: DocumentSource[],
    context: QueryContext
  ): DocumentSource[] {
    return sources.map(source => {
      let boost = 0;
      
      // Boost documents from current project
      if (context.currentProject && 
          source.metadata.projectId === context.currentProject) {
        boost += 0.1;
      }
      
      // Boost documents from current client
      if (context.currentClient && 
          source.metadata.clientId === context.currentClient) {
        boost += 0.1;
      }
      
      // Boost documents matching user's workspace
      if (context.workspaceId && 
          source.metadata.workspaceId === context.workspaceId) {
        boost += 0.05;
      }
      
      return {
        ...source,
        relevanceScore: Math.min(source.relevanceScore + boost, 1.0)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Apply recency boosting to search results
   */
  private applyRecencyBoosting(sources: DocumentSource[]): DocumentSource[] {
    const now = Date.now();
    
    return sources.map(source => {
      const createdDate = source.metadata.createdDate;
      if (!createdDate) return source;
      
      const daysSinceCreation = (now - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24);
      
      // Boost recent documents (exponential decay)
      const recencyBoost = Math.exp(-daysSinceCreation / 30) * 0.1; // Decay over 30 days
      
      return {
        ...source,
        relevanceScore: Math.min(source.relevanceScore + recencyBoost, 1.0)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

// Export singleton instance
let ragServiceInstance: IntegratedRAGService | null = null;

export function getRAGService(): IntegratedRAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new IntegratedRAGService();
  }
  return ragServiceInstance;
}

export function initializeRAGService(config?: RAGConfig): Promise<void> {
  const service = config ? new IntegratedRAGService(config) : getRAGService();
  ragServiceInstance = service;
  return service.initialize();
}