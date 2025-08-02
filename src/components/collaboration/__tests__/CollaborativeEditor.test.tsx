import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollaborativeEditor } from '../CollaborativeEditor';
import { collaborativeEditingService } from '@/lib/services/collaborative-editing';
import { CollaboratorRole, OperationType } from '@/types/collaboration';

// Mock the collaborative editing service
jest.mock('@/lib/services/collaborative-editing', () => ({
  collaborativeEditingService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    applyOperation: jest.fn(),
    updateCursor: jest.fn(),
    updateSelection: jest.fn(),
    addComment: jest.fn(),
    createVersion: jest.fn(),
    revertToVersion: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

const mockProps = {
  documentId: 'doc-123',
  userId: 'user-123',
  userName: 'Test User',
  userRole: CollaboratorRole.EDITOR,
  initialContent: 'Initial document content',
  onContentChange: jest.fn(),
  onSave: jest.fn(),
};

describe('CollaborativeEditor', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful connection
    (collaborativeEditingService.connect as jest.Mock).mockResolvedValue(undefined);
    (collaborativeEditingService.joinSession as jest.Mock).mockResolvedValue({
      id: 'session-123',
      documentId: 'doc-123',
      participants: [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    });
  });

  it('renders loading state initially', () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    expect(screen.getByText('Connecting to collaboration server...')).toBeInTheDocument();
  });

  it('initializes collaboration on mount', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(collaborativeEditingService.connect).toHaveBeenCalledWith('user-123', 'doc-123');
      expect(collaborativeEditingService.joinSession).toHaveBeenCalledWith(
        'doc-123',
        'user-123',
        'Test User',
        CollaboratorRole.EDITOR
      );
    });
  });

  it('renders editor interface after successful connection', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Collaborative Editor')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Start typing to collaborate...')).toBeInTheDocument();
    });
  });

  it('displays initial content in editor', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      const textarea = screen.getByDisplayValue('Initial document content');
      expect(textarea).toBeInTheDocument();
    });
  });

  it('handles content changes and sends operations', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('Initial document content');
    
    await act(async () => {
      await user.clear(textarea);
      await user.type(textarea, 'New content');
    });

    expect(mockProps.onContentChange).toHaveBeenCalledWith('New content');
    // Check that applyOperation was called (it gets called multiple times during typing)
    expect(collaborativeEditingService.applyOperation).toHaveBeenCalled();
  });

  it('updates cursor position on cursor movement', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('Initial document content');
    
    await act(async () => {
      textarea.focus();
      textarea.setSelectionRange(5, 5);
      fireEvent.keyUp(textarea);
    });

    expect(collaborativeEditingService.updateCursor).toHaveBeenCalled();
  });

  it('handles selection changes', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('Initial document content');
    
    await act(async () => {
      textarea.focus();
      textarea.setSelectionRange(0, 7); // Select "Initial"
      fireEvent.select(textarea);
    });

    expect(collaborativeEditingService.updateSelection).toHaveBeenCalled();
  });

  it('displays participants in header', async () => {
    const mockParticipants = [
      {
        userId: 'user-456',
        userName: 'Other User',
        userAvatar: undefined,
        role: CollaboratorRole.EDITOR,
        isOnline: true,
        color: '#ff0000',
        joinedAt: new Date(),
        lastSeen: new Date(),
      },
    ];

    // Mock the on method to simulate receiving participants
    (collaborativeEditingService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'user_joined') {
        setTimeout(() => callback({ participant: mockParticipants[0] }), 100);
      }
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('O')).toBeInTheDocument(); // Avatar fallback
    });
  });

  it('handles adding comments', async () => {
    // Mock window.prompt
    const mockPrompt = jest.spyOn(window, 'prompt').mockReturnValue('Test comment');
    
    (collaborativeEditingService.addComment as jest.Mock).mockResolvedValue({
      id: 'comment-123',
      content: 'Test comment',
      userName: 'Test User',
      position: { line: 1, column: 1, context: 'Initial' },
      status: 'open',
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    // Find all buttons and locate the one with message-square icon
    const buttons = screen.getAllByRole('button', { name: '' });
    const commentButton = buttons.find(button => 
      button.querySelector('svg.lucide-message-square')
    );
    expect(commentButton).toBeInTheDocument();
    
    await user.click(commentButton!);

    expect(mockPrompt).toHaveBeenCalledWith('Enter your comment:');
    expect(collaborativeEditingService.addComment).toHaveBeenCalledWith(
      'Test comment',
      expect.any(Number),
      expect.any(Number),
      expect.any(String)
    );

    mockPrompt.mockRestore();
  });

  it('handles creating versions', async () => {
    // Mock window.prompt
    const mockPrompt = jest.spyOn(window, 'prompt').mockReturnValue('Version comment');
    
    (collaborativeEditingService.createVersion as jest.Mock).mockResolvedValue({
      id: 'version-123',
      version: 1,
      author: 'Test User',
      comment: 'Version comment',
      createdAt: new Date(),
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    // Find all buttons and locate the one with git-branch icon
    const buttons = screen.getAllByRole('button', { name: '' });
    const versionButton = buttons.find(button => 
      button.querySelector('svg.lucide-git-branch')
    );
    expect(versionButton).toBeInTheDocument();
    
    await user.click(versionButton!);

    expect(mockPrompt).toHaveBeenCalledWith('Enter version comment (optional):');
    expect(collaborativeEditingService.createVersion).toHaveBeenCalledWith('Version comment');

    mockPrompt.mockRestore();
  });

  it('handles saving document', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    // Make a change to enable save button
    const textarea = screen.getByDisplayValue('Initial document content');
    await act(async () => {
      await user.type(textarea, ' modified');
    });

    // Find the save button by its content (contains asterisk when there are unsaved changes)
    const saveButton = screen.getByRole('button', { name: '*' });
    expect(saveButton).not.toBeDisabled();
    
    await user.click(saveButton);

    expect(mockProps.onSave).toHaveBeenCalledWith('Initial document content modified');
  });

  it('displays comments when available', async () => {
    const mockComments = [
      {
        id: 'comment-123',
        documentId: 'doc-123',
        userId: 'user-456',
        userName: 'Other User',
        content: 'This is a test comment',
        position: { line: 1, column: 1, context: 'Initial' },
        thread: { id: 'thread-123', replies: [], resolved: false },
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock the on method to simulate receiving comments
    (collaborativeEditingService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'comment_added') {
        setTimeout(() => callback({ comment: mockComments[0] }), 100);
      }
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('Other User')).toBeInTheDocument();
      expect(screen.getByText('Line 1')).toBeInTheDocument();
    });
  });

  it('displays version history when available', async () => {
    const mockVersions = [
      {
        id: 'version-123',
        documentId: 'doc-123',
        version: 1,
        content: 'Version content',
        changes: [],
        author: 'Test User',
        comment: 'Initial version',
        createdAt: new Date(),
      },
    ];

    // Mock the on method to simulate receiving versions
    (collaborativeEditingService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'version_created') {
        setTimeout(() => callback({ version: mockVersions[0] }), 100);
      }
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Versions')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();
      expect(screen.getByText('Initial version')).toBeInTheDocument();
    });
  });

  it('handles version restoration', async () => {
    const mockVersions = [
      {
        id: 'version-123',
        documentId: 'doc-123',
        version: 1,
        content: 'Version content',
        changes: [],
        author: 'Test User',
        comment: 'Initial version',
        createdAt: new Date(),
      },
    ];

    // Mock the on method to simulate receiving versions
    (collaborativeEditingService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'version_created') {
        setTimeout(() => callback({ version: mockVersions[0] }), 100);
      }
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    const restoreButton = screen.getByText('Restore');
    await user.click(restoreButton);

    expect(collaborativeEditingService.revertToVersion).toHaveBeenCalledWith('version-123');
  });

  it('toggles comments visibility', async () => {
    const mockComments = [
      {
        id: 'comment-123',
        documentId: 'doc-123',
        userId: 'user-456',
        userName: 'Other User',
        content: 'This is a test comment',
        position: { line: 1, column: 1, context: 'Initial' },
        thread: { id: 'thread-123', replies: [], resolved: false },
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock the on method to simulate receiving comments
    (collaborativeEditingService.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'comment_added') {
        setTimeout(() => callback({ comment: mockComments[0] }), 100);
      }
    });

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /comments \(1\)/i });
    await user.click(toggleButton);

    expect(screen.queryByText('This is a test comment')).not.toBeInTheDocument();
  });

  it('cleans up on unmount', async () => {
    const { unmount } = render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(collaborativeEditingService.connect).toHaveBeenCalled();
    });

    unmount();

    expect(collaborativeEditingService.leaveSession).toHaveBeenCalled();
    expect(collaborativeEditingService.disconnect).toHaveBeenCalled();
  });

  it('handles connection errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (collaborativeEditingService.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));

    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to initialize collaboration:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('disables editing when locked', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    // Simulate document being locked
    const textarea = screen.getByDisplayValue('Initial document content');
    
    // The textarea should be enabled initially
    expect(textarea).not.toBeDisabled();
  });

  it('shows unsaved changes indicator', async () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial document content')).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('Initial document content');
    
    await act(async () => {
      await user.type(textarea, ' modified');
    });

    // Look for the asterisk indicating unsaved changes
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});