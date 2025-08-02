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

export class AnalyticsService {
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
        horizon: 7,
        updateFrequency: 24,
        models: ['linear', 'exponential', 'seasonal', 'arima'],
        ...config?.forecasting
      },
      recommendations: {
        enabled: true,
        maxRecommendations: 5,
        minConfidence: 0.6,
        ...config?.recommendations
      }
    }
  }

  /**
   * Analyze trends in business metrics using linear regression
   */
  analyzeTrend(history: MetricHistory): TrendAnalysis {
    const data = history.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    if (data.length < 2) {
      throw new Error('Insufficient data for trend analysis')
    }

    // Convert timestamps to numeric values for regression
    const startTime = data[0].timestamp.getTime()
    const x = data.map((point, index) => index)
    const y = data.map(point => point.value)

    // Calculate linear regression
    const n = data.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
    const ssResidual = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(val - predicted, 2)
    }, 0)
    const r2 = 1 - (ssResidual / ssTotal)

    // Determine trend direction and strength
    let trend: TrendAnalysis['trend']
    const absSlope = Math.abs(slope)
    const strength = Math.min(r2, 1)

    if (absSlope < 0.1) {
      trend = 'stable'
    } else if (r2 < 0.3) {
      trend = 'volatile'
    } else if (slope > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }

    return {
      metric: history.metric,
      trend,
      strength,
      slope,
      r2,
      period: history.aggregation,
      dataPoints: n,
      startDate: data[0].timestamp,
      endDate: data[data.length - 1].timestamp
    }
  }

  /**
   * Detect anomalies using statistical methods
   */
  detectAnomalies(history: MetricHistory): AnomalyDetection[] {
    const data = history.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    if (data.length < this.config.anomalyDetection.minDataPoints) {
      return []
    }

    const values = data.map(point => point.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Calculate moving average and standard deviation
    const windowSize = Math.min(7, Math.floor(data.length / 3))
    const anomalies: AnomalyDetection[] = []

    for (let i = windowSize; i < data.length; i++) {
      const window = values.slice(i - windowSize, i)
      const windowMean = window.reduce((sum, val) => sum + val, 0) / window.length
      const windowStdDev = Math.sqrt(
        window.reduce((sum, val) => sum + Math.pow(val - windowMean, 2), 0) / window.length
      )

      const currentValue = values[i]
      const zScore = Math.abs((currentValue - windowMean) / (windowStdDev || 1))
      
      // Sensitivity thresholds
      const thresholds = {
        low: 2.0,
        medium: 1.5,
        high: 1.0
      }
      
      const threshold = thresholds[this.config.anomalyDetection.sensitivity]
      
      if (zScore > threshold) {
        let severity: AnomalyDetection['severity']
        let type: AnomalyDetection['type']
        
        if (zScore > 3) severity = 'critical'
        else if (zScore > 2.5) severity = 'high'
        else if (zScore > 2) severity = 'medium'
        else severity = 'low'

        if (currentValue > windowMean + 2 * windowStdDev) {
          type = 'spike'
        } else if (currentValue < windowMean - 2 * windowStdDev) {
          type = 'drop'
        } else {
          type = 'outlier'
        }

        anomalies.push({
          timestamp: data[i].timestamp,
          value: currentValue,
          expectedValue: windowMean,
          deviation: Math.abs(currentValue - windowMean),
          severity,
          confidence: Math.min(zScore / 3, 1),
          type,
          description: `${type} detected: ${currentValue.toFixed(2)} vs expected ${windowMean.toFixed(2)}`
        })
      }
    }

    return anomalies
  }

  /**
   * Generate forecasts using multiple models
   */
  generateForecast(history: MetricHistory): Forecast {
    const data = history.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    if (data.length < 5) {
      throw new Error('Insufficient data for forecasting')
    }

    const values = data.map(point => point.value)
    const timestamps = data.map(point => point.timestamp.getTime())
    
    // Try different models and select the best one
    const models = this.config.forecasting.models
    let bestModel = 'linear'
    let bestAccuracy = 0
    let bestPredictions: ForecastPoint[] = []

    for (const model of models) {
      try {
        const { predictions, accuracy } = this.runForecastModel(model, data, this.config.forecasting.horizon)
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy
          bestModel = model as any
          bestPredictions = predictions
        }
      } catch (error) {
        console.warn(`Failed to run ${model} model:`, error)
      }
    }

    // Calculate error metrics
    const mape = this.calculateMAPE(data.slice(-Math.min(10, data.length)), bestPredictions.slice(0, Math.min(10, bestPredictions.length)))
    const rmse = this.calculateRMSE(data.slice(-Math.min(10, data.length)), bestPredictions.slice(0, Math.min(10, bestPredictions.length)))

    return {
      metric: history.metric,
      model: bestModel,
      predictions: bestPredictions,
      accuracy: bestAccuracy,
      mape,
      rmse,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + this.config.forecasting.updateFrequency * 60 * 60 * 1000)
    }
  }

  private runForecastModel(model: string, data: BusinessMetric[], horizon: number): { predictions: ForecastPoint[], accuracy: number } {
    const values = data.map(point => point.value)
    const timestamps = data.map(point => point.timestamp.getTime())
    const lastTimestamp = timestamps[timestamps.length - 1]
    
    // Calculate time interval
    const timeInterval = timestamps.length > 1 ? 
      (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1) : 
      24 * 60 * 60 * 1000 // Default to 1 day

    const predictions: ForecastPoint[] = []

    switch (model) {
      case 'linear': {
        const trend = this.analyzeTrend({ metric: 'temp', data, aggregation: 'daily' })
        
        for (let i = 1; i <= horizon; i++) {
          const futureTimestamp = new Date(lastTimestamp + i * timeInterval)
          const predictedValue = values[values.length - 1] + trend.slope * i
          const confidence = Math.max(0.3, trend.r2 * (1 - i * 0.1)) // Decrease confidence over time
          
          predictions.push({
            timestamp: futureTimestamp,
            predictedValue,
            confidenceInterval: {
              lower: predictedValue * (1 - (1 - confidence) * 0.5),
              upper: predictedValue * (1 + (1 - confidence) * 0.5)
            },
            confidence
          })
        }
        
        return { predictions, accuracy: trend.r2 }
      }

      case 'exponential': {
        // Simple exponential smoothing
        const alpha = 0.3 // Smoothing parameter
        let smoothedValue = values[0]
        
        // Calculate smoothed values
        for (let i = 1; i < values.length; i++) {
          smoothedValue = alpha * values[i] + (1 - alpha) * smoothedValue
        }

        // Calculate trend
        const recentValues = values.slice(-5)
        const growthRate = recentValues.length > 1 ? 
          Math.pow(recentValues[recentValues.length - 1] / recentValues[0], 1 / (recentValues.length - 1)) - 1 : 0

        for (let i = 1; i <= horizon; i++) {
          const futureTimestamp = new Date(lastTimestamp + i * timeInterval)
          const predictedValue = smoothedValue * Math.pow(1 + growthRate, i)
          const confidence = Math.max(0.2, 0.8 * Math.exp(-i * 0.1))
          
          predictions.push({
            timestamp: futureTimestamp,
            predictedValue,
            confidenceInterval: {
              lower: predictedValue * (1 - (1 - confidence) * 0.6),
              upper: predictedValue * (1 + (1 - confidence) * 0.6)
            },
            confidence
          })
        }

        // Calculate accuracy based on recent predictions vs actual
        const accuracy = this.calculateExponentialAccuracy(values, alpha)
        return { predictions, accuracy }
      }

      case 'seasonal': {
        // Seasonal decomposition and forecasting
        const seasonalPeriod = this.detectSeasonalPeriod(values)
        const { trend: trendComponent, seasonal, residual } = this.decomposeTimeSeries(values, seasonalPeriod)
        
        for (let i = 1; i <= horizon; i++) {
          const futureTimestamp = new Date(lastTimestamp + i * timeInterval)
          const trendValue = this.extrapolateTrend(trendComponent, i)
          const seasonalValue = seasonal[(values.length + i - 1) % seasonalPeriod] || 0
          const predictedValue = trendValue + seasonalValue
          
          // Calculate confidence based on residual variance
          const residualVariance = this.calculateVariance(residual)
          const confidence = Math.max(0.2, 0.9 * Math.exp(-i * 0.05) * Math.exp(-residualVariance * 0.1))
          
          predictions.push({
            timestamp: futureTimestamp,
            predictedValue: Math.max(0, predictedValue),
            confidenceInterval: {
              lower: Math.max(0, predictedValue - 2 * Math.sqrt(residualVariance)),
              upper: predictedValue + 2 * Math.sqrt(residualVariance)
            },
            confidence
          })
        }

        const accuracy = this.calculateSeasonalAccuracy(values, seasonalPeriod)
        return { predictions, accuracy }
      }

      case 'arima': {
        // Simplified ARIMA(1,1,1) implementation
        const { ar, ma, accuracy } = this.fitARIMA(values)
        const differenced = this.difference(values)
        
        let lastDiff = differenced[differenced.length - 1] || 0
        let lastValue = values[values.length - 1] || 0
        let lastError = 0

        for (let i = 1; i <= horizon; i++) {
          const futureTimestamp = new Date(lastTimestamp + i * timeInterval)
          
          // ARIMA prediction: next_diff = ar * last_diff + ma * last_error
          const predictedDiff = ar * lastDiff + ma * lastError
          const predictedValue = lastValue + predictedDiff
          
          const confidence = Math.max(0.2, accuracy * Math.exp(-i * 0.1))
          
          predictions.push({
            timestamp: futureTimestamp,
            predictedValue: Math.max(0, predictedValue),
            confidenceInterval: {
              lower: Math.max(0, predictedValue * (1 - (1 - confidence) * 0.4)),
              upper: predictedValue * (1 + (1 - confidence) * 0.4)
            },
            confidence
          })

          // Update for next iteration
          lastDiff = predictedDiff
          lastValue = predictedValue
          lastError = predictedDiff * 0.1 // Simplified error estimation
        }

        return { predictions, accuracy }
      }

      default:
        throw new Error(`Unknown model: ${model}`)
    }
  }

  private calculateExponentialAccuracy(values: number[], alpha: number): number {
    if (values.length < 3) return 0.5

    let smoothedValue = values[0]
    let totalError = 0
    
    for (let i = 1; i < values.length; i++) {
      const predicted = smoothedValue
      const actual = values[i]
      totalError += Math.abs(actual - predicted) / Math.max(actual, 1)
      smoothedValue = alpha * actual + (1 - alpha) * smoothedValue
    }

    const mape = totalError / (values.length - 1)
    return Math.max(0, 1 - mape)
  }

  private calculateMAPE(actual: BusinessMetric[], predicted: ForecastPoint[]): number {
    if (actual.length === 0 || predicted.length === 0) return 0

    const minLength = Math.min(actual.length, predicted.length)
    let totalError = 0

    for (let i = 0; i < minLength; i++) {
      const actualValue = actual[i].value
      const predictedValue = predicted[i].predictedValue
      if (actualValue !== 0) {
        totalError += Math.abs((actualValue - predictedValue) / actualValue)
      }
    }

    return (totalError / minLength) * 100
  }

  private calculateRMSE(actual: BusinessMetric[], predicted: ForecastPoint[]): number {
    if (actual.length === 0 || predicted.length === 0) return 0

    const minLength = Math.min(actual.length, predicted.length)
    let sumSquaredErrors = 0

    for (let i = 0; i < minLength; i++) {
      const error = actual[i].value - predicted[i].predictedValue
      sumSquaredErrors += error * error
    }

    return Math.sqrt(sumSquaredErrors / minLength)
  }

  /**
   * Generate actionable recommendations based on analytics
   */
  generateRecommendations(
    trends: TrendAnalysis[],
    anomalies: AnomalyDetection[],
    forecasts: Forecast[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Analyze trends for recommendations
    trends.forEach(trend => {
      if (trend.strength > 0.7) {
        if (trend.trend === 'decreasing' && trend.slope < -0.5) {
          recommendations.push({
            id: `trend-${trend.metric}-decline`,
            title: `Declining ${trend.metric} Trend Detected`,
            description: `${trend.metric} has been declining with high confidence (${(trend.strength * 100).toFixed(1)}%). Immediate action may be required.`,
            priority: 'high',
            category: 'risk_mitigation',
            confidence: trend.strength,
            impact: 'high',
            effort: 'medium',
            suggestedActions: [
              `Investigate root causes of ${trend.metric} decline`,
              'Review recent changes in processes or market conditions',
              'Implement corrective measures based on findings',
              'Monitor closely for improvement'
            ],
            relatedMetrics: [trend.metric],
            timeframe: '1-2 weeks',
            createdAt: new Date()
          })
        } else if (trend.trend === 'increasing' && trend.slope > 0.5) {
          recommendations.push({
            id: `trend-${trend.metric}-growth`,
            title: `Strong Growth in ${trend.metric}`,
            description: `${trend.metric} shows strong positive trend. Consider scaling successful strategies.`,
            priority: 'medium',
            category: 'opportunity',
            confidence: trend.strength,
            impact: 'medium',
            effort: 'low',
            suggestedActions: [
              'Analyze factors contributing to growth',
              'Scale successful strategies',
              'Allocate additional resources to maintain momentum',
              'Document best practices for replication'
            ],
            relatedMetrics: [trend.metric],
            timeframe: '2-4 weeks',
            createdAt: new Date()
          })
        }
      }
    })

    // Analyze anomalies for recommendations
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high')
    if (criticalAnomalies.length > 0) {
      recommendations.push({
        id: 'anomalies-critical',
        title: 'Critical Anomalies Detected',
        description: `${criticalAnomalies.length} critical anomalies detected across metrics. Immediate investigation recommended.`,
        priority: 'critical',
        category: 'risk_mitigation',
        confidence: Math.max(...criticalAnomalies.map(a => a.confidence)),
        impact: 'high',
        effort: 'high',
        suggestedActions: [
          'Investigate all critical anomalies immediately',
          'Check for system issues or data quality problems',
          'Implement monitoring alerts for similar patterns',
          'Review and update anomaly detection thresholds'
        ],
        relatedMetrics: [...new Set(criticalAnomalies.map(a => 'anomaly'))],
        timeframe: 'Immediate',
        createdAt: new Date()
      })
    }

    // Analyze forecasts for recommendations
    forecasts.forEach(forecast => {
      const nearTermPredictions = forecast.predictions.slice(0, 3)
      const avgPredicted = nearTermPredictions.reduce((sum, p) => sum + p.predictedValue, 0) / nearTermPredictions.length
      const avgConfidence = nearTermPredictions.reduce((sum, p) => sum + p.confidence, 0) / nearTermPredictions.length

      if (avgConfidence > 0.7) {
        const currentValue = forecast.predictions[0]?.predictedValue || 0
        const futureValue = nearTermPredictions[nearTermPredictions.length - 1]?.predictedValue || 0
        const changePercent = currentValue !== 0 ? ((futureValue - currentValue) / currentValue) * 100 : 0

        if (Math.abs(changePercent) > 10) {
          recommendations.push({
            id: `forecast-${forecast.metric}-change`,
            title: `Significant ${forecast.metric} Change Predicted`,
            description: `Forecast indicates ${changePercent > 0 ? 'increase' : 'decrease'} of ${Math.abs(changePercent).toFixed(1)}% in ${forecast.metric} over next few periods.`,
            priority: Math.abs(changePercent) > 20 ? 'high' : 'medium',
            category: changePercent > 0 ? 'opportunity' : 'risk_mitigation',
            confidence: avgConfidence,
            impact: Math.abs(changePercent) > 20 ? 'high' : 'medium',
            effort: 'medium',
            suggestedActions: [
              changePercent > 0 ? 'Prepare to capitalize on predicted growth' : 'Prepare mitigation strategies for predicted decline',
              'Adjust resource allocation based on forecast',
              'Monitor actual vs predicted values closely',
              'Update forecasting models with new data'
            ],
            relatedMetrics: [forecast.metric],
            estimatedValue: Math.abs(changePercent),
            timeframe: '1-3 weeks',
            createdAt: new Date()
          })
        }
      }
    })

    // Filter and sort recommendations
    return recommendations
      .filter(rec => rec.confidence >= this.config.recommendations.minConfidence)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence
      })
      .slice(0, this.config.recommendations.maxRecommendations)
  }

  // Helper methods for advanced forecasting models
  private detectSeasonalPeriod(values: number[]): number {
    // Simple seasonal period detection using autocorrelation
    const maxPeriod = Math.min(Math.floor(values.length / 3), 12)
    let bestPeriod = 7 // Default weekly seasonality
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

  private decomposeTimeSeries(values: number[], period: number): { trend: number[], seasonal: number[], residual: number[] } {
    const trend: number[] = []
    const seasonal: number[] = new Array(period).fill(0)
    const residual: number[] = []

    // Calculate trend using moving average
    const halfPeriod = Math.floor(period / 2)
    for (let i = 0; i < values.length; i++) {
      if (i < halfPeriod || i >= values.length - halfPeriod) {
        trend.push(values[i]) // Use original value at boundaries
      } else {
        const start = i - halfPeriod
        const end = i + halfPeriod + 1
        const sum = values.slice(start, end).reduce((sum, val) => sum + val, 0)
        trend.push(sum / (end - start))
      }
    }

    // Calculate seasonal component
    const seasonalSums = new Array(period).fill(0)
    const seasonalCounts = new Array(period).fill(0)

    for (let i = 0; i < values.length; i++) {
      const seasonalIndex = i % period
      const detrended = values[i] - trend[i]
      seasonalSums[seasonalIndex] += detrended
      seasonalCounts[seasonalIndex]++
    }

    for (let i = 0; i < period; i++) {
      seasonal[i] = seasonalCounts[i] > 0 ? seasonalSums[i] / seasonalCounts[i] : 0
    }

    // Calculate residual
    for (let i = 0; i < values.length; i++) {
      const seasonalComponent = seasonal[i % period]
      residual.push(values[i] - trend[i] - seasonalComponent)
    }

    return { trend, seasonal, residual }
  }

  private extrapolateTrend(trendValues: number[], steps: number): number {
    if (trendValues.length < 2) return trendValues[trendValues.length - 1] || 0

    // Simple linear extrapolation
    const recentTrend = trendValues.slice(-5)
    const n = recentTrend.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = recentTrend

    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return slope * (n - 1 + steps) + intercept
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  }

  private calculateSeasonalAccuracy(values: number[], period: number): number {
    if (values.length < period * 2) return 0.5

    const { trend, seasonal, residual } = this.decomposeTimeSeries(values, period)
    const residualVariance = this.calculateVariance(residual)
    const totalVariance = this.calculateVariance(values)

    return Math.max(0, 1 - (residualVariance / totalVariance))
  }

  private fitARIMA(values: number[]): { ar: number, ma: number, accuracy: number } {
    // Simplified ARIMA parameter estimation
    const differenced = this.difference(values)
    
    if (differenced.length < 3) {
      return { ar: 0.5, ma: 0.3, accuracy: 0.5 }
    }

    // Estimate AR parameter using least squares
    let numerator = 0
    let denominator = 0
    
    for (let i = 1; i < differenced.length; i++) {
      numerator += differenced[i] * differenced[i - 1]
      denominator += differenced[i - 1] * differenced[i - 1]
    }
    
    const ar = denominator === 0 ? 0.5 : Math.max(-0.9, Math.min(0.9, numerator / denominator))
    
    // Simple MA parameter estimation
    const ma = 0.3 // Simplified constant
    
    // Calculate accuracy based on residuals
    const residuals: number[] = []
    for (let i = 1; i < differenced.length; i++) {
      const predicted = ar * differenced[i - 1]
      const residual = differenced[i] - predicted
      residuals.push(residual)
    }
    
    const residualVariance = this.calculateVariance(residuals)
    const dataVariance = this.calculateVariance(differenced)
    const accuracy = Math.max(0.2, 1 - (residualVariance / dataVariance))
    
    return { ar, ma, accuracy }
  }

  private difference(values: number[]): number[] {
    const result: number[] = []
    for (let i = 1; i < values.length; i++) {
      result.push(values[i] - values[i - 1])
    }
    return result
  }

  /**
   * Generate comprehensive analytics insights
   */
  async generateInsights(metricHistories: MetricHistory[]): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = []

    // Generate trends - filter out insufficient data
    const trends = metricHistories
      .filter(history => history.data.length >= 2)
      .map(history => {
        try {
          return this.analyzeTrend(history)
        } catch (error) {
          console.warn(`Failed to analyze trend for ${history.metric}:`, error)
          return null
        }
      })
      .filter(Boolean) as TrendAnalysis[]
    trends.forEach(trend => {
      if (trend.strength > 0.5) {
        insights.push({
          id: `trend-${trend.metric}-${Date.now()}`,
          type: 'trend',
          title: `${trend.metric} Trend Analysis`,
          summary: `${trend.metric} shows ${trend.trend} trend with ${(trend.strength * 100).toFixed(1)}% confidence`,
          data: trend,
          relevanceScore: trend.strength,
          createdAt: new Date()
        })
      }
    })

    // Generate anomalies
    const allAnomalies = metricHistories.flatMap(history => this.detectAnomalies(history))
    allAnomalies.forEach(anomaly => {
      if (anomaly.confidence > 0.6) {
        insights.push({
          id: `anomaly-${Date.now()}-${Math.random()}`,
          type: 'anomaly',
          title: `Anomaly Detected`,
          summary: `${anomaly.type} detected with ${anomaly.severity} severity`,
          data: anomaly,
          relevanceScore: anomaly.confidence,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        })
      }
    })

    // Generate forecasts
    const forecasts = metricHistories.map(history => {
      try {
        return this.generateForecast(history)
      } catch (error) {
        console.warn(`Failed to generate forecast for ${history.metric}:`, error)
        return null
      }
    }).filter(Boolean) as Forecast[]

    forecasts.forEach(forecast => {
      if (forecast.accuracy > 0.5) {
        insights.push({
          id: `forecast-${forecast.metric}-${Date.now()}`,
          type: 'forecast',
          title: `${forecast.metric} Forecast`,
          summary: `${forecast.predictions.length} day forecast with ${(forecast.accuracy * 100).toFixed(1)}% accuracy`,
          data: forecast,
          relevanceScore: forecast.accuracy,
          createdAt: new Date(),
          expiresAt: forecast.validUntil
        })
      }
    })

    // Generate recommendations
    const recommendations = this.generateRecommendations(trends, allAnomalies, forecasts)
    recommendations.forEach(recommendation => {
      insights.push({
        id: recommendation.id,
        type: 'recommendation',
        title: recommendation.title,
        summary: recommendation.description,
        data: recommendation,
        relevanceScore: recommendation.confidence,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })
    })

    // Sort by relevance and return
    return insights.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }
}

export const analyticsService = new AnalyticsService()