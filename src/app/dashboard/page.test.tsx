import { render, screen } from '@testing-library/react'
import Dashboard from './page'

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />)
    expect(screen.getByText('Business Dashboard')).toBeInTheDocument()
  })

  it('renders welcome message', () => {
    render(<Dashboard />)
    expect(screen.getByText('Welcome to Idara')).toBeInTheDocument()
  })

  it('renders analytics card', () => {
    render(<Dashboard />)
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders reports card', () => {
    render(<Dashboard />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })
})
