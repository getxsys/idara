import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResponsiveDashboard } from '../ResponsiveDashboard'

// Mock components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
}))

jest.mock('../DashboardGrid', () => ({
  DashboardGrid: ({ widgets, onWidgetReorder, className }: any) => (
    <div 
      data-testid="dashboard-grid" 
      className={className}
      data-widget-count={widgets.length}
    >
      Dashboard Grid
    </div>
  ),
}))

describe('ResponsiveDashboard', () => {
  it('renders with default title and subtitle', () => {
    render(<ResponsiveDashboard />)
    
    expect(screen.getByText('Business Dashboard')).toBeInTheDocument()
    expect(screen.getByText("Welcome back! Here's what's happening with your business today.")).toBeInTheDocument()
  })

  it('renders with custom title and subtitle', () => {
    render(
      <ResponsiveDashboard 
        title="Custom Dashboard" 
        subtitle="Custom subtitle" 
      />
    )
    
    expect(screen.getByText('Custom Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument()
  })

  it('renders customize and add widget buttons', () => {
    render(<ResponsiveDashboard />)
    
    expect(screen.getByText('Customize')).toBeInTheDocument()
    expect(screen.getByText('Add Widget')).toBeInTheDocument()
  })

  it('toggles customization mode', () => {
    render(<ResponsiveDashboard />)
    
    const customizeButton = screen.getByText('Customize')
    
    // Initially no customization notice
    expect(screen.queryByText('Drag and drop widgets to customize your dashboard layout')).not.toBeInTheDocument()
    
    // Click customize button
    fireEvent.click(customizeButton)
    
    // Should show customization notice
    expect(screen.getByText('Drag and drop widgets to customize your dashboard layout')).toBeInTheDocument()
    
    // Click again to toggle off
    fireEvent.click(customizeButton)
    
    // Should hide customization notice
    expect(screen.queryByText('Drag and drop widgets to customize your dashboard layout')).not.toBeInTheDocument()
  })

  it('renders dashboard grid', () => {
    render(<ResponsiveDashboard />)
    
    const dashboardGrid = screen.getByTestId('dashboard-grid')
    expect(dashboardGrid).toBeInTheDocument()
    expect(dashboardGrid).toHaveAttribute('data-widget-count', '6') // Default widgets
  })

  it('applies customization styling to grid when customizing', () => {
    render(<ResponsiveDashboard />)
    
    const customizeButton = screen.getByText('Customize')
    const dashboardGrid = screen.getByTestId('dashboard-grid')
    
    // Initially no customization styling
    expect(dashboardGrid).not.toHaveClass('ring-2', 'ring-primary/20', 'rounded-lg', 'p-4')
    
    // Enable customization
    fireEvent.click(customizeButton)
    
    // Should have customization styling
    expect(dashboardGrid).toHaveClass('ring-2', 'ring-primary/20', 'rounded-lg', 'p-4')
  })

  it('renders mobile quick actions', () => {
    render(<ResponsiveDashboard />)
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('New Project')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('has proper responsive header layout', () => {
    render(<ResponsiveDashboard />)
    
    const headerContainer = screen.getByText('Business Dashboard').parentElement?.parentElement
    expect(headerContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between', 'gap-4')
  })

  it('has proper mobile-specific quick actions styling', () => {
    render(<ResponsiveDashboard />)
    
    const quickActionsContainer = screen.getByText('Quick Actions').parentElement?.parentElement?.parentElement
    expect(quickActionsContainer).toHaveClass('block', 'sm:hidden')
  })
})