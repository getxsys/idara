import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KPIWidget } from '../KPIWidget'
import { KPIData } from '@/types/dashboard'

const mockKPIData: KPIData = {
  id: 'test-kpi',
  name: 'Test KPI',
  value: 1500,
  previousValue: 1200,
  target: 2000,
  unit: '$',
  trend: 'up',
  change: 300,
  changePercent: 25,
  status: 'good',
  timestamp: new Date('2024-01-01T12:00:00Z')
}

describe('KPIWidget', () => {
  it('renders KPI data correctly', () => {
    render(
      <KPIWidget
        title="Revenue KPI"
        data={mockKPIData}
      />
    )

    expect(screen.getByText('Revenue KPI')).toBeInTheDocument()
    expect(screen.getByText('1.5K$')).toBeInTheDocument()
    expect(screen.getByText('GOOD')).toBeInTheDocument()
    expect(screen.getByText('+300$')).toBeInTheDocument()
    expect(screen.getByText('(+25.0%)')).toBeInTheDocument()
  })

  it('displays warning status correctly', () => {
    const warningData: KPIData = {
      ...mockKPIData,
      status: 'warning',
      trend: 'down',
      change: -100,
      changePercent: -8.3
    }

    render(
      <KPIWidget
        title="Warning KPI"
        data={warningData}
      />
    )

    expect(screen.getByText('WARNING')).toBeInTheDocument()
    expect(screen.getByText('-100$')).toBeInTheDocument()
    expect(screen.getByText('(-8.3%)')).toBeInTheDocument()
  })

  it('displays critical status correctly', () => {
    const criticalData: KPIData = {
      ...mockKPIData,
      status: 'critical',
      trend: 'down',
      change: -500,
      changePercent: -41.7
    }

    render(
      <KPIWidget
        title="Critical KPI"
        data={criticalData}
      />
    )

    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('-500$')).toBeInTheDocument()
    expect(screen.getByText('(-41.7%)')).toBeInTheDocument()
  })

  it('shows target progress when target is provided', () => {
    render(
      <KPIWidget
        title="KPI with Target"
        data={mockKPIData}
      />
    )

    expect(screen.getByText('Progress to target')).toBeInTheDocument()
    expect(screen.getByText('2.0K$')).toBeInTheDocument()
  })

  it('shows last updated time when enabled', () => {
    render(
      <KPIWidget
        title="KPI with Timestamp"
        data={mockKPIData}
        showLastUpdated={true}
      />
    )

    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('hides last updated time when disabled', () => {
    render(
      <KPIWidget
        title="KPI without Timestamp"
        data={mockKPIData}
        showLastUpdated={false}
      />
    )

    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument()
  })

  it('formats large numbers correctly', () => {
    const largeNumberData: KPIData = {
      ...mockKPIData,
      value: 1500000,
      change: 250000
    }

    render(
      <KPIWidget
        title="Large Number KPI"
        data={largeNumberData}
      />
    )

    expect(screen.getByText('1.5M$')).toBeInTheDocument()
    expect(screen.getByText('+250.0K$')).toBeInTheDocument()
  })

  it('shows comparison data when configured', () => {
    const config = {
      showComparison: true,
      comparisonPeriod: 'month' as const
    }

    render(
      <KPIWidget
        title="KPI with Comparison"
        data={mockKPIData}
        config={config}
      />
    )

    expect(screen.getByText('Previous month: 1.2K$')).toBeInTheDocument()
  })

  it('applies custom styling', () => {
    const { container } = render(
      <KPIWidget
        title="Styled KPI"
        data={mockKPIData}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles stable trend correctly', () => {
    const stableData: KPIData = {
      ...mockKPIData,
      trend: 'stable',
      change: 0,
      changePercent: 0
    }

    render(
      <KPIWidget
        title="Stable KPI"
        data={stableData}
      />
    )

    expect(screen.getByText('+0$')).toBeInTheDocument()
    expect(screen.getByText('(+0.0%)')).toBeInTheDocument()
  })
})