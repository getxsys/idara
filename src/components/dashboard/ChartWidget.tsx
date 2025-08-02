'use client'

import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp } from 'lucide-react'
import { ChartDataPoint, WidgetConfig } from '@/types/dashboard'
import { cn } from '@/lib/utils'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartWidgetProps {
  title: string
  data: ChartDataPoint[]
  config?: WidgetConfig
  className?: string
  showLastUpdated?: boolean
  lastUpdated?: Date
}

export function ChartWidget({
  title,
  data,
  config = {},
  className,
  showLastUpdated = true,
  lastUpdated = new Date()
}: ChartWidgetProps) {
  const {
    chartType = 'line',
    colors = {
      primary: '#3b82f6',
      secondary: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444'
    },
    showTrend = true
  } = config

  const chartData = useMemo(() => {
    const labels = data.map(point => {
      if (point.x instanceof Date) {
        return point.x.toLocaleTimeString()
      }
      return String(point.x)
    })

    const values = data.map(point => point.y)

    const baseDataset = {
      label: title,
      data: values,
      borderColor: colors.primary,
      backgroundColor: chartType === 'area' 
        ? `${colors.primary}20` 
        : colors.primary,
      tension: 0.4,
      fill: chartType === 'area'
    }

    if (chartType === 'doughnut' || chartType === 'pie') {
      return {
        labels: data.map(point => point.label || String(point.x)),
        datasets: [{
          ...baseDataset,
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.warning,
            colors.critical,
            '#8b5cf6',
            '#06b6d4'
          ].slice(0, data.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      }
    }

    return {
      labels,
      datasets: [baseDataset]
    }
  }, [data, title, chartType, colors])

  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType === 'doughnut' || chartType === 'pie',
          position: 'bottom' as const,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        },
      },
      scales: chartType === 'doughnut' || chartType === 'pie' ? {} : {
        x: {
          display: true,
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          grid: {
            color: '#f3f4f6',
          },
          beginAtZero: true,
        },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    }

    return baseOptions
  }, [chartType])

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options: chartOptions,
      height: 200
    }

    switch (chartType) {
      case 'bar':
        return <Bar {...commonProps} />
      case 'doughnut':
        return <Doughnut {...commonProps} />
      case 'pie':
        return <Pie {...commonProps} />
      case 'area':
      case 'line':
      default:
        return <Line {...commonProps} />
    }
  }

  const calculateTrend = () => {
    if (data.length < 2) return null
    
    const recent = data.slice(-5)
    const firstValue = recent[0]?.y || 0
    const lastValue = recent[recent.length - 1]?.y || 0
    const change = lastValue - firstValue
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0

    return {
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    }
  }

  const trendData = showTrend ? calculateTrend() : null

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {trendData && (
            <Badge 
              variant="secondary" 
              className={cn(
                trendData.trend === 'up' ? 'bg-green-100 text-green-800' :
                trendData.trend === 'down' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              )}
            >
              <TrendingUp className={cn(
                'h-3 w-3 mr-1',
                trendData.trend === 'down' && 'rotate-180'
              )} />
              {trendData.changePercent.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Chart Container */}
        <div className="h-48 w-full">
          {data.length > 0 ? (
            renderChart()
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Trend Summary */}
        {trendData && showTrend && (
          <div className="text-xs text-gray-600">
            <span className={cn(
              trendData.trend === 'up' ? 'text-green-600' :
              trendData.trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            )}>
              {trendData.change > 0 ? '+' : ''}{trendData.change.toFixed(2)} 
              ({trendData.changePercent > 0 ? '+' : ''}{trendData.changePercent.toFixed(1)}%)
            </span>
            <span className="ml-2">over recent period</span>
          </div>
        )}

        {/* Last Updated */}
        {showLastUpdated && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}