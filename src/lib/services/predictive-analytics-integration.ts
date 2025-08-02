import { PredictiveAnalyticsSystem } from './predictive-analytics'
import { MockAnalyticsDataService } from './mock-analytics-data'
import { MetricHistory, TrendAnalysis, AnomalyDetection, Forecast, Recommendation } from '@/types/analytics'

/**
 * Integration service demonstrating how to use the Predictive Analytics System
 * in a real business dashboard context.
 * 
 * This service shows practical implementation of all requirements:
 * - Requirement 1.3: Trend detection with actionable steps
 * - Requirement 8.1: Revenue forecasts with confidence intervals
 * - Requirement 8.2: Market condition impact predictions
 * - Requirement 8.3: Seasonal pattern incorporation
 */
export class PredictiveAnalyticsIntegration {
  private predictiveSystem: PredictiveAnalyticsSystem

  constructor() {
    this.predictiveSystem = new PredictiveAnalyticsSystem({
      anomalyDetection: {
        enabled: true,
        sensitivity: 'medium',
        lookbackPeriod: 30,
        minDataPoints: 10
      },
      forecasting: {
        enabled: true,
        horizon: 14, // 2 weeks forecast
        updateFrequency: 24, // Update daily
        models: ['linear', 'exponential', 'seasonal', 'arima']
      },
      recommendations: {
        enabled: true,
        maxRecommendations: 10,
        minConfidence: 0.6
      }
    })
  }

  /**
   * Generate comprehensive business dashboard data
   * This method would typically be called by a dashboard API endpoint
   */
  async generateBusinessDashboard(): Promise<{
    summary: {
      totalMetrics: number
      trendsAnalyzed: number
      anomaliesDetected: number
      forecastsGenerated: number
      recommendationsCount: number
      lastUpdated: Date
    }
    kpiCards: {
      title: string
      value: string
      trend: 'up' | 'down' | 'stable'
      change: string
      forecast: string
    }[]
    alerts: {
      level: 'info' | 'warning' | 'critical'
      title: string
      message: string
      timestamp: Date
    }[]
    insights: {
      type: 'trend' | 'forecast' | 'recommendation'
      title: string
      description: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      actionable: boolean
    }[]
    marketOutlook: {
      outlook: 'positive' | 'neutral' | 'negative'
      confidence: number
      factors: string[]
      nextReview: Date
    }
    riskAssessment: {
      level: 'low' | 'medium' | 'high' | 'critical'
      score: number
      factors: string[]
      mitigation: string[]
    }
  }> {
    // Generate realistic business metrics
    const businessMetrics = await this.generateBusinessMetrics()

    // Get comprehensive analytics
    const dashboardData = await this.predictiveSystem.generateDashboardInsights(businessMetrics)

    // Transform data for dashboard consumption
    const kpiCards = this.generateKPICards(dashboardData.trends, dashboardData.forecasts)
    const alerts = this.generateAlerts(dashboardData.anomalies, dashboardData.riskAssessment)
    const insights = this.generateInsights(dashboardData.trends, dashboardData.recommendations)

    return {
      summary: {
        ...dashboardData.summary,
        lastUpdated: new Date()
      },
      kpiCards,
      alerts,
      insights,
      marketOutlook: {
        ...dashboardData.marketOutlook,
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
      },
      riskAssessment: {
        ...dashboardData.riskAssessment,
        score: this.calculateRiskScore(dashboardData.riskAssessment.level)
      }
    }
  }

