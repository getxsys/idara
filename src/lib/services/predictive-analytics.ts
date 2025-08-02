import { AnalyticsService } from './analytics-service'
import {
  TrendAnalysis,
  AnomalyDetection,
  Forecast,
  ForecastPoint,
  BusinessMetric,
  MetricHistory,
  Recommendation,
  AnalyticsInsight,
  AnalyticsConfig
} from '@/types/analytics'

/**
 * Enhanced Predictive Analytics System
 * Implements comprehensive business intelligence with advanced forecasting,
 * anomaly detection, trend analysis, and actionable recommendations.
 * 
 * Requirements addressed:
 * - 1.3: Trend detection with actionable steps
 * - 8.1: Revenue forecasts with confidence intervals
 * - 8.2: Market condition impact predictions
 * - 8.3: Seasonal pattern incorporation
 */
export class PredictiveAnalyticsSystem {
  private analyticsService: AnalyticsService
  private config: AnalyticsConfig

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = {
      anomalyDetection: {
        enabled: true,
        sensitivity: 'medium',
        lookbackPeriod: 30,
        minDataPoints: 10,
        ...config?.anomalyDetection
      },
      forecasting: {
        enabled: true,
        horizon: 14, // 2 weeks default
        updateFrequency: 24, // Update daily
        models: ['linear', 'exponential', 'seasonal', 'arima'],
        ...config?.forecasting
      },
      recommendations: {
        enabled: true,
        maxRecommendations: 10,
        minConfidence: 0.6,
        ...config?.recommendations
      }
    }

