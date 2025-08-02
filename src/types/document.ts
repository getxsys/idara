export interface Document {
  id: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  embeddings?: number[];
  tags: string[];
  accessLevel: AccessLevel;
  relationships: DocumentRelationship[];
  versions: DocumentVersion[];
  collaborators: DocumentCollaborator[];
  aiAnalysis: DocumentAIAnalysis;
  lastIndexed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  type: DocumentType;
  format: DocumentFormat;
  size: number; // in bytes
  language: string;
  author: string;
  source: DocumentSource;
  category: string;
  subcategory?: string;
  keywords: string[];
  summary: string;
  extractedEntities: ExtractedEntity[];
  customFields: Record<string, any>;
}

export interface DocumentSource {
  type: SourceType;
  url?: string;
  filename?: string;
  uploadedBy?: string;
  importedFrom?: string;
  originalPath?: string;
}

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number; // 0-1
  startPosition: number;
  endPosition: number;
}

export interface DocumentRelationship {
  id: string;
  relatedDocumentId: string;
  relationshipType: RelationshipType;
  strength: number; // 0-1
  description?: string;
  createdAt: Date;
}

export interface DocumentVersion {
  id: string;
  version: string;
  content: string;
  changes: DocumentChange[];
  author: string;
  comment?: string;
  createdAt: Date;
}

export interface DocumentChange {
  type: ChangeType;
  section: string;
  oldValue?: string;
  newValue?: string;
  position: number;
  length: number;
}

export interface DocumentCollaborator {
  userId: string;
  role: CollaboratorRole;
  permissions: DocumentPermission[];
  lastAccessed: Date;
  addedAt: Date;
}

export interface DocumentPermission {
  action: DocumentAction;
  granted: boolean;
  grantedBy: string;
  grantedAt: Date;
}

export interface DocumentAIAnalysis {
  sentiment: SentimentAnalysis;
  topics: TopicAnalysis[];
  readabilityScore: number; // 0-100
  complexity: ComplexityLevel;
  keyInsights: DocumentInsight[];
  suggestedTags: string[];
  relatedDocuments: string[];
  qualityScore: number; // 0-100
  lastAnalyzed: Date;
}

export interface SentimentAnalysis {
  overall: number; // -1 to 1
  confidence: number; // 0 to 1
  emotions: EmotionAnalysis[];
  tone: ToneAnalysis;
}

export interface EmotionAnalysis {
  emotion: string;
  score: number; // 0 to 1
  passages: TextPassage[];
}

export interface ToneAnalysis {
  formal: number; // 0 to 1
  confident: number; // 0 to 1
  analytical: number; // 0 to 1
  tentative: number; // 0 to 1
}

export interface TextPassage {
  text: string;
  startPosition: number;
  endPosition: number;
  score: number;
}

export interface TopicAnalysis {
  topic: string;
  relevance: number; // 0 to 1
  keywords: string[];
  passages: TextPassage[];
}

export interface DocumentInsight {
  type: DocumentInsightType;
  title: string;
  description: string;
  confidence: number; // 0 to 1
  actionable: boolean;
  suggestedActions: string[];
  relatedDocuments: string[];
}

// RAG-specific interfaces
export interface RAGDocument extends Document {
  chunks: DocumentChunk[];
  indexingStatus: IndexingStatus;
  retrievalMetrics: RetrievalMetrics;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embeddings: number[];
  metadata: ChunkMetadata;
  position: ChunkPosition;
}

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  overlapWithPrevious: number;
  overlapWithNext: number;
  tokenCount: number;
  characterCount: number;
}

export interface ChunkPosition {
  startPosition: number;
  endPosition: number;
  section?: string;
  paragraph?: number;
  page?: number;
}

export interface RetrievalMetrics {
  queryCount: number;
  averageRelevanceScore: number;
  lastQueried: Date;
  popularChunks: string[];
  retrievalHistory: RetrievalRecord[];
}

export interface RetrievalRecord {
  queryId: string;
  query: string;
  relevanceScore: number;
  retrievedAt: Date;
  userId: string;
}

export interface RAGQuery {
  id: string;
  query: string;
  context: QueryContext;
  filters: SearchFilters;
  userId: string;
  timestamp: Date;
}

export interface QueryContext {
  currentProject?: string;
  currentClient?: string;
  userRole: string;
  workContext: string[];
  previousQueries: string[];
}

export interface SearchFilters {
  documentTypes?: DocumentType[];
  dateRange?: DateRange;
  authors?: string[];
  tags?: string[];
  accessLevels?: AccessLevel[];
  minRelevanceScore?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RAGResponse {
  id: string;
  query: string;
  answer: string;
  sources: DocumentSource[];
  confidence: number; // 0 to 1
  suggestions: string[];
  relatedQueries: string[];
  processingTime: number; // in milliseconds
  timestamp: Date;
}

// Enums
export enum DocumentType {
  CONTRACT = 'contract',
  PROPOSAL = 'proposal',
  REPORT = 'report',
  PRESENTATION = 'presentation',
  SPECIFICATION = 'specification',
  MANUAL = 'manual',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  MEETING_NOTES = 'meeting_notes',
  EMAIL = 'email',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  LEGAL = 'legal',
  MARKETING = 'marketing',
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  OTHER = 'other',
}

export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  TXT = 'txt',
  MD = 'md',
  HTML = 'html',
  RTF = 'rtf',
  ODT = 'odt',
  PPTX = 'pptx',
  PPT = 'ppt',
  XLSX = 'xlsx',
  XLS = 'xls',
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
}

export enum AccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret',
}

export enum SourceType {
  UPLOAD = 'upload',
  EMAIL_IMPORT = 'email_import',
  API_IMPORT = 'api_import',
  MANUAL_ENTRY = 'manual_entry',
  SYSTEM_GENERATED = 'system_generated',
  EXTERNAL_LINK = 'external_link',
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  MONEY = 'money',
  PERCENTAGE = 'percentage',
  PHONE = 'phone',
  EMAIL = 'email',
  URL = 'url',
  PRODUCT = 'product',
  PROJECT = 'project',
}

export enum RelationshipType {
  REFERENCES = 'references',
  SUPERSEDES = 'supersedes',
  SUPPLEMENTS = 'supplements',
  CONTRADICTS = 'contradicts',
  SIMILAR_TO = 'similar_to',
  PART_OF = 'part_of',
  DERIVED_FROM = 'derived_from',
  RELATED_TO = 'related_to',
}

export enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  MODIFY = 'modify',
  MOVE = 'move',
  FORMAT = 'format',
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}

export enum DocumentAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  COMMENT = 'comment',
  APPROVE = 'approve',
  DOWNLOAD = 'download',
  PRINT = 'print',
}

export enum ComplexityLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum DocumentInsightType {
  SUMMARY = 'summary',
  KEY_POINT = 'key_point',
  ACTION_ITEM = 'action_item',
  RISK = 'risk',
  OPPORTUNITY = 'opportunity',
  INCONSISTENCY = 'inconsistency',
  RECOMMENDATION = 'recommendation',
}

export enum IndexingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NEEDS_REINDEX = 'needs_reindex',
}