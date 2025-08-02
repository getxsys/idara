import { io, Socket } from 'socket.io-client';
import {
  CollaborativeSession,
  SessionParticipant,
  CollaborativeEdit,
  EditOperation,
  ConflictResolution,
  Comment,
  Annotation,
  DocumentVersion,
  TrackedChange,
  CollaborationEvent,
  UserPresenceEvent,
  EditEvent,
  CommentEvent,
  AnnotationEvent,
  OperationType,
  ResolutionStrategy,
  ChangeStatus,
  CollaboratorRole,
} from '@/types/collaboration';

export class CollaborativeEditingService {
  private socket: Socket | null = null;
  private currentSession: CollaborativeSession | null = null;
  private participants: Map<string, SessionParticipant> = new Map();
  private pendingOperations: Map<string, EditOperation> = new Map();
  private operationQueue: EditOperation[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(private serverUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') {
    this.initializeEventListeners();
  }

  // Connection Management
  async connect(userId: string, documentId: string): Promise<void> {
    try {
      this.socket = io(this.serverUrl, {
        auth: {
          userId,
          documentId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      await this.setupSocketListeners();
      this.isConnected = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to collaboration server:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentSession = null;
    this.participants.clear();
    this.pendingOperations.clear();
    this.operationQueue = [];
  }

  // Session Management
  async joinSession(documentId: string, userId: string, userName: string, role: CollaboratorRole): Promise<CollaborativeSession> {
    if (!this.socket) {
      throw new Error('Not connected to collaboration server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_session', {
        documentId,
        userId,
        userName,
        role,
      }, (response: { success: boolean; session?: CollaborativeSession; error?: string }) => {
        if (response.success && response.session) {
          this.currentSession = response.session;
          resolve(response.session);
        } else {
          reject(new Error(response.error || 'Failed to join session'));
        }
      });
    });
  }

  async leaveSession(): Promise<void> {
    if (!this.socket || !this.currentSession) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave_session', {
        sessionId: this.currentSession!.id,
      }, () => {
        this.currentSession = null;
        this.participants.clear();
        resolve();
      });
    });
  }

  // Real-time Editing Operations
  async applyOperation(operation: EditOperation): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    // Add to pending operations
    const operationId = this.generateOperationId();
    this.pendingOperations.set(operationId, operation);

    // Send to server
    this.socket.emit('edit_operation', {
      sessionId: this.currentSession.id,
      operationId,
      operation,
    });