    this.analyticsService = new AnalyticsService(this.config)
  }

  /**
   * Comprehensive trend analysis with enhanced business intelligence
   * Requirement 1.3: Trend detection with actionable steps
   */
  async analyzeTrendsWithInsights(metricHistories: MetricHistory[]): Promise<{
    trends: TrendAnalysis[]
    insights: string[]
    actionableSteps: string[]
    riskAssessment: {
      level: 'low' | 'medium' | 'high' | 'critical'
      factors: string[]
      mitigation: string[]
    }
  }> {
    const trends = metricHistories
      .filter(history => history.data.length >= 2) // Filter out insufficient data
      .map(history => {
        try {
          return this.analyticsService.analyzeTrend(history)
        } catch (error) {
          console.warn(`Failed to analyze trend for ${history.metric}:`, error)
          return null
        }
      })
      .filter(Boolean) as TrendAnalysis[]
    const insights: string[] = []
    const actionableSteps: string[] = []
    const riskFactors: string[] = []
    const mitigationSteps: string[] = []

    // Analyze each trend for business insights
    trends.forEach(trend => {
      if (trend.strength > 0.7) {
        switch (trend.trend) {
          case 'increasing':
            insights.push(`${trend.metric} shows strong positive growth (${(trend.strength * 100).toFixed(1)}% confidence)`)
            actionableSteps.push(`Scale successful strategies for ${trend.metric}`)
            actionableSteps.push(`Allocate additional resources to maintain ${trend.metric} momentum`)
            break

          case 'decreasing':
            insights.push(`${trend.metric} is declining significantly (${(trend.strength * 100).toFixed(1)}% confidence)`)
            riskFactors.push(`Declining ${trend.metric} trend`)
            actionableSteps.push(`Investigate root causes of ${trend.metric} decline`)
            mitigationSteps.push(`Implement corrective measures for ${trend.metric}`)
            break

          case 'volatile':
            insights.push(`${trend.metric} shows high volatility - requires stabilization`)
            riskFactors.push(`Unstable ${trend.metric} performance`)
            actionableSteps.push(`Identify volatility sources in ${trend.metric}`)
            mitigationSteps.push(`Implement stability controls for ${trend.metric}`)
            break

          case 'stable':
            insights.push(`${trend.metric} maintains stable performance`)
            actionableSteps.push(`Monitor ${trend.metric} for optimization opportunities`)
            break
        }
      }
    })

    // Assess overall risk level
    const decreasingTrends = trends.filter(t => t.trend === 'decreasing' && t.strength > 0.6).length
    const volatileTrends = trends.filter(t => t.trend === 'volatile' && t.strength > 0.5).length
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (decreasingTrends >= 2 || volatileTrends >= 3) {
      riskLevel = 'critical'
    } else if (decreasingTrends >= 1 || volatileTrends >= 2) {
      riskLevel = 'high'
    } else if (volatileTrends >= 1) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    return {
      trends,
      insights,
      actionableSteps,
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors,
        mitigation: mitigationSteps
      }
    }
  }

  /**
   * Advanced anomaly detection with confidence scoring
   * Enhanced to provide detailed anomaly analysis and recommendations
   */
  async detectAnomaliesWithContext(metricHistories: MetricHistory[]): Promise<{
    anomalies: AnomalyDetection[]
    summary: {
      total: number
      bySeverity: Record<string, number>
      byType: Record<string, number>
      avgConfidence: number
    }
    recommendations: string[]
    alertLevel: 'normal' | 'warning' | 'critical'
  }> {
    const allAnomalies = metricHistories.flatMap(history => 
      this.analyticsService.detectAnomalies(history)
    )

    // Calculate summary statistics
    const summary = {
      total: allAnomalies.length,
      bySeverity: allAnomalies.reduce((acc, anomaly) => {
        acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byType: allAnomalies.reduce((acc, anomaly) => {
        acc[anomaly.type] = (acc[anomaly.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      avgConfidence: allAnomalies.length > 0 
        ? allAnomalies.reduce((sum, a) => sum + a.confidence, 0) / allAnomalies.length 
        : 0
    }

    // Generate contextual recommendations
    const recommendations: string[] = []
    const criticalCount = summary.bySeverity.critical || 0
    const highCount = summary.bySeverity.high || 0

    if (criticalCount > 0) {
      recommendations.push(`Immediate investigation required for ${criticalCount} critical anomalies`)
      recommendations.push('Implement emergency response protocols')
    }

    if (highCount > 0) {
      recommendations.push(`Review ${highCount} high-severity anomalies within 24 hours`)
    }

    if (summary.byType.spike > 2) {
      recommendations.push('Multiple spikes detected - check for system overload or data quality issues')
    }

    if (summary.byType.drop > 2) {
      recommendations.push('Multiple drops detected - investigate potential service disruptions')
    }

    // Determine alert level
    let alertLevel: 'normal' | 'warning' | 'critical'
    if (criticalCount > 0 || highCount > 2) {
      alertLevel = 'critical'
    } else if (highCount > 0 || allAnomalies.length > 5) {
      alertLevel = 'warning'
    } else {
      alertLevel = 'normal'
    }

    return {
      anomalies: allAnomalies,
      summary,
      recommendations,
      alertLevel
    }
  }

  /**
   * Advanced forecasting with multiple models and confidence intervals
   * Requirements 8.1, 8.2, 8.3: Revenue forecasts, market conditions, seasonal patterns
   */
  async generateAdvancedForecasts(metricHistories: MetricHistory[]): Promise<{
    forecasts: Forecast[]
    ensemble: {
      metric: string
      predictions: ForecastPoint[]
      modelWeights: Record<string, number>
      confidence: number
    }[]
    marketConditions: {
      outlook: 'positive' | 'neutral' | 'negative'
      confidence: number
      factors: string[]
    }
    seasonalInsights: {
      hasSeasonality: boolean
      period?: number
      strength?: number
      nextPeak?: Date
      nextTrough?: Date
    }[]
  }> {
    const forecasts = metricHistories.map(history => {
      try {
        return this.analyticsService.generateForecast(history)
      } catch (error) {
        console.warn(`Failed to generate forecast for ${history.metric}:`, error)
        return null
      }
    }).filter(Boolean) as Forecast[]

    // Create ensemble forecasts by combining multiple models
    const ensemble = await this.createEnsembleForecasts(metricHistories)

    // Analyze market conditions based on forecast trends
    const marketConditions = this.analyzeMarketConditions(forecasts)

    // Extract seasonal insights
    const seasonalInsights = this.extractSeasonalInsights(metricHistories)

    return {
      forecasts,
      ensemble,
      marketConditions,
      seasonalInsights
    }
  }

  /**
   * Create ensemble forecasts by combining multiple models
   */
  private async createEnsembleForecasts(metricHistories: MetricHistory[]): Promise<{
    metric: string
    predictions: ForecastPoint[]
    modelWeights: Record<string, number>
    confidence: number
  }[]> {
    const ensembleForecasts = []

    for (const history of metricHistories) {
      try {
        const modelForecasts: { model: string; forecast: Forecast }[] = []

        // Generate forecasts with different models
        for (const model of this.config.forecasting.models) {
          try {
            const tempService = new AnalyticsService({
              ...this.config,
              forecasting: { ...this.config.forecasting, models: [model] }
            })
            const forecast = tempService.generateForecast(history)
            modelForecasts.push({ model, forecast })
          } catch (error) {
            console.warn(`Model ${model} failed for ${history.metric}:`, error)
          }
        }

        if (modelForecasts.length === 0) continue

        // Calculate model weights based on accuracy
        const totalAccuracy = modelForecasts.reduce((sum, mf) => sum + mf.forecast.accuracy, 0)
        const modelWeights: Record<string, number> = {}
        modelForecasts.forEach(mf => {
          modelWeights[mf.model] = mf.forecast.accuracy / totalAccuracy
        })

        // Create ensemble predictions
        const maxPredictions = Math.max(...modelForecasts.map(mf => mf.forecast.predictions.length))
        const ensemblePredictions: ForecastPoint[] = []

        for (let i = 0; i < maxPredictions; i++) {
          const validPredictions = modelForecasts
            .filter(mf => mf.forecast.predictions[i])
            .map(mf => ({ ...mf.forecast.predictions[i], weight: modelWeights[mf.model] }))

          if (validPredictions.length === 0) continue

          const weightedValue = validPredictions.reduce(
            (sum, pred) => sum + pred.predictedValue * pred.weight, 0
          )
          const weightedConfidence = validPredictions.reduce(
            (sum, pred) => sum + pred.confidence * pred.weight, 0
          )

          // Calculate ensemble confidence interval
          const values = validPredictions.map(p => p.predictedValue)
          const mean = weightedValue
          const variance = validPredictions.reduce(
            (sum, pred) => sum + pred.weight * Math.pow(pred.predictedValue - mean, 2), 0
          )
          const stdDev = Math.sqrt(variance)

          ensemblePredictions.push({
            timestamp: validPredictions[0].timestamp,
            predictedValue: Math.max(0, weightedValue), // Ensure non-negative predictions
            confidence: weightedConfidence,
            confidenceInterval: {
              lower: Math.max(0, weightedValue - 2 * stdDev),
              upper: Math.max(0, weightedValue + 2 * stdDev)
            }
          })
        }

        const overallConfidence = modelForecasts.reduce(
          (sum, mf) => sum + mf.forecast.accuracy * modelWeights[mf.model], 0
        )

        ensembleForecasts.push({
          metric: history.metric,
          predictions: ensemblePredictions,
          modelWeights,
          confidence: overallConfidence
        })

      } catch (error) {
        console.warn(`Failed to create ensemble for ${history.metric}:`, error)
      }
    }

    return ensembleForecasts
  }

  /**
   * Analyze market conditions based on forecast trends
   * Requirement 8.2: Market condition impact predictions
   */
  private analyzeMarketConditions(forecasts: Forecast[]): {
    outlook: 'positive' | 'neutral' | 'negative'
    confidence: number
    factors: string[]
  } {
    const factors: string[] = []
    let positiveSignals = 0
    let negativeSignals = 0
    let totalConfidence = 0

    forecasts.forEach(forecast => {
      if (forecast.accuracy < 0.5) return // Skip low-accuracy forecasts

      const nearTermPredictions = forecast.predictions.slice(0, 5)
      const currentValue = nearTermPredictions[0]?.predictedValue || 0
      const futureValue = nearTermPredictions[nearTermPredictions.length - 1]?.predictedValue || 0
      
      if (currentValue > 0) {
        const changePercent = ((futureValue - currentValue) / currentValue) * 100

        if (changePercent > 5) {
          positiveSignals++
          factors.push(`${forecast.metric} forecasted to grow ${changePercent.toFixed(1)}%`)
        } else if (changePercent < -5) {
          negativeSignals++
          factors.push(`${forecast.metric} forecasted to decline ${Math.abs(changePercent).toFixed(1)}%`)
        }

        totalConfidence += forecast.accuracy
      }
    })

    const avgConfidence = forecasts.length > 0 ? totalConfidence / forecasts.length : 0
    
    let outlook: 'positive' | 'neutral' | 'negative'
    if (positiveSignals > negativeSignals && positiveSignals > 0) {
      outlook = 'positive'
    } else if (negativeSignals > positiveSignals && negativeSignals > 0) {
      outlook = 'negative'
    } else {
      outlook = 'neutral'
    }

    return {
      outlook,
      confidence: avgConfidence,
      factors
    }
  }

  /**
   * Extract seasonal insights from metric histories
   * Requirement 8.3: Seasonal pattern incorporation
   */
  private extractSeasonalInsights(metricHistories: MetricHistory[]): {
    hasSeasonality: boolean
    period?: number
    strength?: number
    nextPeak?: Date
    nextTrough?: Date
  }[] {
    return metricHistories.map(history => {
      const values = history.data.map(d => d.value)
      
      if (values.length < 14) {
        return { hasSeasonality: false }
      }

      // Detect seasonal period using autocorrelation
      const period = this.detectSeasonalPeriod(values)
      const seasonalStrength = this.calculateSeasonalStrength(values, period)

      if (seasonalStrength < 0.3) {
        return { hasSeasonality: false }
      }

      // Find peaks and troughs in seasonal pattern
      const { nextPeak, nextTrough } = this.predictSeasonalExtremes(history.data, period)

      return {
        hasSeasonality: true,
        period,
        strength: seasonalStrength,
        nextPeak,
        nextTrough
      }
    })
  }

  private detectSeasonalPeriod(values: number[]): number {
    const maxPeriod = Math.min(Math.floor(values.length / 3), 30)
    let bestPeriod = 7 // Default weekly
    let bestCorrelation = 0

    for (let period = 2; period <= maxPeriod; period++) {
      const correlation = this.calculateAutocorrelation(values, period)
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    return bestPeriod
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0

    const n = values.length - lag
    const mean1 = values.slice(0, n).reduce((sum, val) => sum + val, 0) / n
    const mean2 = values.slice(lag).reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let denominator1 = 0
    let denominator2 = 0

    for (let i = 0; i < n; i++) {
      const diff1 = values[i] - mean1
      const diff2 = values[i + lag] - mean2
      numerator += diff1 * diff2
      denominator1 += diff1 * diff1
      denominator2 += diff2 * diff2
    }

    const denominator = Math.sqrt(denominator1 * denominator2)
    return denominator === 0 ? 0 : numerator / denominator
  }

  private calculateSeasonalStrength(values: number[], period: number): number {
    if (values.length < period * 2) return 0

    // Simple seasonal strength calculation
    const seasonalMeans = new Array(period).fill(0)
    const seasonalCounts = new Array(period).fill(0)

    values.forEach((value, index) => {
      const seasonalIndex = index % period
      seasonalMeans[seasonalIndex] += value
      seasonalCounts[seasonalIndex]++
    })

    for (let i = 0; i < period; i++) {
      seasonalMeans[i] = seasonalCounts[i] > 0 ? seasonalMeans[i] / seasonalCounts[i] : 0
    }

    const overallMean = values.reduce((sum, val) => sum + val, 0) / values.length
    const seasonalVariance = seasonalMeans.reduce(
      (sum, mean) => sum + Math.pow(mean - overallMean, 2), 0
    ) / period

    const totalVariance = values.reduce(
      (sum, val) => sum + Math.pow(val - overallMean, 2), 0
    ) / values.length

    return totalVariance === 0 ? 0 : Math.min(1, seasonalVariance / totalVariance)
  }

  private predictSeasonalExtremes(data: BusinessMetric[], period: number): {
    nextPeak?: Date
    nextTrough?: Date
  } {
    if (data.length < period) return {}

    // Find seasonal pattern
    const seasonalValues = new Array(period).fill(0)
    const seasonalCounts = new Array(period).fill(0)

    data.forEach((point, index) => {
      const seasonalIndex = index % period
      seasonalValues[seasonalIndex] += point.value
      seasonalCounts[seasonalIndex]++
    })

    for (let i = 0; i < period; i++) {
      seasonalValues[i] = seasonalCounts[i] > 0 ? seasonalValues[i] / seasonalCounts[i] : 0
    }

    // Find peak and trough indices
    let peakIndex = 0
    let troughIndex = 0
    let maxValue = seasonalValues[0]
    let minValue = seasonalValues[0]

    seasonalValues.forEach((value, index) => {
      if (value > maxValue) {
        maxValue = value
        peakIndex = index
      }
      if (value < minValue) {
        minValue = value
        troughIndex = index
      }
    })

    // Calculate next peak and trough dates
    const lastDate = data[data.length - 1].timestamp
    const daysBetweenPoints = period > data.length ? 1 : Math.floor(
      (data[data.length - 1].timestamp.getTime() - data[0].timestamp.getTime()) / 
      (data.length - 1) / (24 * 60 * 60 * 1000)
    )

    const currentSeasonalIndex = (data.length - 1) % period
    
    const daysToNextPeak = peakIndex > currentSeasonalIndex 
      ? (peakIndex - currentSeasonalIndex) * daysBetweenPoints
      : (period - currentSeasonalIndex + peakIndex) * daysBetweenPoints

    const daysToNextTrough = troughIndex > currentSeasonalIndex
      ? (troughIndex - currentSeasonalIndex) * daysBetweenPoints
      : (period - currentSeasonalIndex + troughIndex) * daysBetweenPoints

    return {
      nextPeak: new Date(lastDate.getTime() + daysToNextPeak * 24 * 60 * 60 * 1000),
      nextTrough: new Date(lastDate.getTime() + daysToNextTrough * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Generate comprehensive actionable recommendations
   * Enhanced recommendation engine with business context
   */
  async generateActionableRecommendations(
    trends: TrendAnalysis[],
    anomalies: AnomalyDetection[],
    forecasts: Forecast[]
  ): Promise<{
    recommendations: Recommendation[]
    priorityActions: string[]
    businessImpact: {
      revenue: number
      risk: number
      opportunity: number
    }
    timeline: {
      immediate: string[]
      shortTerm: string[]
      longTerm: string[]
    }
  }> {
    const recommendations = this.analyticsService.generateRecommendations(trends, anomalies, forecasts)
    
    // Extract priority actions
    const priorityActions = recommendations
      .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
      .slice(0, 5)
      .map(rec => rec.title)

    // Estimate business impact
    const businessImpact = this.estimateBusinessImpact(recommendations, forecasts)

    // Organize by timeline
    const timeline = this.organizeByTimeline(recommendations)

    return {
      recommendations,
      priorityActions,
      businessImpact,
      timeline
    }
  }

  private estimateBusinessImpact(recommendations: Recommendation[], forecasts: Forecast[]): {
    revenue: number
    risk: number
    opportunity: number
  } {
    let revenueImpact = 0
    let riskScore = 0
    let opportunityScore = 0

    recommendations.forEach(rec => {
      const impactMultiplier = { low: 1, medium: 2, high: 3 }[rec.impact]
      const confidenceWeight = rec.confidence

      if (rec.category === 'risk_mitigation') {
        riskScore += impactMultiplier * confidenceWeight * 10
      } else if (rec.category === 'opportunity') {
        opportunityScore += impactMultiplier * confidenceWeight * 10
        if (rec.estimatedValue) {
          revenueImpact += rec.estimatedValue * confidenceWeight
        }
      }
    })

    // Estimate revenue impact from forecasts
    const revenueForecasts = forecasts.filter(f => f.metric.toLowerCase().includes('revenue'))
    revenueForecasts.forEach(forecast => {
      const nearTermPredictions = forecast.predictions.slice(0, 7)
      const avgPredicted = nearTermPredictions.reduce((sum, p) => sum + p.predictedValue, 0) / nearTermPredictions.length
      revenueImpact += avgPredicted * forecast.accuracy * 0.1 // 10% potential impact
    })

    return {
      revenue: Math.round(revenueImpact),
      risk: Math.min(100, Math.round(riskScore)),
      opportunity: Math.min(100, Math.round(opportunityScore))
    }
  }

  private organizeByTimeline(recommendations: Recommendation[]): {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  } {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []

    recommendations.forEach(rec => {
      const timeframe = rec.timeframe?.toLowerCase() || ''
      
      if (rec.priority === 'critical' || timeframe.includes('immediate') || timeframe.includes('urgent')) {
        immediate.push(rec.title)
      } else if (timeframe.includes('week') || timeframe.includes('short')) {
        shortTerm.push(rec.title)
      } else {
        longTerm.push(rec.title)
      }
    })

    return { immediate, shortTerm, longTerm }
  }

  /**
   * Comprehensive analytics dashboard data
   * Combines all analytics capabilities into a single dashboard view
   */
  async generateDashboardInsights(metricHistories: MetricHistory[]): Promise<{
    summary: {
      totalMetrics: number
      trendsAnalyzed: number
      anomaliesDetected: number
      forecastsGenerated: number
      recommendationsCount: number
    }
    trends: TrendAnalysis[]
    anomalies: AnomalyDetection[]
    forecasts: Forecast[]
    recommendations: Recommendation[]
    marketOutlook: {
      outlook: 'positive' | 'neutral' | 'negative'
      confidence: number
      factors: string[]
    }
    riskAssessment: {
      level: 'low' | 'medium' | 'high' | 'critical'
      factors: string[]
      mitigation: string[]
    }
    insights: AnalyticsInsight[]
  }> {
    // Generate all analytics components
    const trendAnalysis = await this.analyzeTrendsWithInsights(metricHistories)
    const anomalyAnalysis = await this.detectAnomaliesWithContext(metricHistories)
    const forecastAnalysis = await this.generateAdvancedForecasts(metricHistories)
    const recommendations = await this.generateActionableRecommendations(
      trendAnalysis.trends,
      anomalyAnalysis.anomalies,
      forecastAnalysis.forecasts
    )

    // Generate comprehensive insights
    const insights = await this.analyticsService.generateInsights(metricHistories)

    return {
      summary: {
        totalMetrics: metricHistories.length,
        trendsAnalyzed: trendAnalysis.trends.length,
        anomaliesDetected: anomalyAnalysis.anomalies.length,
        forecastsGenerated: forecastAnalysis.forecasts.length,
        recommendationsCount: recommendations.recommendations.length
      },
      trends: trendAnalysis.trends,
      anomalies: anomalyAnalysis.anomalies,
      forecasts: forecastAnalysis.forecasts,
      recommendations: recommendations.recommendations,
      marketOutlook: forecastAnalysis.marketConditions,
      riskAssessment: trendAnalysis.riskAssessment,
      insights
    }
  }
}

export const predictiveAnalyticsSystem = new PredictiveAnalyticsSystem()