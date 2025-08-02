import { WidgetData, KPIData, ChartDataPoint } from '@/types/dashboard'

// Mock KPI data generator
export function generateMockKPIData(id: string, name: string): KPIData {
  const baseValue = Math.random() * 10000 + 1000
  const previousValue = baseValue * (0.8 + Math.random() * 0.4) // ±20% variation
  const change = baseValue - previousValue
  const changePercent = (change / previousValue) * 100
  
  let status: 'good' | 'warning' | 'critical' = 'good'
  if (Math.abs(changePercent) > 15) {
    status = 'critical'
  } else if (Math.abs(changePercent) > 5) {
    status = 'warning'
  }

  return {
    id,
    name,
    value: Math.round(baseValue),
    previousValue: Math.round(previousValue),
    target: Math.round(baseValue * 1.2),
    unit: name.includes('Revenue') ? '$' : name.includes('Rate') ? '%' : '',
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    change: Math.round(change),
    changePercent: Math.round(changePercent * 10) / 10,
    status,
    timestamp: new Date()
  }
}

// Mock chart data generator
export function generateMockChartData(points: number = 10): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const now = new Date()
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000) // 1 minute intervals
    const value = Math.random() * 100 + 50 + Math.sin(i * 0.5) * 20 // Some trend with noise
    
    data.push({
      x: timestamp,
      y: Math.round(value * 10) / 10,
      label: timestamp.toLocaleTimeString()
    })
  }
  
  return data
}

// Generate sample dashboard widgets
export function generateSampleWidgets(): WidgetData[] {
  return [
    {
      id: 'revenue-kpi',
      title: 'Monthly Revenue',
      type: 'kpi',
      size: 'medium',
      realTimeEnabled: true,
      data: generateMockKPIData('revenue', 'Monthly Revenue'),
      config: {
        chartType: 'line',
        refreshInterval: 30,
        showTrend: true,
        showComparison: true,
        comparisonPeriod: 'month',
        colors: {
          primary: '#10b981',
          secondary: '#3b82f6'
        },
        thresholds: {
          warning: 5000,
          critical: 3000
        }
      },
      lastUpdated: new Date()
    },
    {
      id: 'conversion-rate-kpi',
      title: 'Conversion Rate',
      type: 'kpi',
      size: 'medium',
      realTimeEnabled: true,
      data: generateMockKPIData('conversion', 'Conversion Rate'),
      config: {
        refreshInterval: 60,
        showTrend: true,
        colors: {
          primary: '#f59e0b',
          secondary: '#10b981'
        }
      },
      lastUpdated: new Date()
    },
    {
      id: 'sales-chart',
      title: 'Sales Trend',
      type: 'chart',
      size: 'large',
      realTimeEnabled: true,
      data: generateMockChartData(15),
      config: {
        chartType: 'area',
        refreshInterval: 45,
        showTrend: true,
        colors: {
          primary: '#3b82f6',
          secondary: '#10b981'
        }
      },
      lastUpdated: new Date()
    },
    {
      id: 'user-activity-chart',
      title: 'User Activity',
      type: 'chart',
      size: 'medium',
      realTimeEnabled: true,
      data: generateMockChartData(12),
      config: {
        chartType: 'bar',
        refreshInterval: 30,
        showTrend: true,
        colors: {
          primary: '#8b5cf6',
          secondary: '#06b6d4'
        }
      },
      lastUpdated: new Date()
    },
    {
      id: 'customer-satisfaction',
      title: 'Customer Satisfaction',
      type: 'kpi',
      size: 'small',
      realTimeEnabled: false,
      data: generateMockKPIData('satisfaction', 'Customer Satisfaction'),
      config: {
        showTrend: true,
        colors: {
          primary: '#ef4444',
          secondary: '#f59e0b'
        }
      },
      lastUpdated: new Date()
    },
    {
      id: 'performance-metrics',
      title: 'Performance Distribution',
      type: 'chart',
      size: 'medium',
      realTimeEnabled: false,
      data: [
        { x: 'Excellent', y: 35, label: 'Excellent' },
        { x: 'Good', y: 45, label: 'Good' },
        { x: 'Average', y: 15, label: 'Average' },
        { x: 'Poor', y: 5, label: 'Poor' }
      ],
      config: {
        chartType: 'doughnut',
        colors: {
          primary: '#10b981',
          secondary: '#3b82f6',
          warning: '#f59e0b',
          critical: '#ef4444'
        }
      },
      lastUpdated: new Date()
    }
  ]
}

// Simulate real-time data updates
export function updateWidgetData(widget: WidgetData): WidgetData {
  if (widget.type === 'kpi' && widget.data) {
    return {
      ...widget,
      data: generateMockKPIData(widget.data.id, widget.data.name),
      lastUpdated: new Date()
    }
  }
  
  if (widget.type === 'chart' && Array.isArray(widget.data)) {
    // For time series charts, add new point and remove oldest
    if (widget.config?.chartType !== 'doughnut' && widget.config?.chartType !== 'pie') {
      const currentData = [...widget.data]
      const lastPoint = currentData[currentData.length - 1]
      const newTimestamp = new Date()
      const newValue = typeof lastPoint?.y === 'number' 
        ? lastPoint.y + (Math.random() - 0.5) * 20 
        : Math.random() * 100
      
      currentData.push({
        x: newTimestamp,
        y: Math.round(newValue * 10) / 10,
        label: newTimestamp.toLocaleTimeString()
      })
      
      // Keep only last 15 points
      while (currentData.length > 15) {
        currentData.shift()
      }
      
      return {
        ...widget,
        data: currentData,
        lastUpdated: new Date()
      }
    }
  }
  
  return widget
}