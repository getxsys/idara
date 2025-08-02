import React from 'react'
import { render, screen } from '@testing-library/react'
import { DashboardWidget } from '../DashboardWidget'
import { WidgetData } from '@/types/dashboard'

// Mock drag and drop
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>{children}</button>
  ),
}))

describe('DashboardWidget', () => {
  const mockMetricWidget: WidgetData = {
    id: '1',
    title: 'Revenue',
    type: 'metric',
    size: 'small',
    value: '$10,000',
    description: 'This month',
    change: 15.5,
  }

  const mockChartWidget: WidgetData = {
    id: '2',
    title: 'Sales Chart',
    type: 'chart',
    size: 'medium',
    description: 'Last 6 months',
  }

  const mockListWidget: WidgetData = {
    id: '3',
    title: 'Recent Activities',
    type: 'list',
    size: 'small',
    items: ['Task 1', 'Task 2', 'Task 3', 'Task 4'],
  }

  it('renders widget title', () => {
    render(<DashboardWidget widget={mockMetricWidget} />)
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Revenue')
  })

  it('renders metric widget correctly', () => {
    render(<DashboardWidget widget={mockMetricWidget} />)
    
    expect(screen.getByText('$10,000')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('+15.5%')).toBeInTheDocument()
  })

  it('renders chart widget placeholder', () => {
    render(<DashboardWidget widget={mockChartWidget} />)
    
    expect(screen.getByText('Chart placeholder')).toBeInTheDocument()
  })

  it('renders list widget with items', () => {
    render(<DashboardWidget widget={mockListWidget} />)
    
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
    // Should only show first 3 items
    expect(screen.queryByText('Task 4')).not.toBeInTheDocument()
  })

  it('shows negative change in red', () => {
    const negativeWidget = { ...mockMetricWidget, change: -5.2 }
    render(<DashboardWidget widget={negativeWidget} />)
    
    const changeElement = screen.getByText('-5.2%')
    expect(changeElement).toHaveClass('text-red-600')
  })

  it('shows positive change in green', () => {
    render(<DashboardWidget widget={mockMetricWidget} />)
    
    const changeElement = screen.getByText('+15.5%')
    expect(changeElement).toHaveClass('text-green-600')
  })

  it('renders drag handle and options buttons', () => {
    render(<DashboardWidget widget={mockMetricWidget} />)
    
    const buttons = screen.getAllByTestId('button')
    expect(buttons).toHaveLength(2) // Drag handle and options
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<DashboardWidget widget={mockMetricWidget} />)
    
    // Test different sizes by checking the container
    const smallWidget = { ...mockMetricWidget, size: 'small' as const }
    const mediumWidget = { ...mockMetricWidget, size: 'medium' as const }
    const largeWidget = { ...mockMetricWidget, size: 'large' as const }
    const wideWidget = { ...mockMetricWidget, size: 'wide' as const }

    rerender(<DashboardWidget widget={smallWidget} />)
    expect(screen.getByTestId('card').parentElement).toHaveClass('col-span-1', 'row-span-1')

    rerender(<DashboardWidget widget={mediumWidget} />)
    expect(screen.getByTestId('card').parentElement).toHaveClass('col-span-1', 'sm:col-span-2', 'row-span-1')

    rerender(<DashboardWidget widget={largeWidget} />)
    expect(screen.getByTestId('card').parentElement).toHaveClass('col-span-1', 'sm:col-span-2', 'lg:col-span-3', 'row-span-2')

    rerender(<DashboardWidget widget={wideWidget} />)
    expect(screen.getByTestId('card').parentElement).toHaveClass('col-span-1', 'sm:col-span-2', 'lg:col-span-4', 'row-span-1')
  })
})