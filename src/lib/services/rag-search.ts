import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  VectorSearchRequest,
  VectorSearchResult,
  SearchFilters,
  QueryContext,
  AccessLevel,
  RAGConfig
} from '@/types/rag';
import { VectorDatabaseService } from './vector-database';
import { EmbeddingService } from './embedding';

export interface SearchRankingOptions {
  semanticWeight: number;
  recencyWeight: number;
  authorityWeight: number;
  contextWeight: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  confidenceScore: number;
  metadata: any;
  citation: string;
  highlights: string[];
  contextMatch: number;
}

export class RAGSearchService {
  private vectorDb: VectorDatabaseService;
  private embeddingService: EmbeddingService;
  private config: RAGConfig;
  private defaultRankingOptions: SearchRankingOptions = {
    semanticWeight: 0.7,
    recencyWeight: 0.1,
    authorityWeight: 0.1,
    contextWeight: 0.1
  };

  constructor(config: RAGConfig) {
    this.config = config;
    this.vectorDb = new VectorDatabaseService(config.vectorDatabase);
    this.embeddingService = new EmbeddingService(config.embeddings);
  }

  /**
   * Perform semantic search with intelligent ranking and filtering
   */
  async search(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding({
        text: query.query
      });

      // Build search filters
      const searchFilters = this.buildSearchFilters(query.filters, query.context);

      // Perform vector search
      const vectorResults = await this.vectorDb.searchSimilar({
        vector: queryEmbedding.embeddings,
        topK: (query.maxResults || this.config.retrieval.defaultTopK) * 2, // Get more for re-ranking
        filter: searchFilters,
        includeMetadata: true,
        includeValues: false
      });

      // Convert to search results and apply intelligent ranking
      const searchResults = await this.processVectorResults(
        vectorResults,
        query,
        queryEmbedding.embeddings
      );

      // Apply context-aware filtering and ranking
      const contextFilteredResults = this.applyContextualFiltering(
        searchResults,
        query.context
      );

      // Apply final ranking and limit results
      const finalResults = this.applyFinalRanking(
        contextFilteredResults,
        query
      ).slice(0, query.maxResults || this.config.retrieval.defaultTopK);

      // Generate response with citations and confidence
      const response = await this.generateResponse(
        query,
        finalResults,
        queryId,
        Date.now() - startTime
      );

      return response;
    } catch (error) {
      console.error('Error performing RAG search:', error);
      throw new Error(`Search failed: ${error}`);
    }
  }

  /**
   * Perform context-aware document retrieval
   */
  async retrieveContextualDocuments(
    query: string,
    context: QueryContext,
    maxResults: number = 5
  ): Promise<DocumentSource[]> {
    const ragQuery: RAGQuery = {
      query,
      context,
      userId: context.sessionId || 'anonymous',
      maxResults,
      similarityThreshold: 0.7
    };

    const response = await this.search(ragQuery);
    return response.sources;
  }

  /**
   * Get similar documents to a given document
   */
  async findSimilarDocuments(
    documentId: string,
    maxResults: number = 5
  ): Promise<DocumentSource[]> {
    try {
      // Get document chunks
      const documentChunks = await this.vectorDb.searchSimilar({
        vector: [], // This would need the document's embedding
        topK: 1,
        filter: { documentId: { $eq: documentId } },
        includeMetadata: true,
        includeValues: true
      });

      if (documentChunks.length === 0) {
        return [];
      }

      // Use the first chunk's embedding to find similar documents
      const similarResults = await this.vectorDb.searchSimilar({
        vector: documentChunks[0].values || [],
        topK: maxResults * 2,
        filter: { documentId: { $ne: documentId } }, // Exclude the source document
        includeMetadata: true
      });

      return this.convertToDocumentSources(similarResults).slice(0, maxResults);
    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw error;
    }
  }

  /**
   * Build search filters based on query filters and context
   */
  private buildSearchFilters(
    filters?: SearchFilters,
    context?: QueryContext
  ): Record<string, any> {
    const searchFilters: Record<string, any> = {};

    // Apply access level filtering
    if (filters?.accessLevel) {
      searchFilters.accessLevel = { $eq: filters.accessLevel };
    }

    // Apply document type filtering
    if (filters?.documentTypes && filters.documentTypes.length > 0) {
      searchFilters.fileType = { $in: filters.documentTypes };
    }

    // Apply category filtering
    if (filters?.categories && filters.categories.length > 0) {
      searchFilters.category = { $in: filters.categories };
    }

    // Apply author filtering
    if (filters?.authors && filters.authors.length > 0) {
      searchFilters.author = { $in: filters.authors };
    }

    // Apply date range filtering
    if (filters?.dateRange) {
      searchFilters.createdDate = {
        $gte: filters.dateRange.start.toISOString(),
        $lte: filters.dateRange.end.toISOString()
      };
    }

    // Apply tag filtering
    if (filters?.tags && filters.tags.length > 0) {
      searchFilters.tags = { $in: filters.tags };
    }

    // Apply context-based filtering
    if (context?.currentProject) {
      searchFilters.projectId = { $eq: context.currentProject };
    }

    if (context?.currentClient) {
      searchFilters.clientId = { $eq: context.currentClient };
    }

    if (context?.workspaceId) {
      searchFilters.workspaceId = { $eq: context.workspaceId };
    }

    return searchFilters;
  }

  /**
   * Process vector search results and apply initial ranking
   */
  private async processVectorResults(
    vectorResults: VectorSearchResult[],
    query: RAGQuery,
    queryEmbedding: number[]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const result of vectorResults) {
      const metadata = result.metadata;
      
      // Calculate confidence score based on similarity and metadata
      const confidenceScore = this.calculateConfidenceScore(
        result.score,
        metadata,
        query.context
      );

      // Generate citation
      const citation = this.generateCitation(metadata);

      // Extract highlights
      const highlights = this.extractHighlights(
        metadata.content || '',
        query.query
      );

      // Calculate context match score
      const contextMatch = this.calculateContextMatch(metadata, query.context);

      const searchResult: SearchResult = {
        id: result.id,
        title: metadata.title || metadata.fileName || 'Untitled',
        content: metadata.content || '',
        relevanceScore: result.score,
        confidenceScore,
        metadata,
        citation,
        highlights,
        contextMatch
      };

      results.push(searchResult);
    }

    return results;
  }

  /**
   * Apply contextual filtering based on user context
   */
  private applyContextualFiltering(
    results: SearchResult[],
    context?: QueryContext
  ): SearchResult[] {
    if (!context) return results;

    return results.filter(result => {
      // Filter by access level based on user role
      if (context.userRole === 'viewer' && 
          result.metadata.accessLevel === AccessLevel.CONFIDENTIAL) {
        return false;
      }

      // Boost results from current project/client context
      if (context.currentProject && 
          result.metadata.projectId === context.currentProject) {
        result.contextMatch += 0.2;
      }

      if (context.currentClient && 
          result.metadata.clientId === context.currentClient) {
        result.contextMatch += 0.2;
      }

      return true;
    });
  }

  /**
   * Apply final ranking algorithm
   */
  private applyFinalRanking(
    results: SearchResult[],
    query: RAGQuery,
    rankingOptions: SearchRankingOptions = this.defaultRankingOptions
  ): SearchResult[] {
    return results
      .map(result => {
        // Calculate recency score (newer documents get higher scores)
        const recencyScore = this.calculateRecencyScore(result.metadata.createdDate);
        
        // Calculate authority score (based on document metadata)
        const authorityScore = this.calculateAuthorityScore(result.metadata);
        
        // Calculate final composite score
        const finalScore = 
          (result.relevanceScore * rankingOptions.semanticWeight) +
          (recencyScore * rankingOptions.recencyWeight) +
          (authorityScore * rankingOptions.authorityWeight) +
          (result.contextMatch * rankingOptions.contextWeight);

        return {
          ...result,
          relevanceScore: finalScore
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .filter(result => 
        result.relevanceScore >= (query.similarityThreshold || 
          this.config.retrieval.defaultSimilarityThreshold)
      );
  }

  /**
   * Generate final RAG response with citations and suggestions
   */
  private async generateResponse(
    query: RAGQuery,
    results: SearchResult[],
    queryId: string,
    processingTime: number
  ): Promise<RAGResponse> {
    // Convert search results to document sources
    const sources: DocumentSource[] = results.map(result => ({
      documentId: result.metadata.documentId || result.id,
      title: result.title,
      chunkId: result.id,
      content: result.content,
      relevanceScore: result.relevanceScore,
      metadata: result.metadata,
      citation: result.citation
    }));

    // Generate answer based on top results
    const answer = this.generateAnswer(query.query, results.slice(0, 3));

    // Generate suggestions for related queries
    const suggestions = this.generateSuggestions(query.query, results);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(results);

    return {
      answer,
      sources,
      confidence,
      suggestions,
      processingTime,
      queryId
    };
  }

  /**
   * Calculate confidence score for a search result
   */
  private calculateConfidenceScore(
    similarityScore: number,
    metadata: any,
    context?: QueryContext
  ): number {
    let confidence = similarityScore;

    // Boost confidence for recent documents
    if (metadata.createdDate) {
      const daysSinceCreation = (Date.now() - new Date(metadata.createdDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) {
        confidence += 0.1;
      }
    }

    // Boost confidence for documents with higher access levels
    if (metadata.accessLevel === AccessLevel.CONFIDENTIAL) {
      confidence += 0.05;
    }

    // Boost confidence for context matches
    if (context?.currentProject && metadata.projectId === context.currentProject) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate citation for a document
   */
  private generateCitation(metadata: any): string {
    const title = metadata.title || metadata.fileName || 'Untitled';
    const author = metadata.author || 'Unknown';
    const date = metadata.createdDate ? new Date(metadata.createdDate).toLocaleDateString() : 'Unknown date';
    
    return `${title} by ${author} (${date})`;
  }

  /**
   * Extract highlights from content based on query
   */
  private extractHighlights(content: string, query: string): string[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const highlights: string[] = [];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const matchCount = queryTerms.filter(term => lowerSentence.includes(term)).length;
      
      if (matchCount > 0) {
        highlights.push(sentence.trim());
        if (highlights.length >= 3) break;
      }
    }

    return highlights;
  }

  /**
   * Calculate context match score
   */
  private calculateContextMatch(metadata: any, context?: QueryContext): number {
    let score = 0;

    if (!context) return score;

    if (context.currentProject && metadata.projectId === context.currentProject) {
      score += 0.3;
    }

    if (context.currentClient && metadata.clientId === context.currentClient) {
      score += 0.3;
    }

    if (context.workspaceId && metadata.workspaceId === context.workspaceId) {
      score += 0.2;
    }

    if (context.userRole && metadata.targetRole === context.userRole) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate recency score
   */
  private calculateRecencyScore(createdDate?: string): number {
    if (!createdDate) return 0;

    const daysSinceCreation = (Date.now() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: newer documents get higher scores
    return Math.exp(-daysSinceCreation / 365); // Decay over a year
  }

  /**
   * Calculate authority score based on document metadata
   */
  private calculateAuthorityScore(metadata: any): number {
    let score = 0.5; // Base score

    // Boost for official documents
    if (metadata.category === 'policy' || metadata.category === 'official') {
      score += 0.3;
    }

    // Boost for documents with many references
    if (metadata.referenceCount && metadata.referenceCount > 5) {
      score += 0.2;
    }

    // Boost for documents from trusted authors
    if (metadata.authorRole === 'admin' || metadata.authorRole === 'manager') {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate answer based on search results
   */
  private generateAnswer(query: string, topResults: SearchResult[]): string {
    if (topResults.length === 0) {
      return "I couldn't find relevant information to answer your question.";
    }

    // Simple answer generation - in production, this would use an LLM
    const relevantContent = topResults
      .map(result => result.highlights.join(' '))
      .join(' ')
      .substring(0, 500);

    return `Based on the available documents: ${relevantContent}...`;
  }

  /**
   * Generate query suggestions
   */
  private generateSuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    // Extract common terms from results
    const commonTerms = new Set<string>();
    results.forEach(result => {
      const terms = result.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      terms.forEach(term => commonTerms.add(term));
    });

    // Generate suggestions based on common terms
    const queryTerms = query.toLowerCase().split(/\s+/);
    Array.from(commonTerms)
      .filter(term => !queryTerms.includes(term))
      .slice(0, 3)
      .forEach(term => {
        suggestions.push(`${query} ${term}`);
      });

    return suggestions;
  }

  /**
   * Calculate overall confidence for the response
   */
  private calculateOverallConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;

    const avgConfidence = results.reduce((sum, result) => sum + result.confidenceScore, 0) / results.length;
    const topResultConfidence = results[0]?.confidenceScore || 0;
    
    // Weight average confidence and top result confidence
    return (avgConfidence * 0.6) + (topResultConfidence * 0.4);
  }

  /**
   * Convert vector results to document sources
   */
  private convertToDocumentSources(vectorResults: VectorSearchResult[]): DocumentSource[] {
    return vectorResults.map(result => ({
      documentId: result.metadata.documentId || result.id,
      title: result.metadata.title || result.metadata.fileName || 'Untitled',
      chunkId: result.id,
      content: result.metadata.content || '',
      relevanceScore: result.score,
      metadata: result.metadata,
      citation: this.generateCitation(result.metadata)
    }));
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{
    totalQueries: number;
    avgResponseTime: number;
    avgConfidence: number;
    topQueries: string[];
  }> {
    // This would typically be stored in a database
    return {
      totalQueries: 0,
      avgResponseTime: 0,
      avgConfidence: 0,
      topQueries: []
    };
  }
}