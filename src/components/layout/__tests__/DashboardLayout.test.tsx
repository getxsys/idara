import React from 'react'
import { render, screen } from '@testing-library/react'
import { DashboardLayout } from '../DashboardLayout'

// Mock the sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
}))

jest.mock('../AppSidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}))

jest.mock('../Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

describe('DashboardLayout', () => {
  it('renders children content', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-content">Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('renders sidebar provider', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
  })

  it('renders app sidebar', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
  })

  it('renders header', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('has proper responsive layout structure', () => {
    render(
      <DashboardLayout>
        <div data-testid="content">Content</div>
      </DashboardLayout>
    )

    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveClass('flex-1', 'p-4', 'sm:p-6', 'lg:p-8')
  })

  it('constrains content width with max-width', () => {
    render(
      <DashboardLayout>
        <div data-testid="content">Content</div>
      </DashboardLayout>
    )

    const contentContainer = screen.getByTestId('content').parentElement
    expect(contentContainer).toHaveClass('max-w-7xl', 'mx-auto', 'w-full')
  })
})