    // Apply locally with optimistic updates
    this.emit('operation_applied', { operation, operationId });
  }

  async undoOperation(operationId: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('undo_operation', {
      sessionId: this.currentSession.id,
      operationId,
    });
  }

  async redoOperation(operationId: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('redo_operation', {
      sessionId: this.currentSession.id,
      operationId,
    });
  }

  // Conflict Resolution
  async resolveConflict(conflictId: string, resolution: ResolutionStrategy, mergedOperation?: EditOperation): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('resolve_conflict', {
      sessionId: this.currentSession.id,
      conflictId,
      resolution,
      mergedOperation,
    });
  }

  // User Presence
  updateCursor(line: number, column: number): void {
    if (!this.socket || !this.currentSession) {
      return;
    }

    this.socket.emit('cursor_update', {
      sessionId: this.currentSession.id,
      cursor: {
        line,
        column,
        documentId: this.currentSession.documentId,
        timestamp: new Date(),
      },
    });
  }

  updateSelection(startLine: number, startColumn: number, endLine: number, endColumn: number, text: string): void {
    if (!this.socket || !this.currentSession) {
      return;
    }

    this.socket.emit('selection_update', {
      sessionId: this.currentSession.id,
      selection: {
        start: { line: startLine, column: startColumn, documentId: this.currentSession.documentId, timestamp: new Date() },
        end: { line: endLine, column: endColumn, documentId: this.currentSession.documentId, timestamp: new Date() },
        text,
      },
    });
  }

  // Comments and Annotations
  async addComment(content: string, line: number, column: number, context: string): Promise<Comment> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('add_comment', {
        sessionId: this.currentSession!.id,
        content,
        position: { line, column, context },
      }, (response: { success: boolean; comment?: Comment; error?: string }) => {
        if (response.success && response.comment) {
          resolve(response.comment);
        } else {
          reject(new Error(response.error || 'Failed to add comment'));
        }
      });
    });
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('update_comment', {
      sessionId: this.currentSession.id,
      commentId,
      content,
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('delete_comment', {
      sessionId: this.currentSession.id,
      commentId,
    });
  }

  async resolveComment(commentId: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('resolve_comment', {
      sessionId: this.currentSession.id,
      commentId,
    });
  }

  async addAnnotation(type: string, start: number, end: number, content: string, style: any): Promise<Annotation> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('add_annotation', {
        sessionId: this.currentSession!.id,
        type,
        position: { start, end },
        content,
        style,
      }, (response: { success: boolean; annotation?: Annotation; error?: string }) => {
        if (response.success && response.annotation) {
          resolve(response.annotation);
        } else {
          reject(new Error(response.error || 'Failed to add annotation'));
        }
      });
    });
  }

  // Version Control
  async createVersion(comment?: string): Promise<DocumentVersion> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('create_version', {
        sessionId: this.currentSession!.id,
        comment,
      }, (response: { success: boolean; version?: DocumentVersion; error?: string }) => {
        if (response.success && response.version) {
          resolve(response.version);
        } else {
          reject(new Error(response.error || 'Failed to create version'));
        }
      });
    });
  }

  async getVersionHistory(): Promise<DocumentVersion[]> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('get_version_history', {
        sessionId: this.currentSession!.id,
      }, (response: { success: boolean; versions?: DocumentVersion[]; error?: string }) => {
        if (response.success && response.versions) {
          resolve(response.versions);
        } else {
          reject(new Error(response.error || 'Failed to get version history'));
        }
      });
    });
  }

  async revertToVersion(versionId: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('revert_to_version', {
      sessionId: this.currentSession.id,
      versionId,
    });
  }

  // Change Tracking
  async acceptChange(changeId: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('accept_change', {
      sessionId: this.currentSession.id,
      changeId,
    });
  }

  async rejectChange(changeId: string, reason?: string): Promise<void> {
    if (!this.socket || !this.currentSession) {
      throw new Error('Not in an active collaboration session');
    }

    this.socket.emit('reject_change', {
      sessionId: this.currentSession.id,
      changeId,
      reason,
    });
  }

  // Event Management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Private Methods
  private async setupSocketListeners(): Promise<void> {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.emit('disconnected', {});
    });

    this.socket.on('reconnect', () => {
      this.isConnected = true;
      this.emit('reconnected', {});
    });

    this.socket.on('user_joined', (data: UserPresenceEvent['data']) => {
      this.participants.set(data.participant.userId, data.participant);
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data: UserPresenceEvent['data']) => {
      this.participants.delete(data.participant.userId);
      this.emit('user_left', data);
    });

    this.socket.on('cursor_moved', (data: UserPresenceEvent['data']) => {
      if (data.participant && data.cursor) {
        const participant = this.participants.get(data.participant.userId);
        if (participant) {
          participant.cursor = data.cursor;
          this.emit('cursor_moved', data);
        }
      }
    });

    this.socket.on('selection_changed', (data: UserPresenceEvent['data']) => {
      if (data.participant && data.selection) {
        const participant = this.participants.get(data.participant.userId);
        if (participant) {
          participant.selection = data.selection;
          this.emit('selection_changed', data);
        }
      }
    });

    this.socket.on('operation_applied', (data: EditEvent['data']) => {
      this.emit('operation_applied', data);
    });

    this.socket.on('operation_conflict', (data: EditEvent['data']) => {
      this.emit('operation_conflict', data);
    });

    this.socket.on('conflict_resolved', (data: EditEvent['data']) => {
      this.emit('conflict_resolved', data);
    });

    this.socket.on('comment_added', (data: CommentEvent['data']) => {
      this.emit('comment_added', data);
    });

    this.socket.on('comment_updated', (data: CommentEvent['data']) => {
      this.emit('comment_updated', data);
    });

    this.socket.on('comment_deleted', (data: CommentEvent['data']) => {
      this.emit('comment_deleted', data);
    });

    this.socket.on('comment_resolved', (data: CommentEvent['data']) => {
      this.emit('comment_resolved', data);
    });

    this.socket.on('annotation_added', (data: AnnotationEvent['data']) => {
      this.emit('annotation_added', data);
    });

    this.socket.on('annotation_updated', (data: AnnotationEvent['data']) => {
      this.emit('annotation_updated', data);
    });

    this.socket.on('annotation_deleted', (data: AnnotationEvent['data']) => {
      this.emit('annotation_deleted', data);
    });

    this.socket.on('version_created', (data: { version: DocumentVersion }) => {
      this.emit('version_created', data);
    });

    this.socket.on('change_accepted', (data: { change: TrackedChange }) => {
      this.emit('change_accepted', data);
    });

    this.socket.on('change_rejected', (data: { change: TrackedChange }) => {
      this.emit('change_rejected', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Collaboration error:', error);
      this.emit('error', error);
    });
  }

  private initializeEventListeners(): void {
    // Initialize event listener maps
    this.eventListeners.set('connected', []);
    this.eventListeners.set('disconnected', []);
    this.eventListeners.set('reconnected', []);
    this.eventListeners.set('user_joined', []);
    this.eventListeners.set('user_left', []);
    this.eventListeners.set('cursor_moved', []);
    this.eventListeners.set('selection_changed', []);
    this.eventListeners.set('operation_applied', []);
    this.eventListeners.set('operation_conflict', []);
    this.eventListeners.set('conflict_resolved', []);
    this.eventListeners.set('comment_added', []);
    this.eventListeners.set('comment_updated', []);
    this.eventListeners.set('comment_deleted', []);
    this.eventListeners.set('comment_resolved', []);
    this.eventListeners.set('annotation_added', []);
    this.eventListeners.set('annotation_updated', []);
    this.eventListeners.set('annotation_deleted', []);
    this.eventListeners.set('version_created', []);
    this.eventListeners.set('change_accepted', []);
    this.eventListeners.set('change_rejected', []);
    this.eventListeners.set('error', []);
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  get isSessionActive(): boolean {
    return this.currentSession !== null && this.isConnected;
  }

  get sessionParticipants(): SessionParticipant[] {
    return Array.from(this.participants.values());
  }

  get currentSessionId(): string | null {
    return this.currentSession?.id || null;
  }
}

// Singleton instance
export const collaborativeEditingService = new CollaborativeEditingService();