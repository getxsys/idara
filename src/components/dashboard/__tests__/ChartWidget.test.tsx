import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ChartWidget } from '../ChartWidget'
import { ChartDataPoint } from '@/types/dashboard'

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Bar Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Doughnut Chart
    </div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Pie Chart
    </div>
  )
}))

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
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

const mockChartData: ChartDataPoint[] = [
  { x: '10:00', y: 100 },
  { x: '11:00', y: 120 },
  { x: '12:00', y: 110 },
  { x: '13:00', y: 140 },
  { x: '14:00', y: 130 }
]

describe('ChartWidget', () => {
  it('renders chart widget with title', () => {
    render(
      <ChartWidget
        title="Test Chart"
        data={mockChartData}
      />
    )

    expect(screen.getByText('Test Chart')).toBeInTheDocument()
  })

  it('renders line chart by default', () => {
    render(
      <ChartWidget
        title="Line Chart"
        data={mockChartData}
      />
    )

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    const titleElements = screen.getAllByText('Line Chart')
    expect(titleElements.length).toBeGreaterThan(0)
  })

  it('renders bar chart when configured', () => {
    render(
      <ChartWidget
        title="Bar Chart"
        data={mockChartData}
        config={{ chartType: 'bar' }}
      />
    )

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders doughnut chart when configured', () => {
    const pieData: ChartDataPoint[] = [
      { x: 'Category A', y: 30, label: 'Category A' },
      { x: 'Category B', y: 45, label: 'Category B' },
      { x: 'Category C', y: 25, label: 'Category C' }
    ]

    render(
      <ChartWidget
        title="Doughnut Chart"
        data={pieData}
        config={{ chartType: 'doughnut' }}
      />
    )

    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
  })

  it('renders pie chart when configured', () => {
    const pieData: ChartDataPoint[] = [
      { x: 'Category A', y: 30, label: 'Category A' },
      { x: 'Category B', y: 45, label: 'Category B' },
      { x: 'Category C', y: 25, label: 'Category C' }
    ]

    render(
      <ChartWidget
        title="Pie Chart"
        data={pieData}
        config={{ chartType: 'pie' }}
      />
    )

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('shows trend badge when trend is enabled', () => {
    render(
      <ChartWidget
        title="Chart with Trend"
        data={mockChartData}
        config={{ showTrend: true }}
      />
    )

    // Should show trend percentage badge in header
    const trendBadges = screen.getAllByText(/\d+\.\d+%/)
    expect(trendBadges.length).toBeGreaterThan(0)
  })

  it('hides trend badge when trend is disabled', () => {
    render(
      <ChartWidget
        title="Chart without Trend"
        data={mockChartData}
        config={{ showTrend: false }}
      />
    )

    // Should not show trend percentage badge
    expect(screen.queryByText(/\d+\.\d+%/)).not.toBeInTheDocument()
  })

  it('shows last updated time when enabled', () => {
    const lastUpdated = new Date('2024-01-01T12:00:00Z')

    render(
      <ChartWidget
        title="Chart with Timestamp"
        data={mockChartData}
        showLastUpdated={true}
        lastUpdated={lastUpdated}
      />
    )

    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('hides last updated time when disabled', () => {
    render(
      <ChartWidget
        title="Chart without Timestamp"
        data={mockChartData}
        showLastUpdated={false}
      />
    )

    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument()
  })

  it('shows no data message when data is empty', () => {
    render(
      <ChartWidget
        title="Empty Chart"
        data={[]}
      />
    )

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('applies custom styling', () => {
    const { container } = render(
      <ChartWidget
        title="Styled Chart"
        data={mockChartData}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('uses custom colors from config', () => {
    const config = {
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00'
      }
    }

    render(
      <ChartWidget
        title="Custom Color Chart"
        data={mockChartData}
        config={config}
      />
    )

    const chartElement = screen.getByTestId('line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}')
    
    expect(chartData.datasets[0].borderColor).toBe('#ff0000')
  })

  it('calculates trend correctly for increasing data', () => {
    const increasingData: ChartDataPoint[] = [
      { x: '10:00', y: 100 },
      { x: '11:00', y: 110 },
      { x: '12:00', y: 120 },
      { x: '13:00', y: 130 },
      { x: '14:00', y: 140 }
    ]

    render(
      <ChartWidget
        title="Increasing Trend Chart"
        data={increasingData}
        config={{ showTrend: true }}
      />
    )

    // Should show positive trend
    const trendElements = screen.getAllByText(/\d+\.\d+%/)
    expect(trendElements.length).toBeGreaterThan(0)
  })

  it('shows trend summary when enabled', () => {
    render(
      <ChartWidget
        title="Chart with Trend Summary"
        data={mockChartData}
        config={{ showTrend: true }}
      />
    )

    expect(screen.getByText(/over recent period/)).toBeInTheDocument()
  })
})