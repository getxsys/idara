import { BusinessMetric, MetricHistory } from '@/types/analytics'

/**
 * Generate mock business metrics data for testing analytics
 */
export class MockAnalyticsDataService {
  /**
   * Generate time series data with various patterns
   */
  static generateMetricHistory(
    metricName: string,
    category: BusinessMetric['category'],
    days: number = 30,
    pattern: 'increasing' | 'decreasing' | 'stable' | 'seasonal' | 'volatile' = 'stable'
  ): MetricHistory {
    const data: BusinessMetric[] = []
    const now = new Date()
    const baseValue = this.getBaseValueForCategory(category)

    for (let i = days - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      let value = baseValue

      // Apply pattern
      switch (pattern) {
        case 'increasing':
          value = baseValue + (days - i) * (baseValue * 0.02) + this.addNoise(baseValue * 0.1)
          break
        case 'decreasing':
          value = baseValue - (days - i) * (baseValue * 0.015) + this.addNoise(baseValue * 0.1)
          break
        case 'seasonal':
          value = baseValue + Math.sin((days - i) * 0.2) * (baseValue * 0.3) + this.addNoise(baseValue * 0.05)
          break
        case 'volatile':
          value = baseValue + this.addNoise(baseValue * 0.4)
          break
        case 'stable':
        default:
          value = baseValue + this.addNoise(baseValue * 0.05)
          break
      }

      // Ensure positive values
      value = Math.max(value, baseValue * 0.1)

      data.push({
        id: `${metricName}-${timestamp.getTime()}`,
        name: metricName,
        value: Math.round(value * 100) / 100,
        timestamp,
        category,
        unit: this.getUnitForCategory(category)
      })
    }

    return {
      metric: metricName,
      data,
      aggregation: 'daily'
    }
  }

  /**
   * Generate metric history with anomalies
   */
  static generateMetricHistoryWithAnomalies(
    metricName: string,
    category: BusinessMetric['category'],
    days: number = 30
  ): MetricHistory {
    const history = this.generateMetricHistory(metricName, category, days, 'stable')
    
    // Inject anomalies at random points
    const anomalyCount = Math.floor(days * 0.1) // 10% of days have anomalies
    const anomalyIndices = new Set<number>()
    
    while (anomalyIndices.size < anomalyCount) {
      anomalyIndices.add(Math.floor(Math.random() * days))
    }

    anomalyIndices.forEach(index => {
      if (history.data[index]) {
        const originalValue = history.data[index].value
        const anomalyType = Math.random() > 0.5 ? 'spike' : 'drop'
        const multiplier = anomalyType === 'spike' ? (2 + Math.random() * 2) : (0.2 + Math.random() * 0.3)
        
        history.data[index].value = originalValue * multiplier
      }
    })

    return history
  }

  /**
   * Generate multiple metric histories for comprehensive testing
   */
  static generateSampleMetricHistories(): MetricHistory[] {
    return [
      this.generateMetricHistory('Monthly Revenue', 'revenue', 60, 'increasing'),
      this.generateMetricHistory('Conversion Rate', 'conversion', 45, 'stable'),
      this.generateMetricHistory('Customer Satisfaction', 'satisfaction', 30, 'seasonal'),
      this.generateMetricHistory('Page Load Time', 'performance', 30, 'decreasing'),
      this.generateMetricHistory('User Engagement', 'engagement', 40, 'volatile'),
      this.generateMetricHistoryWithAnomalies('Daily Active Users', 'engagement', 35),
      this.generateMetricHistoryWithAnomalies('Error Rate', 'performance', 25)
    ]
  }

  private static getBaseValueForCategory(category: BusinessMetric['category']): number {
    switch (category) {
      case 'revenue':
        return 50000 + Math.random() * 100000
      case 'conversion':
        return 2 + Math.random() * 8 // 2-10%
      case 'satisfaction':
        return 7 + Math.random() * 2 // 7-9 out of 10
      case 'performance':
        return 100 + Math.random() * 500 // 100-600ms
      case 'engagement':
        return 1000 + Math.random() * 5000 // 1000-6000 users
      default:
        return 100 + Math.random() * 900
    }
  }

  private static getUnitForCategory(category: BusinessMetric['category']): string {
    switch (category) {
      case 'revenue':
        return '$'
      case 'conversion':
        return '%'
      case 'satisfaction':
        return '/10'
      case 'performance':
        return 'ms'
      case 'engagement':
        return 'users'
      default:
        return ''
    }
  }

  private static addNoise(amplitude: number): number {
    return (Math.random() - 0.5) * 2 * amplitude
  }

  /**
   * Generate real-time metric updates
   */
  static generateRealtimeUpdate(metric: BusinessMetric): BusinessMetric {
    const variation = 0.1 // 10% variation
    const change = (Math.random() - 0.5) * 2 * variation
    const newValue = metric.value * (1 + change)

    return {
      ...metric,
      id: `${metric.name}-${Date.now()}`,
      value: Math.max(newValue, metric.value * 0.1), // Ensure positive
      timestamp: new Date()
    }
  }
}