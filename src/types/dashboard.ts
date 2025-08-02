export interface WidgetData {
  id: string
  title: string
  type: 'metric' | 'chart' | 'list' | 'custom' | 'kpi'
  size: 'small' | 'medium' | 'large' | 'wide'
  value?: string | number
  description?: string
  change?: number
  items?: string[]
  data?: any
  config?: WidgetConfig
  realTimeEnabled?: boolean
  lastUpdated?: Date
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'doughnut' | 'pie' | 'area'
  dataSource?: string
  refreshInterval?: number
  thresholds?: {
    warning?: number
    critical?: number
  }
  colors?: {
    primary?: string
    secondary?: string
    warning?: string
    critical?: string
  }
  showTrend?: boolean
  showComparison?: boolean
  comparisonPeriod?: 'day' | 'week' | 'month' | 'year'
}

export interface KPIData {
  id: string
  name: string
  value: number
  previousValue?: number
  target?: number
  unit?: string
  trend: 'up' | 'down' | 'stable'
  change: number
  changePercent: number
  status: 'good' | 'warning' | 'critical'
  timestamp: Date
}

export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
}

export interface RealTimeUpdate {
  widgetId: string
  data: KPIData | ChartDataPoint[]
  timestamp: Date
}

export interface DashboardConfig {
  widgets: WidgetData[]
  layout: 'grid' | 'masonry'
  columns: number
}

export interface DashboardState {
  isCustomizing: boolean
  selectedWidget?: string
  availableWidgets: WidgetData[]
}