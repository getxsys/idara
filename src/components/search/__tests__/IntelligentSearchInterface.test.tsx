import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntelligentSearchInterface } from '../IntelligentSearchInterface';
import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  AccessLevel,
  QueryContext
} from '@/types/rag';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('IntelligentSearchInterface', () => {
  const mockOnSearch = jest.fn();
  const mockContext: QueryContext = {
    currentProject: 'project-123',
    currentClient: 'client-456',
    userRole: 'manager',
    workspaceId: 'workspace-789',
    sessionId: 'session-abc'
  };

  const mockSearchResponse: RAGResponse = {
    answer: 'Based on the available documents, the business strategy focuses on growth and innovation.',
    sources: [
      {
        documentId: 'doc_1',
        title: 'Business Strategy 2024',
        chunkId: 'chunk_1',
        content: 'Our business strategy focuses on growth and innovation in emerging markets.',
        relevanceScore: 0.95,
        metadata: {
          fileName: 'strategy-2024.pdf',
          fileType: 'pdf',
          fileSize: 1024000,
          author: 'John Doe',
          createdDate: new Date('2024-01-15'),
          modifiedDate: new Date('2024-01-20'),
          language: 'en',
          category: 'strategy',
          summary: 'Business strategy document for 2024',
          keywords: ['strategy', 'growth', 'innovation']
        },
        citation: 'Business Strategy 2024 by John Doe (1/15/2024)'
      },
      {
        documentId: 'doc_2',
        title: 'Market Analysis Report',
        chunkId: 'chunk_2',
        content: 'Market analysis shows strong growth potential in emerging markets.',
        relevanceScore: 0.87,
        metadata: {
          fileName: 'market-analysis.pdf',
          fileType: 'pdf',
          fileSize: 2048000,
          author: 'Jane Smith',
          createdDate: new Date('2024-02-01'),
          modifiedDate: new Date('2024-02-05'),
          language: 'en',
          category: 'analysis',
          summary: 'Market analysis for Q1 2024',
          keywords: ['market', 'analysis', 'growth']
        },
        citation: 'Market Analysis Report by Jane Smith (2/1/2024)'
      }
    ],
    confidence: 0.91,
    suggestions: ['business growth strategies', 'market expansion plans', 'innovation roadmap'],
    processingTime: 1250,
    queryId: 'query_123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Basic Functionality', () => {
    it('should render search input and button', () => {
      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      expect(screen.getByPlaceholderText('Ask me anything about your documents...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Filters/ })).toBeInTheDocument();
    });

    it('should enable search button when query is entered', async () => {
      const user = userEvent.setup();
      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      const searchButton = screen.getByRole('button', { name: 'Search' });

      expect(searchButton).toBeDisabled();

      await user.type(searchInput, 'business strategy');

      expect(searchButton).toBeEnabled();
    });

    it('should call onSearch when search button is clicked', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} context={mockContext} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      const searchButton = screen.getByRole('button', { name: 'Search' });

      await user.type(searchInput, 'business strategy');
      await user.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        query: 'business strategy',
        context: mockContext,
        filters: {},
        userId: 'session-abc',
        maxResults: 10,
        similarityThreshold: 0.7
      });
    });

    it('should call onSearch when Enter key is pressed', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');

      await user.type(searchInput, 'business strategy');
      await user.keyboard('{Enter}');

      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  describe('Search Results Display', () => {
    it('should display search results after successful search', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('AI-Generated Answer')).toBeInTheDocument();
        expect(screen.getByText(mockSearchResponse.answer)).toBeInTheDocument();
        expect(screen.getByText('Source Documents')).toBeInTheDocument();
        expect(screen.getByText('Business Strategy 2024')).toBeInTheDocument();
        expect(screen.getByText('Market Analysis Report')).toBeInTheDocument();
      });
    });

    it('should display confidence score with correct styling', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('High (91%)')).toBeInTheDocument();
      });
    });

    it('should display processing time and source count', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('Found 2 relevant sources in 1250ms')).toBeInTheDocument();
      });
    });

    it('should expand and collapse source content', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('Business Strategy 2024')).toBeInTheDocument();
      });

      // Content should not be visible initially
      expect(screen.queryByText('Our business strategy focuses on growth and innovation in emerging markets.')).not.toBeInTheDocument();

      // Click to expand
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(button => button.querySelector('svg'));
      if (expandButton) {
        await user.click(expandButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Our business strategy focuses on growth and innovation in emerging markets.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Suggestions', () => {
    it('should display search suggestions after search', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('Suggested searches:')).toBeInTheDocument();
        expect(screen.getByText('business growth strategies')).toBeInTheDocument();
        expect(screen.getByText('market expansion plans')).toBeInTheDocument();
        expect(screen.getByText('innovation roadmap')).toBeInTheDocument();
      });
    });

    it('should perform search when suggestion is clicked', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('business growth strategies')).toBeInTheDocument();
      });

      // Click on suggestion
      await user.click(screen.getByText('business growth strategies'));

      expect(mockOnSearch).toHaveBeenCalledTimes(2);
      expect(mockOnSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          query: 'business growth strategies'
        })
      );
    });

    it('should display related suggestions in results', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(screen.getByText('Related Searches')).toBeInTheDocument();
      });
    });
  });

  describe('Search History', () => {
    it('should load search history from localStorage', () => {
      const mockHistory = ['previous search', 'another search'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('search-history');
    });

    it('should display recent searches when input is empty', () => {
      const mockHistory = ['business strategy', 'market analysis'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      expect(screen.getByText('Recent searches:')).toBeInTheDocument();
      expect(screen.getByText('business strategy')).toBeInTheDocument();
      expect(screen.getByText('market analysis')).toBeInTheDocument();
    });

    it('should save search to history after successful search', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'search-history',
          JSON.stringify(['business strategy'])
        );
      });
    });

    it('should perform search when history item is clicked', async () => {
      const user = userEvent.setup();
      const mockHistory = ['business strategy'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      await user.click(screen.getByText('business strategy'));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'business strategy'
        })
      );
    });
  });

  describe('Advanced Filters', () => {
    it('should toggle filters panel', async () => {
      const user = userEvent.setup();
      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const filtersButton = screen.getByRole('button', { name: /Filters/ });
      
      // Filters should not be visible initially
      expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();

      await user.click(filtersButton);

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    });

    it('should apply document type filters', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      // Open filters
      await user.click(screen.getByRole('button', { name: /Filters/ }));

      // Select PDF filter
      const pdfCheckbox = screen.getByLabelText('pdf');
      await user.click(pdfCheckbox);

      // Perform search
      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'test query');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {
            documentTypes: ['pdf']
          }
        })
      );
    });

    it('should apply category filters', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      // Open filters
      await user.click(screen.getByRole('button', { name: /Filters/ }));

      // Select category
      const categorySelect = screen.getByRole('combobox');
      await user.click(categorySelect);
      await user.click(screen.getByText('Strategy'));

      // Perform search
      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'test query');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {
            categories: ['strategy']
          }
        })
      );
    });

    it('should clear all filters', async () => {
      const user = userEvent.setup();
      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      // Open filters
      await user.click(screen.getByRole('button', { name: /Filters/ }));

      // Apply some filters
      const pdfCheckbox = screen.getByLabelText('pdf');
      await user.click(pdfCheckbox);

      // Clear filters
      await user.click(screen.getByRole('button', { name: 'Clear All' }));

      // Perform search
      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'test query');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {}
        })
      );
    });

    it('should apply date range filters', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      // Open filters
      await user.click(screen.getByRole('button', { name: /Filters/ }));

      // Set date range
      const fromDate = screen.getByLabelText('From');
      const toDate = screen.getByLabelText('To');

      await user.type(fromDate, '2024-01-01');
      await user.type(toDate, '2024-12-31');

      // Perform search
      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'test query');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {
            dateRange: {
              start: new Date('2024-01-01'),
              end: new Date('2024-12-31')
            }
          }
        })
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading state during search', async () => {
      const user = userEvent.setup();
      let resolveSearch: (value: RAGResponse) => void;
      const searchPromise = new Promise<RAGResponse>((resolve) => {
        resolveSearch = resolve;
      });
      mockOnSearch.mockReturnValue(searchPromise);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(screen.getByText('Searching...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();

      // Resolve the search
      resolveSearch!(mockSearchResponse);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
      });
    });

    it('should disable input during search', async () => {
      const user = userEvent.setup();
      let resolveSearch: (value: RAGResponse) => void;
      const searchPromise = new Promise<RAGResponse>((resolve) => {
        resolveSearch = resolve;
      });
      mockOnSearch.mockReturnValue(searchPromise);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(searchInput).toBeDisabled();

      // Resolve the search
      resolveSearch!(mockSearchResponse);

      await waitFor(() => {
        expect(searchInput).toBeEnabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSearch.mockRejectedValue(new Error('Search failed'));

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Search failed:', expect.any(Error));
        expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Context Integration', () => {
    it('should use provided context in search queries', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} context={mockContext} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          context: mockContext,
          userId: 'session-abc'
        })
      );
    });

    it('should use anonymous user when no context provided', async () => {
      const user = userEvent.setup();
      mockOnSearch.mockResolvedValue(mockSearchResponse);

      render(<IntelligentSearchInterface onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText('Ask me anything about your documents...');
      await user.type(searchInput, 'business strategy');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'anonymous'
        })
      );
    });
  });
});