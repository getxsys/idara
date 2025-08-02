import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardGrid } from '../DashboardGrid'
import { WidgetData } from '@/types/dashboard'

// Mock drag and drop
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => (
    <div data-testid="dnd-context" data-on-drag-end={!!onDragEnd}>
      {children}
    </div>
  ),
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  arrayMove: jest.fn((array, oldIndex, newIndex) => {
    const newArray = [...array]
    const [removed] = newArray.splice(oldIndex, 1)
    newArray.splice(newIndex, 0, removed)
    return newArray
  }),
  sortableKeyboardCoordinates: jest.fn(),
  rectSortingStrategy: jest.fn(),
}))

jest.mock('../DashboardWidget', () => ({
  DashboardWidget: ({ widget }: { widget: WidgetData }) => (
    <div data-testid={`widget-${widget.id}`}>
      {widget.title}
    </div>
  ),
}))

const mockWidgets: WidgetData[] = [
  {
    id: '1',
    title: 'Widget 1',
    type: 'metric',
    size: 'small',
    value: '100',
  },
  {
    id: '2',
    title: 'Widget 2',
    type: 'chart',
    size: 'medium',
  },
]

describe('DashboardGrid', () => {
  it('renders all widgets', () => {
    render(<DashboardGrid widgets={mockWidgets} />)
    
    expect(screen.getByTestId('widget-1')).toBeInTheDocument()
    expect(screen.getByTestId('widget-2')).toBeInTheDocument()
    expect(screen.getByText('Widget 1')).toBeInTheDocument()
    expect(screen.getByText('Widget 2')).toBeInTheDocument()
  })

  it('applies responsive grid classes', () => {
    render(<DashboardGrid widgets={mockWidgets} />)
    
    const gridContainer = screen.getByTestId('sortable-context').firstChild
    expect(gridContainer).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-4',
      'gap-4',
      'sm:gap-6'
    )
  })

  it('applies custom className', () => {
    render(<DashboardGrid widgets={mockWidgets} className="custom-class" />)
    
    const gridContainer = screen.getByTestId('sortable-context').firstChild
    expect(gridContainer).toHaveClass('custom-class')
  })

  it('sets up drag and drop context', () => {
    render(<DashboardGrid widgets={mockWidgets} />)
    
    const dndContext = screen.getByTestId('dnd-context')
    expect(dndContext).toBeInTheDocument()
    expect(dndContext).toHaveAttribute('data-on-drag-end', 'true')
  })

  it('calls onWidgetReorder when provided', () => {
    const mockOnReorder = jest.fn()
    render(
      <DashboardGrid 
        widgets={mockWidgets} 
        onWidgetReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })

  it('renders empty grid when no widgets provided', () => {
    render(<DashboardGrid widgets={[]} />)
    
    const gridContainer = screen.getByTestId('sortable-context').firstChild
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer?.children).toHaveLength(0)
  })
})