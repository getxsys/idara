import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryInput } from '../QueryInput'
import { QuerySuggestion } from '@/types/nlq'

const mockSuggestions: QuerySuggestion[] = [
  {
    text: 'What is our revenue this month?',
    category: 'metrics',
    confidence: 0.9
  },
  {
    text: 'Show me sales trends',
    category: 'trends',
    confidence: 0.8
  },
  {
    text: 'Compare performance vs last quarter',
    category: 'comparisons',
    confidence: 0.85
  }
]

const mockRecentQueries = [
  'What was our revenue last month?',
  'How many customers do we have?',
  'Show me conversion rates'
]

describe('QueryInput', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with placeholder text', () => {
    render(<QueryInput onSubmit={mockOnSubmit} />)
    
    expect(screen.getByPlaceholderText('Ask anything about your business data...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder text'
    render(<QueryInput onSubmit={mockOnSubmit} placeholder={customPlaceholder} />)
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
  })

  it('submits query on form submission', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(input, 'What is our revenue?')
    await user.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('What is our revenue?')
  })

  it('submits query on Enter key press', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'What is our revenue?')
    await user.keyboard('{Enter}')
    
    expect(mockOnSubmit).toHaveBeenCalledWith('What is our revenue?')
  })

  it('clears input after submission', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    
    await user.type(input, 'What is our revenue?')
    await user.keyboard('{Enter}')
    
    expect(input.value).toBe('')
  })

  it('does not submit empty queries', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    await user.click(submitButton)
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('does not submit when loading', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} isLoading={true} />)
    
    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(input, 'What is our revenue?')
    await user.click(submitButton)
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows loading spinner when loading', () => {
    render(<QueryInput onSubmit={mockOnSubmit} isLoading={true} />)
    
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows suggestions on focus', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument()
      expect(screen.getByText('What is our revenue this month?')).toBeInTheDocument()
    })
  })

  it('filters suggestions based on input', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'revenue')
    
    await waitFor(() => {
      expect(screen.getByText('What is our revenue this month?')).toBeInTheDocument()
      expect(screen.queryByText('Show me sales trends')).not.toBeInTheDocument()
    })
  })

  it('handles suggestion click', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('What is our revenue this month?')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('What is our revenue this month?'))
    
    expect(mockOnSubmit).toHaveBeenCalledWith('What is our revenue this month?')
  })

  it('shows recent queries', async () => {
    const user = userEvent.setup()
    render(
      <QueryInput 
        onSubmit={mockOnSubmit} 
        suggestions={mockSuggestions}
        recentQueries={mockRecentQueries}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Queries')).toBeInTheDocument()
      expect(screen.getByText('What was our revenue last month?')).toBeInTheDocument()
    })
  })

  it('handles recent query click', async () => {
    const user = userEvent.setup()
    render(
      <QueryInput 
        onSubmit={mockOnSubmit} 
        suggestions={mockSuggestions}
        recentQueries={mockRecentQueries}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('What was our revenue last month?')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('What was our revenue last month?'))
    
    expect(mockOnSubmit).toHaveBeenCalledWith('What was our revenue last month?')
  })

  it('navigates suggestions with keyboard', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('What is our revenue this month?')).toBeInTheDocument()
    })
    
    // Navigate down
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    
    // Select with Enter
    await user.keyboard('{Enter}')
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Show me sales trends')
  })

  it('closes suggestions on Escape', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument()
    })
    
    await user.keyboard('{Escape}')
    
    await waitFor(() => {
      expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument()
    })
  })

  it('displays confidence scores for suggestions', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('90%')).toBeInTheDocument() // 0.9 * 100
      expect(screen.getByText('80%')).toBeInTheDocument() // 0.8 * 100
    })
  })

  it('shows category icons for suggestions', async () => {
    const user = userEvent.setup()
    render(<QueryInput onSubmit={mockOnSubmit} suggestions={mockSuggestions} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    await waitFor(() => {
      // Check that suggestions are rendered (icons are rendered as SVG elements)
      const suggestionElements = screen.getAllByRole('button')
      expect(suggestionElements.length).toBeGreaterThan(1) // Input submit button + suggestion buttons
    })
  })
})