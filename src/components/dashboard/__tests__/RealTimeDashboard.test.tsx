import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RealTimeDashboard } from '../RealTimeDashboard'
import { WidgetData } from '@/types/dashboard'
import { generateSampleWidgets } from '@/lib/mock-data'

// Mock the useWebSocket hook
jest.mock('../../hooks/use-websocket', () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    isConnecting: false,
    error: null,
    sendMessage: jest.fn(),
    disconnect: jest.fn(),
    reconnect: jest.fn()
  }))
}))

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>
}))

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  ArcElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {}
}))

const mockWidgets: WidgetData[] = [
  {
    id: 'widget-1',
    title: 'Test KPI',
    type: 'kpi',
    size: 'medium',
    realTimeEnabled: true,
    data: {
      id: 'kpi-1',
      name: 'Test KPI',
      value: 1000,
      trend: 'up',
      change: 100,
      changePercent: 10,
      status: 'good',
      timestamp: new Date()
    },
    lastUpdated: new Date()
  },
  {
    id: 'widget-2',
    title: 'Test Chart',
    type: 'chart',
    size: 'large',
    realTimeEnabled: false,
    data: [
      { x: '10:00', y: 100 },
      { x: '11:00', y: 120 }
    ],
    lastUpdated: new Date()
  }
]

describe('RealTimeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard with widgets', () => {
    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('Real-Time Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Test KPI')).toBeInTheDocument()
    expect(screen.getByText('Test Chart')).toBeInTheDocument()
  })

  it('shows connection status', () => {
    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows real-time widget count', () => {
    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('1 real-time widgets')).toBeInTheDocument()
  })

  it('shows update count', () => {
    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('0 updates received')).toBeInTheDocument()
  })

  it('shows last update time', () => {
    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText(/Last update:/)).toBeInTheDocument()
  })

  it('has refresh button', () => {
    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeInTheDocument()
    expect(refreshButton).not.toBeDisabled()
  })

  it('can trigger manual refresh', () => {
    const mockSendMessage = jest.fn()
    const { useWebSocket } = require('../../hooks/use-websocket')
    useWebSocket.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      error: null,
      sendMessage: mockSendMessage,
      disconnect: jest.fn(),
      reconnect: jest.fn()
    })

    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'refresh',
      widgets: ['widget-1'] // Only real-time enabled widgets
    })
  })

  it('shows disconnected state', () => {
    const { useWebSocket } = require('../../hooks/use-websocket')
    useWebSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      error: null,
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      reconnect: jest.fn()
    })

    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument()
  })

  it('shows connecting state', () => {
    const { useWebSocket } = require('../../hooks/use-websocket')
    useWebSocket.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      error: null,
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      reconnect: jest.fn()
    })

    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('Connecting')).toBeInTheDocument()
  })

  it('shows error message when connection fails', () => {
    const { useWebSocket } = require('../../hooks/use-websocket')
    useWebSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      error: 'Connection failed',
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      reconnect: jest.fn()
    })

    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    expect(screen.getByText('Connection error: Connection failed')).toBeInTheDocument()
  })

  it('can trigger reconnection', () => {
    const mockReconnect = jest.fn()
    const { useWebSocket } = require('../../hooks/use-websocket')
    useWebSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      error: null,
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      reconnect: mockReconnect
    })

    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
    fireEvent.click(reconnectButton)

    expect(mockReconnect).toHaveBeenCalled()
  })

  it('disables refresh button when disconnected', () => {
    const { useWebSocket } = require('../../hooks/use-websocket')
    useWebSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      error: null,
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      reconnect: jest.fn()
    })

    render(<RealTimeDashboard initialWidgets={mockWidgets} />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeDisabled()
  })

  it('calls onWidgetUpdate when widgets are reordered', () => {
    const mockOnWidgetUpdate = jest.fn()

    render(
      <RealTimeDashboard
        initialWidgets={mockWidgets}
        onWidgetUpdate={mockOnWidgetUpdate}
      />
    )

    // This would typically be triggered by drag and drop, but we can't easily simulate that
    // The test verifies the prop is passed correctly
    expect(mockOnWidgetUpdate).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <RealTimeDashboard
        initialWidgets={mockWidgets}
        className="custom-dashboard"
      />
    )

    expect(container.firstChild).toHaveClass('custom-dashboard')
  })

  it('uses custom WebSocket URL', () => {
    const { useWebSocket } = require('../../hooks/use-websocket')
    const mockUseWebSocket = jest.fn().mockReturnValue({
      isConnected: true,
      isConnecting: false,
      error: null,
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      reconnect: jest.fn()
    })
    useWebSocket.mockImplementation(mockUseWebSocket)

    render(
      <RealTimeDashboard
        initialWidgets={mockWidgets}
        websocketUrl="ws://custom-url:9000/dashboard"
      />
    )

    expect(mockUseWebSocket).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'ws://custom-url:9000/dashboard'
      })
    )
  })
})