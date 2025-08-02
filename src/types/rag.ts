export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  embeddings?: number[];
  tags: string[];
  accessLevel: AccessLevel;
  lastIndexed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  author?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  language?: string;
  category?: string;
  summary?: string;
  keywords?: string[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embeddings: number[];
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  wordCount: number;
  characterCount: number;
  section?: string;
  heading?: string;
  pageNumber?: number;
}

export interface RAGQuery {
  query: string;
  context?: QueryContext;
  filters?: SearchFilters;
  userId: string;
  maxResults?: number;
  similarityThreshold?: number;
}

export interface QueryContext {
  currentProject?: string;
  currentClient?: string;
  userRole?: string;
  workspaceId?: string;
  sessionId?: string;
}

export interface SearchFilters {
  documentTypes?: string[];
  categories?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  authors?: string[];
  tags?: string[];
  accessLevel?: AccessLevel;
}

export interface RAGResponse {
  answer: string;
  sources: DocumentSource[];
  confidence: number;
  suggestions: string[];
  processingTime: number;
  queryId: string;
}

export interface DocumentSource {
  documentId: string;
  title: string;
  chunkId: string;
  content: string;
  relevanceScore: number;
  metadata: DocumentMetadata;
  citation: string;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface IndexingJob {
  id: string;
  documentId: string;
  status: IndexingStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  chunksProcessed: number;
  totalChunks: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  values?: number[];
}

export interface VectorSearchRequest {
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
  includeValues?: boolean;
  includeMetadata?: boolean;
}

export enum AccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export enum IndexingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum DocumentType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  HTML = 'html',
  MD = 'md',
  JSON = 'json',
  CSV = 'csv'
}

export interface RAGConfig {
  vectorDatabase: {
    provider: 'pinecone' | 'weaviate';
    apiKey: string;
    environment?: string;
    indexName: string;
    dimension: number;
  };
  embeddings: {
    provider: 'openai' | 'google';
    model: string;
    apiKey: string;
    dimension: number;
  };
  chunking: {
    maxChunkSize: number;
    chunkOverlap: number;
    preserveStructure: boolean;
  };
  retrieval: {
    defaultTopK: number;
    defaultSimilarityThreshold: number;
    maxContextLength: number;
  };
}