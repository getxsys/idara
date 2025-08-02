export interface CollaborativeSession {
  id: string;
  documentId: string;
  participants: SessionParticipant[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: CollaboratorRole;
  isOnline: boolean;
  cursor?: CursorPosition;
  selection?: TextSelection;
  color: string; // Unique color for this participant
  joinedAt: Date;
  lastSeen: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
  documentId: string;
  timestamp: Date;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}

export interface CollaborativeEdit {
  id: string;
  sessionId: string;
  userId: string;
  operation: EditOperation;
  timestamp: Date;
  version: number;
  applied: boolean;
}

export interface EditOperation {
  type: OperationType;
  position: number;
  length?: number;
  content?: string;
  metadata?: OperationMetadata;
}

export interface OperationMetadata {
  source: 'user' | 'system' | 'ai';
  confidence?: number;
  reason?: string;
}

export interface ConflictResolution {
  conflictId: string;
  operations: EditOperation[];
  resolution: ResolutionStrategy;
  resolvedBy: string;
  resolvedAt: Date;
  mergedOperation?: EditOperation;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: CommentPosition;
  thread: CommentThread;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentPosition {
  line: number;
  column: number;
  selection?: TextSelection;
  context: string; // Surrounding text for context
}

export interface CommentThread {
  id: string;
  replies: CommentReply[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Annotation {
  id: string;
  documentId: string;
  userId: string;
  type: AnnotationType;
  position: AnnotationPosition;
  content: string;
  style: AnnotationStyle;
  visibility: AnnotationVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnotationPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface AnnotationStyle {
  color: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'strikethrough';
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changes: VersionChange[];
  author: string;
  comment?: string;
  createdAt: Date;
  parentVersion?: string;
  branches?: string[];
}

export interface VersionChange {
  type: ChangeType;
  position: number;
  length: number;
  oldContent?: string;
  newContent?: string;
  author: string;
  timestamp: Date;
}

export interface ChangeTracking {
  enabled: boolean;
  trackingMode: TrackingMode;
  changes: TrackedChange[];
  reviewers: string[];
  approvalRequired: boolean;
}

export interface TrackedChange {
  id: string;
  type: ChangeType;
  position: number;
  length: number;
  oldContent?: string;
  newContent?: string;
  author: string;
  timestamp: Date;
  status: ChangeStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  comment?: string;
}

// WebSocket Events
export interface CollaborationEvent {
  type: CollaborationEventType;
  sessionId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

export interface UserPresenceEvent extends CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'user_cursor_moved' | 'user_selection_changed';
  data: {
    participant: SessionParticipant;
    cursor?: CursorPosition;
    selection?: TextSelection;
  };
}

export interface EditEvent extends CollaborationEvent {
  type: 'edit_operation' | 'edit_conflict' | 'edit_resolved';
  data: {
    operation: EditOperation;
    conflict?: ConflictResolution;
  };
}

export interface CommentEvent extends CollaborationEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted' | 'comment_resolved';
  data: {
    comment: Comment;
  };
}

export interface AnnotationEvent extends CollaborationEvent {
  type: 'annotation_added' | 'annotation_updated' | 'annotation_deleted';
  data: {
    annotation: Annotation;
  };
}

// Enums
export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}

export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  FORMAT = 'format',
  MOVE = 'move',
}

export enum ResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MERGE_CHANGES = 'merge_changes',
  MANUAL_RESOLUTION = 'manual_resolution',
  AI_ASSISTED = 'ai_assisted',
}

export enum CommentStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
}

export enum AnnotationType {
  HIGHLIGHT = 'highlight',
  NOTE = 'note',
  SUGGESTION = 'suggestion',
  CORRECTION = 'correction',
  QUESTION = 'question',
}

export enum AnnotationVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  TEAM = 'team',
  REVIEWERS_ONLY = 'reviewers_only',
}

export enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  MODIFY = 'modify',
  MOVE = 'move',
  FORMAT = 'format',
}

export enum TrackingMode {
  ALL_CHANGES = 'all_changes',
  MAJOR_CHANGES = 'major_changes',
  MANUAL_TRACKING = 'manual_tracking',
  DISABLED = 'disabled',
}

export enum ChangeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
}

export enum CollaborationEventType {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_CURSOR_MOVED = 'user_cursor_moved',
  USER_SELECTION_CHANGED = 'user_selection_changed',
  EDIT_OPERATION = 'edit_operation',
  EDIT_CONFLICT = 'edit_conflict',
  EDIT_RESOLVED = 'edit_resolved',
  COMMENT_ADDED = 'comment_added',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
  COMMENT_RESOLVED = 'comment_resolved',
  ANNOTATION_ADDED = 'annotation_added',
  ANNOTATION_UPDATED = 'annotation_updated',
  ANNOTATION_DELETED = 'annotation_deleted',
  VERSION_CREATED = 'version_created',
  DOCUMENT_LOCKED = 'document_locked',
  DOCUMENT_UNLOCKED = 'document_unlocked',
}