  /**
   * Generate revenue forecasting dashboard
   * Requirement 8.1: Revenue forecasts with confidence intervals
   */
  async generateRevenueForecastDashboard(): Promise<{
    currentRevenue: {
      value: number
      period: string
      change: number
      changePercent: number
    }
    forecast: {
      period: string
      predictions: {
        date: string
        value: number
        confidence: number
        range: { min: number; max: number }
      }[]
      accuracy: number
      model: string
    }
    seasonalInsights: {
      hasSeasonality: boolean
      period?: number
      nextPeak?: string
      nextTrough?: string
      strength?: number
    }
    recommendations: {
      title: string
      description: string
      impact: 'low' | 'medium' | 'high'
      timeframe: string
    }[]
  }> {
    // Generate revenue data
    const revenueData = MockAnalyticsDataService.generateMetricHistory(
      'Monthly Revenue',
      'revenue',
      90, // 3 months of data
      'increasing'
    )

    const forecasts = await this.predictiveSystem.generateAdvancedForecasts([revenueData])
    const revenueForecast = forecasts.forecasts[0]
    const seasonalInsight = forecasts.seasonalInsights[0]

    // Calculate current revenue metrics
    const currentData = revenueData.data.slice(-30) // Last 30 days
    const previousData = revenueData.data.slice(-60, -30) // Previous 30 days
    
    const currentRevenue = currentData.reduce((sum, d) => sum + d.value, 0)
    const previousRevenue = previousData.reduce((sum, d) => sum + d.value, 0)
    const change = currentRevenue - previousRevenue
    const changePercent = previousRevenue > 0 ? (change / previousRevenue) * 100 : 0

    // Generate revenue-specific recommendations
    const trendAnalysis = await this.predictiveSystem.analyzeTrendsWithInsights([revenueData])
    const recommendations = await this.predictiveSystem.generateActionableRecommendations(
      trendAnalysis.trends,
      [],
      [revenueForecast]
    )

    return {
      currentRevenue: {
        value: currentRevenue,
        period: 'Last 30 days',
        change,
        changePercent
      },
      forecast: {
        period: '14 days',
        predictions: revenueForecast.predictions.slice(0, 14).map(p => ({
          date: p.timestamp.toISOString().split('T')[0],
          value: Math.round(p.predictedValue),
          confidence: Math.round(p.confidence * 100),
          range: {
            min: Math.round(p.confidenceInterval.lower),
            max: Math.round(p.confidenceInterval.upper)
          }
        })),
        accuracy: Math.round(revenueForecast.accuracy * 100),
        model: revenueForecast.model
      },
      seasonalInsights: {
        hasSeasonality: seasonalInsight.hasSeasonality,
        period: seasonalInsight.period,
        nextPeak: seasonalInsight.nextPeak?.toISOString().split('T')[0],
        nextTrough: seasonalInsight.nextTrough?.toISOString().split('T')[0],
        strength: seasonalInsight.strength ? Math.round(seasonalInsight.strength * 100) : undefined
      },
      recommendations: recommendations.recommendations
        .filter(r => r.category === 'opportunity' || r.category === 'optimization')
        .slice(0, 5)
        .map(r => ({
          title: r.title,
          description: r.description,
          impact: r.impact,
          timeframe: r.timeframe || 'Short term'
        }))
    }
  }

