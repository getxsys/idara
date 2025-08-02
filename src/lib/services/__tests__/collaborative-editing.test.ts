import { CollaborativeEditingService } from '../collaborative-editing';
import { io } from 'socket.io-client';
import {
  CollaboratorRole,
  OperationType,
  ResolutionStrategy,
  CommentStatus,
  AnnotationType,
  AnnotationVisibility,
} from '@/types/collaboration';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

describe('CollaborativeEditingService', () => {
  let service: CollaborativeEditingService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
    service = new CollaborativeEditingService('ws://test-server');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('connects to collaboration server', async () => {
      await service.connect('user-123', 'doc-123');

      expect(io).toHaveBeenCalledWith('ws://test-server', {
        auth: {
          userId: 'user-123',
          documentId: 'doc-123',
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    });

    it('sets up socket listeners on connection', async () => {
      await service.connect('user-123', 'doc-123');

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_left', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('operation_applied', expect.any(Function));
    });

    it('disconnects from server', async () => {
      await service.connect('user-123', 'doc-123');
      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isSessionActive).toBe(false);
    });

    it('handles connection errors', async () => {
      (io as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(service.connect('user-123', 'doc-123')).rejects.toThrow('Connection failed');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
    });

    it('joins collaboration session', async () => {
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      const session = await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);

      expect(mockSocket.emit).toHaveBeenCalledWith('join_session', {
        documentId: 'doc-123',
        userId: 'user-123',
        userName: 'Test User',
        role: CollaboratorRole.EDITOR,
      }, expect.any(Function));

      expect(session).toEqual(mockSession);
      expect(service.isSessionActive).toBe(true);
    });

    it('handles join session errors', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: false, error: 'Session not found' });
        }
      });

      await expect(
        service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR)
      ).rejects.toThrow('Session not found');
    });

    it('leaves collaboration session', async () => {
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      // First join a session
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        } else if (event === 'leave_session') {
          callback();
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
      await service.leaveSession();

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_session', {
        sessionId: 'session-123',
      }, expect.any(Function));
    });
  });

  describe('Real-time Editing Operations', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
    });

    it('applies edit operations', async () => {
      const operation = {
        type: OperationType.INSERT,
        position: 10,
        content: 'Hello World',
      };

      await service.applyOperation(operation);

      expect(mockSocket.emit).toHaveBeenCalledWith('edit_operation', {
        sessionId: 'session-123',
        operationId: expect.any(String),
        operation,
      });
    });

    it('undoes operations', async () => {
      await service.undoOperation('op-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('undo_operation', {
        sessionId: 'session-123',
        operationId: 'op-123',
      });
    });

    it('redoes operations', async () => {
      await service.redoOperation('op-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('redo_operation', {
        sessionId: 'session-123',
        operationId: 'op-123',
      });
    });

    it('throws error when not in active session', async () => {
      service.disconnect();

      const operation = {
        type: OperationType.INSERT,
        position: 10,
        content: 'Hello World',
      };

      await expect(service.applyOperation(operation)).rejects.toThrow(
        'Not in an active collaboration session'
      );
    });
  });

  describe('Conflict Resolution', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
    });

    it('resolves conflicts', async () => {
      const mergedOperation = {
        type: OperationType.REPLACE,
        position: 0,
        length: 10,
        content: 'Merged content',
      };

      await service.resolveConflict('conflict-123', ResolutionStrategy.MERGE_CHANGES, mergedOperation);

      expect(mockSocket.emit).toHaveBeenCalledWith('resolve_conflict', {
        sessionId: 'session-123',
        conflictId: 'conflict-123',
        resolution: ResolutionStrategy.MERGE_CHANGES,
        mergedOperation,
      });
    });
  });

  describe('User Presence', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
    });

    it('updates cursor position', () => {
      service.updateCursor(5, 10);

      expect(mockSocket.emit).toHaveBeenCalledWith('cursor_update', {
        sessionId: 'session-123',
        cursor: {
          line: 5,
          column: 10,
          documentId: 'doc-123',
          timestamp: expect.any(Date),
        },
      });
    });

    it('updates text selection', () => {
      service.updateSelection(1, 5, 2, 10, 'selected text');

      expect(mockSocket.emit).toHaveBeenCalledWith('selection_update', {
        sessionId: 'session-123',
        selection: {
          start: {
            line: 1,
            column: 5,
            documentId: 'doc-123',
            timestamp: expect.any(Date),
          },
          end: {
            line: 2,
            column: 10,
            documentId: 'doc-123',
            timestamp: expect.any(Date),
          },
          text: 'selected text',
        },
      });
    });

    it('does not update presence when not connected', () => {
      service.disconnect();
      service.updateCursor(5, 10);

      expect(mockSocket.emit).not.toHaveBeenCalledWith('cursor_update', expect.any(Object));
    });
  });

  describe('Comments and Annotations', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
    });

    it('adds comments', async () => {
      const mockComment = {
        id: 'comment-123',
        documentId: 'doc-123',
        userId: 'user-123',
        userName: 'Test User',
        content: 'Test comment',
        position: { line: 5, column: 10, context: 'context text' },
        thread: { id: 'thread-123', replies: [], resolved: false },
        status: CommentStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'add_comment') {
          callback({ success: true, comment: mockComment });
        }
      });

      const comment = await service.addComment('Test comment', 5, 10, 'context text');

      expect(mockSocket.emit).toHaveBeenCalledWith('add_comment', {
        sessionId: 'session-123',
        content: 'Test comment',
        position: { line: 5, column: 10, context: 'context text' },
      }, expect.any(Function));

      expect(comment).toEqual(mockComment);
    });

    it('updates comments', async () => {
      await service.updateComment('comment-123', 'Updated comment');

      expect(mockSocket.emit).toHaveBeenCalledWith('update_comment', {
        sessionId: 'session-123',
        commentId: 'comment-123',
        content: 'Updated comment',
      });
    });

    it('deletes comments', async () => {
      await service.deleteComment('comment-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('delete_comment', {
        sessionId: 'session-123',
        commentId: 'comment-123',
      });
    });

    it('resolves comments', async () => {
      await service.resolveComment('comment-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('resolve_comment', {
        sessionId: 'session-123',
        commentId: 'comment-123',
      });
    });

    it('adds annotations', async () => {
      const mockAnnotation = {
        id: 'annotation-123',
        documentId: 'doc-123',
        userId: 'user-123',
        type: AnnotationType.HIGHLIGHT,
        position: { start: 10, end: 20 },
        content: 'Annotation content',
        style: { color: '#ffff00' },
        visibility: AnnotationVisibility.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'add_annotation') {
          callback({ success: true, annotation: mockAnnotation });
        }
      });

      const annotation = await service.addAnnotation(
        AnnotationType.HIGHLIGHT,
        10,
        20,
        'Annotation content',
        { color: '#ffff00' }
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('add_annotation', {
        sessionId: 'session-123',
        type: AnnotationType.HIGHLIGHT,
        position: { start: 10, end: 20 },
        content: 'Annotation content',
        style: { color: '#ffff00' },
      }, expect.any(Function));

      expect(annotation).toEqual(mockAnnotation);
    });
  });

  describe('Version Control', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
    });

    it('creates versions', async () => {
      const mockVersion = {
        id: 'version-123',
        documentId: 'doc-123',
        version: 1,
        content: 'Version content',
        changes: [],
        author: 'Test User',
        comment: 'Version comment',
        createdAt: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'create_version') {
          callback({ success: true, version: mockVersion });
        }
      });

      const version = await service.createVersion('Version comment');

      expect(mockSocket.emit).toHaveBeenCalledWith('create_version', {
        sessionId: 'session-123',
        comment: 'Version comment',
      }, expect.any(Function));

      expect(version).toEqual(mockVersion);
    });

    it('gets version history', async () => {
      const mockVersions = [
        {
          id: 'version-123',
          documentId: 'doc-123',
          version: 1,
          content: 'Version content',
          changes: [],
          author: 'Test User',
          createdAt: new Date(),
        },
      ];

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'get_version_history') {
          callback({ success: true, versions: mockVersions });
        }
      });

      const versions = await service.getVersionHistory();

      expect(mockSocket.emit).toHaveBeenCalledWith('get_version_history', {
        sessionId: 'session-123',
      }, expect.any(Function));

      expect(versions).toEqual(mockVersions);
    });

    it('reverts to version', async () => {
      await service.revertToVersion('version-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('revert_to_version', {
        sessionId: 'session-123',
        versionId: 'version-123',
      });
    });
  });

  describe('Change Tracking', () => {
    beforeEach(async () => {
      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);
    });

    it('accepts changes', async () => {
      await service.acceptChange('change-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('accept_change', {
        sessionId: 'session-123',
        changeId: 'change-123',
      });
    });

    it('rejects changes', async () => {
      await service.rejectChange('change-123', 'Not appropriate');

      expect(mockSocket.emit).toHaveBeenCalledWith('reject_change', {
        sessionId: 'session-123',
        changeId: 'change-123',
        reason: 'Not appropriate',
      });
    });
  });

  describe('Event Management', () => {
    it('registers event listeners', () => {
      const callback = jest.fn();
      service.on('test_event', callback);

      // Simulate event emission
      (service as any).emit('test_event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('removes event listeners', () => {
      const callback = jest.fn();
      service.on('test_event', callback);
      service.off('test_event', callback);

      // Simulate event emission
      (service as any).emit('test_event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Getters', () => {
    it('returns session active status', async () => {
      expect(service.isSessionActive).toBe(false);

      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);

      expect(service.isSessionActive).toBe(true);
    });

    it('returns current session ID', async () => {
      expect(service.currentSessionId).toBe(null);

      await service.connect('user-123', 'doc-123');
      
      const mockSession = {
        id: 'session-123',
        documentId: 'doc-123',
        participants: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'join_session') {
          callback({ success: true, session: mockSession });
        }
      });

      await service.joinSession('doc-123', 'user-123', 'Test User', CollaboratorRole.EDITOR);

      expect(service.currentSessionId).toBe('session-123');
    });

    it('returns session participants', () => {
      expect(service.sessionParticipants).toEqual([]);
    });
  });
});