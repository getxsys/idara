export interface TrendAnalysis {
  metric: string
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  strength: number // 0-1, confidence in trend
  slope: number // rate of change
  r2: number // correlation coefficient
  period: string
  dataPoints: number
  startDate: Date
  endDate: Date
}

export interface AnomalyDetection {
  timestamp: Date
  value: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number // 0-1
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break'
  description: string
}

export interface ForecastPoint {
  timestamp: Date
  predictedValue: number
  confidenceInterval: {
    lower: number
    upper: number
  }
  confidence: number
}

export interface Forecast {
  metric: string
  model: 'linear' | 'exponential' | 'seasonal' | 'arima'
  predictions: ForecastPoint[]
  accuracy: number
  mape: number // Mean Absolute Percentage Error
  rmse: number // Root Mean Square Error
  generatedAt: Date
  validUntil: Date
}

export interface BusinessMetric {
  id: string
  name: string
  value: number
  timestamp: Date
  category: 'revenue' | 'performance' | 'engagement' | 'conversion' | 'satisfaction'
  unit?: string
  metadata?: Record<string, any>
}

export interface MetricHistory {
  metric: string
  data: BusinessMetric[]
  aggregation: 'hourly' | 'daily' | 'weekly' | 'monthly'
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'optimization' | 'risk_mitigation' | 'opportunity' | 'maintenance'
  confidence: number
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  suggestedActions: string[]
  relatedMetrics: string[]
  estimatedValue?: number
  timeframe?: string
  createdAt: Date
}

export interface AnalyticsInsight {
  id: string
  type: 'trend' | 'anomaly' | 'forecast' | 'recommendation'
  title: string
  summary: string
  data: TrendAnalysis | AnomalyDetection | Forecast | Recommendation
  relevanceScore: number
  createdAt: Date
  expiresAt?: Date
}

export interface AnalyticsConfig {
  anomalyDetection: {
    enabled: boolean
    sensitivity: 'low' | 'medium' | 'high'
    lookbackPeriod: number // days
    minDataPoints: number
  }
  forecasting: {
    enabled: boolean
    horizon: number // days to forecast
    updateFrequency: number // hours
    models: string[]
  }
  recommendations: {
    enabled: boolean
    maxRecommendations: number
    minConfidence: number
  }
}