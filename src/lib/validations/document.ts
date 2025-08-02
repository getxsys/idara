import { z } from 'zod';
import {
  DocumentType,
  DocumentFormat,
  AccessLevel,
  SourceType,
  EntityType,
  RelationshipType,
  ChangeType,
  CollaboratorRole,
  DocumentAction,
  ComplexityLevel,
  DocumentInsightType,
  IndexingStatus,
} from '@/types/document';

// Base schemas
export const extractedEntitySchema = z.object({
  type: z.nativeEnum(EntityType),
  value: z.string().min(1, 'Entity value is required'),
  confidence: z.number().min(0).max(1),
  startPosition: z.number().min(0),
  endPosition: z.number().min(0),
}).refine((data) => data.endPosition >= data.startPosition, {
  message: 'End position must be greater than or equal to start position',
  path: ['endPosition'],
});

export const documentSourceSchema = z.object({
  type: z.nativeEnum(SourceType),
  url: z.string().url('Invalid URL').optional(),
  filename: z.string().max(255).optional(),
  uploadedBy: z.string().uuid().optional(),
  importedFrom: z.string().max(100).optional(),
  originalPath: z.string().max(500).optional(),
});

export const documentMetadataSchema = z.object({
  type: z.nativeEnum(DocumentType),
  format: z.nativeEnum(DocumentFormat),
  size: z.number().min(0, 'Size must be positive'),
  language: z.string().min(2, 'Language code is required').max(5),
  author: z.string().min(1, 'Author is required').max(100),
  source: documentSourceSchema,
  category: z.string().min(1, 'Category is required').max(100),
  subcategory: z.string().max(100).optional(),
  keywords: z.array(z.string()).default([]),
  summary: z.string().max(1000),
  extractedEntities: z.array(extractedEntitySchema).default([]),
  customFields: z.record(z.string(), z.any()).default({}),
});

export const documentRelationshipSchema = z.object({
  id: z.string().uuid(),
  relatedDocumentId: z.string().uuid(),
  relationshipType: z.nativeEnum(RelationshipType),
  strength: z.number().min(0).max(1),
  description: z.string().max(500).optional(),
  createdAt: z.date().default(() => new Date()),
});

export const documentChangeSchema = z.object({
  type: z.nativeEnum(ChangeType),
  section: z.string().min(1, 'Section is required').max(100),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  position: z.number().min(0),
  length: z.number().min(0),
});

export const documentVersionSchema = z.object({
  id: z.string().uuid(),
  version: z.string().min(1, 'Version is required').max(20),
  content: z.string().min(1, 'Content is required'),
  changes: z.array(documentChangeSchema).default([]),
  author: z.string().min(1, 'Author is required').max(100),
  comment: z.string().max(500).optional(),
  createdAt: z.date().default(() => new Date()),
});

export const documentPermissionSchema = z.object({
  action: z.nativeEnum(DocumentAction),
  granted: z.boolean(),
  grantedBy: z.string().uuid(),
  grantedAt: z.date().default(() => new Date()),
});

export const documentCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(CollaboratorRole),
  permissions: z.array(documentPermissionSchema).default([]),
  lastAccessed: z.date(),
  addedAt: z.date().default(() => new Date()),
});

export const textPassageSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  startPosition: z.number().min(0),
  endPosition: z.number().min(0),
  score: z.number().min(0).max(1),
}).refine((data) => data.endPosition >= data.startPosition, {
  message: 'End position must be greater than or equal to start position',
  path: ['endPosition'],
});

export const emotionAnalysisSchema = z.object({
  emotion: z.string().min(1, 'Emotion name is required'),
  score: z.number().min(0).max(1),
  passages: z.array(textPassageSchema).default([]),
});

export const toneAnalysisSchema = z.object({
  formal: z.number().min(0).max(1),
  confident: z.number().min(0).max(1),
  analytical: z.number().min(0).max(1),
  tentative: z.number().min(0).max(1),
});

export const sentimentAnalysisSchema = z.object({
  overall: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  emotions: z.array(emotionAnalysisSchema).default([]),
  tone: toneAnalysisSchema,
});

export const topicAnalysisSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  relevance: z.number().min(0).max(1),
  keywords: z.array(z.string()).default([]),
  passages: z.array(textPassageSchema).default([]),
});

export const documentInsightSchema = z.object({
  type: z.nativeEnum(DocumentInsightType),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000),
  confidence: z.number().min(0).max(1),
  actionable: z.boolean().default(false),
  suggestedActions: z.array(z.string()).default([]),
  relatedDocuments: z.array(z.string().uuid()).default([]),
});

export const documentAIAnalysisSchema = z.object({
  sentiment: sentimentAnalysisSchema,
  topics: z.array(topicAnalysisSchema).default([]),
  readabilityScore: z.number().min(0).max(100),
  complexity: z.nativeEnum(ComplexityLevel),
  keyInsights: z.array(documentInsightSchema).default([]),
  suggestedTags: z.array(z.string()).default([]),
  relatedDocuments: z.array(z.string().uuid()).default([]),
  qualityScore: z.number().min(0).max(100),
  lastAnalyzed: z.date().default(() => new Date()),
});