  /**
   * Generate real-time alerts and notifications
   */
  async generateRealTimeAlerts(): Promise<{
    criticalAlerts: {
      id: string
      title: string
      message: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      timestamp: Date
      metric: string
      value: number
      threshold: number
      action: string
    }[]
    trendAlerts: {
      id: string
      metric: string
      trend: string
      strength: number
      message: string
      recommendations: string[]
    }[]
    forecastAlerts: {
      id: string
      metric: string
      prediction: string
      confidence: number
      timeframe: string
      impact: string
    }[]
  }> {
    const businessMetrics = await this.generateBusinessMetrics()
    
    // Detect anomalies for critical alerts
    const anomalyAnalysis = await this.predictiveSystem.detectAnomaliesWithContext(businessMetrics)
    
    // Analyze trends for trend alerts
    const trendAnalysis = await this.predictiveSystem.analyzeTrendsWithInsights(businessMetrics)
    
    // Generate forecasts for forecast alerts
    const forecastAnalysis = await this.predictiveSystem.generateAdvancedForecasts(businessMetrics)

    const criticalAlerts = anomalyAnalysis.anomalies
      .filter(a => a.severity === 'critical' || a.severity === 'high')
      .map(anomaly => ({
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${anomaly.type.toUpperCase()} Detected`,
        message: anomaly.description,
        severity: anomaly.severity,
        timestamp: anomaly.timestamp,
        metric: 'System Performance', // Would be derived from context
        value: anomaly.value,
        threshold: anomaly.expectedValue,
        action: this.getRecommendedAction(anomaly)
      }))

    const trendAlerts = trendAnalysis.trends
      .filter(t => t.strength > 0.7 && (t.trend === 'decreasing' || t.trend === 'volatile'))
      .map(trend => ({
        id: `trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metric: trend.metric,
        trend: trend.trend,
        strength: Math.round(trend.strength * 100),
        message: `${trend.metric} shows ${trend.trend} trend with ${Math.round(trend.strength * 100)}% confidence`,
        recommendations: trendAnalysis.actionableSteps.filter(step => 
          step.toLowerCase().includes(trend.metric.toLowerCase())
        ).slice(0, 2)
      }))

    const forecastAlerts = forecastAnalysis.forecasts
      .filter(f => f.accuracy > 0.6)
      .map(forecast => {
        const nearTermPrediction = forecast.predictions[0]
        const weekPrediction = forecast.predictions[6] || forecast.predictions[forecast.predictions.length - 1]
        
        const change = weekPrediction ? 
          ((weekPrediction.predictedValue - nearTermPrediction.predictedValue) / nearTermPrediction.predictedValue) * 100 : 0

        return {
          id: `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          metric: forecast.metric,
          prediction: change > 5 ? 'Increasing' : change < -5 ? 'Decreasing' : 'Stable',
          confidence: Math.round(forecast.accuracy * 100),
          timeframe: '7 days',
          impact: Math.abs(change) > 10 ? 'High' : Math.abs(change) > 5 ? 'Medium' : 'Low'
        }
      })

    return {
      criticalAlerts,
      trendAlerts,
      forecastAlerts
    }
  }

  /**
   * Generate business metrics for demonstration
   */
  private async generateBusinessMetrics(): Promise<MetricHistory[]> {
    return [
      // Core business metrics
      MockAnalyticsDataService.generateMetricHistory('Revenue', 'revenue', 90, 'increasing'),
      MockAnalyticsDataService.generateMetricHistory('Customer Acquisition Cost', 'performance', 60, 'decreasing'),
      MockAnalyticsDataService.generateMetricHistory('Monthly Active Users', 'engagement', 75, 'seasonal'),
      MockAnalyticsDataService.generateMetricHistory('Conversion Rate', 'conversion', 45, 'stable'),
      MockAnalyticsDataService.generateMetricHistory('Customer Satisfaction', 'satisfaction', 50, 'increasing'),
      
      // Performance metrics
      MockAnalyticsDataService.generateMetricHistory('Page Load Time', 'performance', 40, 'decreasing'),
      MockAnalyticsDataService.generateMetricHistoryWithAnomalies('Error Rate', 'performance', 35),
      MockAnalyticsDataService.generateMetricHistory('API Response Time', 'performance', 30, 'stable'),
      
      // Engagement metrics
      MockAnalyticsDataService.generateMetricHistory('Session Duration', 'engagement', 60, 'increasing'),
      MockAnalyticsDataService.generateMetricHistory('Bounce Rate', 'engagement', 45, 'decreasing')
    ]
  }

  /**
   * Generate KPI cards for dashboard
   */
  private generateKPICards(trends: TrendAnalysis[], forecasts: Forecast[]): {
    title: string
    value: string
    trend: 'up' | 'down' | 'stable'
    change: string
    forecast: string
  }[] {
    const kpiCards = []

    // Revenue KPI
    const revenueTrend = trends.find(t => t.metric.toLowerCase().includes('revenue'))
    const revenueForecast = forecasts.find(f => f.metric.toLowerCase().includes('revenue'))
    
    if (revenueTrend) {
      kpiCards.push({
        title: 'Revenue',
        value: '$125,430',
        trend: revenueTrend.trend === 'increasing' ? 'up' : revenueTrend.trend === 'decreasing' ? 'down' : 'stable',
        change: `${revenueTrend.slope > 0 ? '+' : ''}${(revenueTrend.slope * 100).toFixed(1)}%`,
        forecast: revenueForecast ? 
          `$${Math.round(revenueForecast.predictions[6]?.predictedValue || 0).toLocaleString()} (7d)` : 
          'No forecast'
      })
    }

    // Customer metrics
    const engagementTrend = trends.find(t => t.metric.toLowerCase().includes('user') || t.metric.toLowerCase().includes('engagement'))
    if (engagementTrend) {
      kpiCards.push({
        title: 'Active Users',
        value: '12,543',
        trend: engagementTrend.trend === 'increasing' ? 'up' : engagementTrend.trend === 'decreasing' ? 'down' : 'stable',
        change: `${engagementTrend.slope > 0 ? '+' : ''}${(engagementTrend.slope * 100).toFixed(1)}%`,
        forecast: '13,200 (7d)'
      })
    }

    // Conversion metrics
    const conversionTrend = trends.find(t => t.metric.toLowerCase().includes('conversion'))
    if (conversionTrend) {
      kpiCards.push({
        title: 'Conversion Rate',
        value: '3.2%',
        trend: conversionTrend.trend === 'increasing' ? 'up' : conversionTrend.trend === 'decreasing' ? 'down' : 'stable',
        change: `${conversionTrend.slope > 0 ? '+' : ''}${(conversionTrend.slope * 100).toFixed(1)}%`,
        forecast: '3.4% (7d)'
      })
    }

    // Performance metrics
    const performanceTrend = trends.find(t => t.metric.toLowerCase().includes('performance') || t.metric.toLowerCase().includes('load'))
    if (performanceTrend) {
      kpiCards.push({
        title: 'Avg Load Time',
        value: '1.2s',
        trend: performanceTrend.trend === 'decreasing' ? 'up' : performanceTrend.trend === 'increasing' ? 'down' : 'stable', // Inverted for load time
        change: `${performanceTrend.slope < 0 ? '+' : ''}${Math.abs(performanceTrend.slope * 100).toFixed(1)}%`,
        forecast: '1.1s (7d)'
      })
    }

    return kpiCards
  }

  /**
   * Generate alerts from anomalies and risk assessment
   */
  private generateAlerts(anomalies: AnomalyDetection[], riskAssessment: any): {
    level: 'info' | 'warning' | 'critical'
    title: string
    message: string
    timestamp: Date
  }[] {
    const alerts = []

    // Anomaly alerts
    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        alerts.push({
          level: anomaly.severity === 'critical' ? 'critical' : 'warning',
          title: `${anomaly.type.toUpperCase()} Detected`,
          message: anomaly.description,
          timestamp: anomaly.timestamp
        })
      }
    })

    // Risk assessment alert
    if (riskAssessment.level === 'high' || riskAssessment.level === 'critical') {
      alerts.push({
        level: riskAssessment.level === 'critical' ? 'critical' : 'warning',
        title: `${riskAssessment.level.toUpperCase()} Risk Level`,
        message: `Multiple risk factors detected: ${riskAssessment.factors.slice(0, 2).join(', ')}`,
        timestamp: new Date()
      })
    }

    // Info alerts for positive trends
    if (alerts.length === 0) {
      alerts.push({
        level: 'info',
        title: 'System Healthy',
        message: 'All metrics are performing within normal ranges',
        timestamp: new Date()
      })
    }

    return alerts.slice(0, 5) // Limit to 5 alerts
  }

  /**
   * Generate insights from trends and recommendations
   */
  private generateInsights(trends: TrendAnalysis[], recommendations: Recommendation[]): {
    type: 'trend' | 'forecast' | 'recommendation'
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    actionable: boolean
  }[] {
    const insights = []

    // Trend insights
    trends.forEach(trend => {
      if (trend.strength > 0.6) {
        insights.push({
          type: 'trend' as const,
          title: `${trend.metric} ${trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)} Trend`,
          description: `${trend.metric} shows ${trend.trend} pattern with ${Math.round(trend.strength * 100)}% confidence over ${trend.dataPoints} data points`,
          priority: trend.strength > 0.8 ? 'high' : 'medium',
          actionable: trend.trend === 'decreasing' || trend.trend === 'volatile'
        })
      }
    })

    // Recommendation insights
    recommendations.forEach(rec => {
      insights.push({
        type: 'recommendation' as const,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        actionable: true
      })
    })

    return insights.slice(0, 8) // Limit to 8 insights
  }

  /**
   * Calculate risk score from risk level
   */
  private calculateRiskScore(level: string): number {
    switch (level) {
      case 'low': return 25
      case 'medium': return 50
      case 'high': return 75
      case 'critical': return 95
      default: return 0
    }
  }

  /**
   * Get recommended action for anomaly
   */
  private getRecommendedAction(anomaly: AnomalyDetection): string {
    switch (anomaly.type) {
      case 'spike':
        return 'Investigate sudden increase and verify data integrity'
      case 'drop':
        return 'Check for system issues or data collection problems'
      case 'outlier':
        return 'Review data point for accuracy and potential causes'
      case 'pattern_break':
        return 'Analyze change in underlying patterns or processes'
      default:
        return 'Monitor closely and investigate if pattern continues'
    }
  }
}

// Export singleton instance
export const predictiveAnalyticsIntegration = new PredictiveAnalyticsIntegration()