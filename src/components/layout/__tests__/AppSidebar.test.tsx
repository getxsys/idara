import React from 'react'
import { render, screen } from '@testing-library/react'
import { AppSidebar } from '../AppSidebar'

// Mock the sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="sidebar" role="navigation">{children}</nav>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-group-label">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarMenu: ({ children }: { children: React.ReactNode }) => (
    <ul data-testid="sidebar-menu">{children}</ul>
  ),
  SidebarMenuButton: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <button data-testid="sidebar-menu-button">{children}</button>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <li data-testid="sidebar-menu-item">{children}</li>
  ),
}))

describe('AppSidebar', () => {
  it('renders sidebar navigation', () => {
    render(<AppSidebar />)
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('displays app branding', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('Idara Business')).toBeInTheDocument()
  })

  it('renders navigation items', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders tools section', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('has proper navigation links', () => {
    render(<AppSidebar />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    
    const projectsLink = screen.getByRole('link', { name: /projects/i })
    expect(projectsLink).toHaveAttribute('href', '/dashboard/projects')
  })

  it('displays footer text', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('Modern Business Dashboard')).toBeInTheDocument()
  })

  it('has proper section labels', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Tools')).toBeInTheDocument()
  })
})