export const documentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  metadata: documentMetadataSchema,
  embeddings: z.array(z.number()).optional(),
  tags: z.array(z.string()).default([]),
  accessLevel: z.nativeEnum(AccessLevel),
  relationships: z.array(documentRelationshipSchema).default([]),
  versions: z.array(documentVersionSchema).default([]),
  collaborators: z.array(documentCollaboratorSchema).default([]),
  aiAnalysis: documentAIAnalysisSchema,
  lastIndexed: z.date(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// RAG-specific schemas
export const chunkMetadataSchema = z.object({
  chunkIndex: z.number().min(0),
  totalChunks: z.number().min(1),
  overlapWithPrevious: z.number().min(0).max(1),
  overlapWithNext: z.number().min(0).max(1),
  tokenCount: z.number().min(0),
  characterCount: z.number().min(0),
});

export const chunkPositionSchema = z.object({
  startPosition: z.number().min(0),
  endPosition: z.number().min(0),
  section: z.string().optional(),
  paragraph: z.number().min(0).optional(),
  page: z.number().min(0).optional(),
}).refine((data) => data.endPosition >= data.startPosition, {
  message: 'End position must be greater than or equal to start position',
  path: ['endPosition'],
});

export const documentChunkSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, 'Chunk content is required'),
  embeddings: z.array(z.number()).min(1, 'Embeddings are required'),
  metadata: chunkMetadataSchema,
  position: chunkPositionSchema,
});

export const retrievalRecordSchema = z.object({
  queryId: z.string().uuid(),
  query: z.string().min(1, 'Query is required'),
  relevanceScore: z.number().min(0).max(1),
  retrievedAt: z.date().default(() => new Date()),
  userId: z.string().uuid(),
});

export const retrievalMetricsSchema = z.object({
  queryCount: z.number().min(0),
  averageRelevanceScore: z.number().min(0).max(1),
  lastQueried: z.date(),
  popularChunks: z.array(z.string().uuid()).default([]),
  retrievalHistory: z.array(retrievalRecordSchema).default([]),
});

export const ragDocumentSchema = documentSchema.extend({
  chunks: z.array(documentChunkSchema).default([]),
  indexingStatus: z.nativeEnum(IndexingStatus),
  retrievalMetrics: retrievalMetricsSchema,
});

export const queryContextSchema = z.object({
  currentProject: z.string().uuid().optional(),
  currentClient: z.string().uuid().optional(),
  userRole: z.string().min(1, 'User role is required'),
  workContext: z.array(z.string()).default([]),
  previousQueries: z.array(z.string()).default([]),
});

export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine((data) => data.end >= data.start, {
  message: 'End date must be after start date',
  path: ['end'],
});

export const searchFiltersSchema = z.object({
  documentTypes: z.array(z.nativeEnum(DocumentType)).optional(),
  dateRange: dateRangeSchema.optional(),
  authors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  accessLevels: z.array(z.nativeEnum(AccessLevel)).optional(),
  minRelevanceScore: z.number().min(0).max(1).optional(),
});

export const ragQuerySchema = z.object({
  id: z.string().uuid(),
  query: z.string().min(1, 'Query is required').max(1000),
  context: queryContextSchema,
  filters: searchFiltersSchema.default({}),
  userId: z.string().uuid(),
  timestamp: z.date().default(() => new Date()),
});

export const ragResponseSchema = z.object({
  id: z.string().uuid(),
  query: z.string().min(1, 'Query is required'),
  answer: z.string().min(1, 'Answer is required'),
  sources: z.array(documentSourceSchema).default([]),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string()).default([]),
  relatedQueries: z.array(z.string()).default([]),
  processingTime: z.number().min(0),
  timestamp: z.date().default(() => new Date()),
});

// Create document schema (for API endpoints)
export const createDocumentSchema = documentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastIndexed: true,
  aiAnalysis: true,
  versions: true,
  relationships: true,
}).extend({
  metadata: documentMetadataSchema.omit({
    extractedEntities: true,
    size: true,
  }),
});

// Update document schema
export const updateDocumentSchema = createDocumentSchema.partial().extend({
  id: z.string().uuid(),
});

// Document query schema
export const documentQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['title', 'type', 'createdAt', 'updatedAt', 'lastIndexed']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  type: z.nativeEnum(DocumentType).optional(),
  accessLevel: z.nativeEnum(AccessLevel).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
});

// RAG query schema for API
export const createRAGQuerySchema = ragQuerySchema.omit({
  id: true,
  timestamp: true,
});

// Type exports
export type DocumentData = z.infer<typeof documentSchema>;
export type CreateDocumentData = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentData = z.infer<typeof updateDocumentSchema>;
export type DocumentQueryData = z.infer<typeof documentQuerySchema>;
export type RAGDocumentData = z.infer<typeof ragDocumentSchema>;
export type RAGQueryData = z.infer<typeof ragQuerySchema>;
export type CreateRAGQueryData = z.infer<typeof createRAGQuerySchema>;
export type RAGResponseData = z.infer<typeof ragResponseSchema>;
export type DocumentChunkData = z.infer<typeof documentChunkSchema>;
export type QueryContextData = z.infer<typeof queryContextSchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;