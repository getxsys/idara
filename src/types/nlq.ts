export interface NLQuery {
  id: string
  query: string
  timestamp: Date
  userId: string
  response?: NLQueryResponse
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export interface NLQueryResponse {
  answer: string
  visualizations?: QueryVisualization[]
  insights?: string[]
  confidence: number
  sources?: string[]
  suggestedFollowUps?: string[]
}

export interface QueryVisualization {
  type: 'chart' | 'table' | 'metric' | 'list'
  title: string
  data: any
  config?: {
    chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
    xAxis?: string
    yAxis?: string
    colors?: string[]
  }
}

export interface QuerySuggestion {
  text: string
  category: 'metrics' | 'trends' | 'comparisons' | 'forecasts'
  confidence: number
}

export interface QueryHistory {
  queries: NLQuery[]
  savedQueries: SavedQuery[]
}

export interface SavedQuery {
  id: string
  name: string
  query: string
  description?: string
  tags: string[]
  createdAt: Date
  lastUsed?: Date
  useCount: number
}

export interface QueryIntent {
  type: 'metric' | 'trend' | 'comparison' | 'forecast' | 'anomaly' | 'summary'
  entities: string[]
  timeframe?: {
    start?: Date
    end?: Date
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  }
  filters?: Record<string, any>
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface NLQueryContext {
  currentDashboard?: string
  selectedWidgets?: string[]
  userRole?: string
  recentQueries?: string[]
  businessContext?: {
    industry?: string
    companySize?: string
    primaryMetrics?: string[]
  }
}