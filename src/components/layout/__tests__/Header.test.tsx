import React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, size, variant, ...props }: any) => (
    <button 
      data-testid="button" 
      className={className}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: (props: any) => (
    <button data-testid="sidebar-trigger" {...props}>
      Menu
    </button>
  ),
}))

describe('Header', () => {
  it('renders header element', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('sticky', 'top-0', 'z-40', 'w-full', 'border-b')
  })

  it('renders sidebar trigger', () => {
    render(<Header />)
    
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
  })

  it('renders search input on desktop', () => {
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText('Search...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput.parentElement?.parentElement).toHaveClass('hidden', 'md:flex')
  })

  it('renders action buttons', () => {
    render(<Header />)
    
    const buttons = screen.getAllByTestId('button')
    expect(buttons).toHaveLength(3) // Search (mobile), Notifications, User menu
  })

  it('has proper responsive classes', () => {
    render(<Header />)
    
    const headerContent = screen.getByRole('banner').firstChild
    expect(headerContent).toHaveClass('flex', 'h-14', 'items-center', 'px-4', 'sm:px-6')
  })

  it('renders search icon in mobile search button', () => {
    render(<Header />)
    
    const mobileSearchButton = screen.getAllByTestId('button')[0]
    expect(mobileSearchButton).toHaveClass('md:hidden')
  })

  it('has proper backdrop blur styling', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-background/95', 'backdrop-blur')
  })
})