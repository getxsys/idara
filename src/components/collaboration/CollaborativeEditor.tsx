'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  MessageSquare, 
  History, 
  Save, 
  Undo, 
  Redo,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GitBranch
} from 'lucide-react';
import { collaborativeEditingService } from '@/lib/services/collaborative-editing';
import {
  SessionParticipant,
  EditOperation,
  Comment,
  Annotation,
  DocumentVersion,
  CollaboratorRole,
  OperationType,
} from '@/types/collaboration';

interface CollaborativeEditorProps {
  documentId: string;
  userId: string;
  userName: string;
  userRole: CollaboratorRole;
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave: (content: string) => Promise<void>;
  className?: string;
}

export function CollaborativeEditor({
  documentId,
  userId,
  userName,
  userRole,
  initialContent,
  onContentChange,
  onSave,
  className = '',
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositions = useRef<Map<string, { line: number; column: number }>>(new Map());
  const lastSavedContent = useRef(initialContent);

  // Initialize collaboration
  useEffect(() => {
    const initializeCollaboration = async () => {
      try {
        setIsLoading(true);
        await collaborativeEditingService.connect(userId, documentId);
        await collaborativeEditingService.joinSession(documentId, userId, userName, userRole);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCollaboration();

    return () => {
      collaborativeEditingService.leaveSession();
      collaborativeEditingService.disconnect();
    };
  }, [documentId, userId, userName, userRole]);

  // Set up event listeners
  useEffect(() => {
    const handleUserJoined = (data: { participant: SessionParticipant }) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.userId === data.participant.userId);
        if (existing) {
          return prev.map(p => p.userId === data.participant.userId ? data.participant : p);
        }
        return [...prev, data.participant];
      });
    };

    const handleUserLeft = (data: { participant: SessionParticipant }) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.participant.userId));
    };

    const handleCursorMoved = (data: { participant: SessionParticipant; cursor: any }) => {
      if (data.cursor) {
        cursorPositions.current.set(data.participant.userId, {
          line: data.cursor.line,
          column: data.cursor.column,
        });
        // Force re-render to show cursor positions
        setParticipants(prev => [...prev]);
      }
    };

    const handleOperationApplied = (data: { operation: EditOperation }) => {
      applyOperationToContent(data.operation);
    };

    const handleCommentAdded = (data: { comment: Comment }) => {
      setComments(prev => [...prev, data.comment]);
    };

    const handleCommentUpdated = (data: { comment: Comment }) => {
      setComments(prev => prev.map(c => c.id === data.comment.id ? data.comment : c));
    };

    const handleCommentDeleted = (data: { comment: Comment }) => {
      setComments(prev => prev.filter(c => c.id !== data.comment.id));
    };

    const handleAnnotationAdded = (data: { annotation: Annotation }) => {
      setAnnotations(prev => [...prev, data.annotation]);
    };

    const handleVersionCreated = (data: { version: DocumentVersion }) => {
      setVersions(prev => [data.version, ...prev]);
    };

    // Register event listeners
    collaborativeEditingService.on('user_joined', handleUserJoined);
    collaborativeEditingService.on('user_left', handleUserLeft);
    collaborativeEditingService.on('cursor_moved', handleCursorMoved);
    collaborativeEditingService.on('operation_applied', handleOperationApplied);
    collaborativeEditingService.on('comment_added', handleCommentAdded);
    collaborativeEditingService.on('comment_updated', handleCommentUpdated);
    collaborativeEditingService.on('comment_deleted', handleCommentDeleted);
    collaborativeEditingService.on('annotation_added', handleAnnotationAdded);
    collaborativeEditingService.on('version_created', handleVersionCreated);

    return () => {
      collaborativeEditingService.off('user_joined', handleUserJoined);
      collaborativeEditingService.off('user_left', handleUserLeft);
      collaborativeEditingService.off('cursor_moved', handleCursorMoved);
      collaborativeEditingService.off('operation_applied', handleOperationApplied);
      collaborativeEditingService.off('comment_added', handleCommentAdded);
      collaborativeEditingService.off('comment_updated', handleCommentUpdated);
      collaborativeEditingService.off('comment_deleted', handleCommentDeleted);
      collaborativeEditingService.off('annotation_added', handleAnnotationAdded);
      collaborativeEditingService.off('version_created', handleVersionCreated);
    };
  }, []);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (isLocked) return;

    const oldContent = content;
    setContent(newContent);
    setHasUnsavedChanges(newContent !== lastSavedContent.current);
    onContentChange(newContent);

    // Create and send edit operation
    if (isConnected && newContent !== oldContent) {
      const operation: EditOperation = {
        type: OperationType.REPLACE,
        position: 0,
        length: oldContent.length,
        content: newContent,
      };

      collaborativeEditingService.applyOperation(operation);
    }
  }, [content, isConnected, isLocked, onContentChange]);

  // Apply remote operations to content
  const applyOperationToContent = useCallback((operation: EditOperation) => {
    setContent(prevContent => {
      let newContent = prevContent;
      
      switch (operation.type) {
        case OperationType.INSERT:
          if (operation.content) {
            newContent = 
              prevContent.slice(0, operation.position) +
              operation.content +
              prevContent.slice(operation.position);
          }
          break;
        case OperationType.DELETE:
          if (operation.length) {
            newContent = 
              prevContent.slice(0, operation.position) +
              prevContent.slice(operation.position + operation.length);
          }
          break;
        case OperationType.REPLACE:
          if (operation.content && operation.length) {
            newContent = 
              prevContent.slice(0, operation.position) +
              operation.content +
              prevContent.slice(operation.position + operation.length);
          }
          break;
      }
      
      return newContent;
    });
  }, []);

  // Handle cursor position updates
  const handleCursorChange = useCallback(() => {
    if (!editorRef.current || !isConnected) return;

    const textarea = editorRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    collaborativeEditingService.updateCursor(line, column);
  }, [content, isConnected]);

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || !isConnected) return;

    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selectedText = content.substring(start, end);
      const textBeforeStart = content.substring(0, start);
      const textBeforeEnd = content.substring(0, end);
      
      const startLines = textBeforeStart.split('\n');
      const endLines = textBeforeEnd.split('\n');
      
      const startLine = startLines.length;
      const startColumn = startLines[startLines.length - 1].length + 1;
      const endLine = endLines.length;
      const endColumn = endLines[endLines.length - 1].length + 1;

      collaborativeEditingService.updateSelection(
        startLine, startColumn, endLine, endColumn, selectedText
      );
    }
  }, [content, isConnected]);

  // Save document
  const handleSave = async () => {
    try {
      await onSave(content);
      lastSavedContent.current = content;
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  // Create version
  const handleCreateVersion = async () => {
    try {
      const comment = prompt('Enter version comment (optional):');
      await collaborativeEditingService.createVersion(comment || undefined);
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    const commentContent = prompt('Enter your comment:');
    if (commentContent) {
      try {
        const context = content.substring(
          Math.max(0, cursorPosition - 50),
          Math.min(content.length, cursorPosition + 50)
        );
        await collaborativeEditingService.addComment(commentContent, line, column, context);
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Connecting to collaboration server...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Collaboration Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborative Editor
              {!isConnected && (
                <Badge variant="destructive">Disconnected</Badge>
              )}
              {isLocked && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Participants */}
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((participant) => (
                  <TooltipProvider key={participant.userId}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={participant.userAvatar} />
                          <AvatarFallback style={{ backgroundColor: participant.color }}>
                            {participant.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{participant.userName} ({participant.role})</p>
                        <p className="text-xs text-muted-foreground">
                          {participant.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {participants.length > 5 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{participants.length - 5}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Comments ({comments.length})
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!isConnected}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateVersion}
                  disabled={!isConnected}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="h-4 w-4" />
                  {hasUnsavedChanges && <span className="ml-1">*</span>}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleSelectionChange}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              disabled={isLocked || !isConnected}
              className="w-full h-96 p-4 border-0 resize-none focus:outline-none font-mono text-sm"
              placeholder="Start typing to collaborate..."
            />
            
            {/* Cursor indicators */}
            {participants.map((participant) => {
              const cursorPos = cursorPositions.current.get(participant.userId);
              if (!cursorPos || participant.userId === userId) return null;
              
              return (
                <div
                  key={participant.userId}
                  className="absolute pointer-events-none"
                  style={{
                    top: `${(cursorPos.line - 1) * 20 + 16}px`,
                    left: `${cursorPos.column * 8 + 16}px`,
                  }}
                >
                  <div
                    className="w-0.5 h-5 animate-pulse"
                    style={{ backgroundColor: participant.color }}
                  />
                  <div
                    className="absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded whitespace-nowrap"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.userName}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comments Panel */}
      {showComments && comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>
                      {comment.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{comment.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    Line {comment.position.line}
                  </span>
                  <Badge variant={comment.status === 'resolved' ? 'secondary' : 'default'}>
                    {comment.status}
                  </Badge>
                </div>
                <p className="text-sm">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Context: "{comment.position.context}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.slice(0, 5).map((version) => (
                <div key={version.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">Version {version.version}</p>
                    <p className="text-sm text-muted-foreground">
                      by {version.author} • {new Date(version.createdAt).toLocaleString()}
                    </p>
                    {version.comment && (
                      <p className="text-sm">{version.comment}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => collaborativeEditingService.revertToVersion(version.id)}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}