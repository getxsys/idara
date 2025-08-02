import { AnalyticsService } from './analytics-service'
import { MockAnalyticsDataService } from './mock-analytics-data'
import { MetricHistory, AnalyticsInsight } from '@/types/analytics'

/**
 * Example service demonstrating how to use the predictive analytics system
 * This shows practical implementation of the requirements:
 * - Requirement 1.3: Trend detection with actionable steps
 * - Requirement 8.1: Revenue forecasts with confidence intervals
 * - Requirement 8.2: Market condition impact predictions
 * - Requirement 8.3: Seasonal pattern incorporation
 */
export class PredictiveAnalyticsExample {
  private analyticsService: AnalyticsService

  constructor() {
    // Initialize with custom configuration for business needs
    this.analyticsService = new AnalyticsService({
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
   * Demonstrate comprehensive business analytics workflow
   */
  async demonstrateBusinessAnalytics(): Promise<{
    insights: AnalyticsInsight[]
    summary: string
  }> {
    console.log('🚀 Starting Predictive Analytics Demo...')

    // Generate sample business data
    const businessMetrics: MetricHistory[] = [
      // Revenue data with growth trend (Requirement 8.1)
      MockAnalyticsDataService.generateMetricHistory('Monthly Revenue', 'revenue', 90, 'increasing'),
      
      // Performance metrics with seasonal patterns (Requirement 8.3)
      MockAnalyticsDataService.generateMetricHistory('Website Performance', 'performance', 60, 'seasonal'),
      
      // Engagement metrics with volatility (market conditions impact - Requirement 8.2)
      MockAnalyticsDataService.generateMetricHistory('User Engagement', 'engagement', 45, 'volatile'),
      
      // Conversion metrics with anomalies
      MockAnalyticsDataService.generateMetricHistoryWithAnomalies('Conversion Rate', 'conversion', 30),
      
      // Customer satisfaction with declining trend
      MockAnalyticsDataService.generateMetricHistory('Customer Satisfaction', 'satisfaction', 40, 'decreasing')
    ]

    console.log(`📊 Analyzing ${businessMetrics.length} business metrics...`)

    // Generate comprehensive insights
    const insights = await this.analyticsService.generateInsights(businessMetrics)

    // Categorize insights by type
    const trendInsights = insights.filter(i => i.type === 'trend')
    const anomalyInsights = insights.filter(i => i.type === 'anomaly')
    const forecastInsights = insights.filter(i => i.type === 'forecast')
    const recommendationInsights = insights.filter(i => i.type === 'recommendation')

    console.log('📈 Analysis Results:')
    console.log(`  - ${trendInsights.length} trend insights`)
    console.log(`  - ${anomalyInsights.length} anomaly alerts`)
    console.log(`  - ${forecastInsights.length} forecasts`)
    console.log(`  - ${recommendationInsights.length} recommendations`)

    // Generate summary
    const summary = this.generateInsightsSummary(insights)

    return { insights, summary }
  }

  /**
   * Demonstrate specific forecasting capabilities (Requirement 8.1)
   */
  async demonstrateRevenueForecast(): Promise<void> {
    console.log('\n💰 Revenue Forecasting Demo...')

    const revenueData = MockAnalyticsDataService.generateMetricHistory(
      'Quarterly Revenue',
      'revenue',
      120, // 4 months of daily data
      'increasing'
    )

    const forecast = this.analyticsService.generateForecast(revenueData)

    console.log(`📊 Revenue Forecast Results:`)
    console.log(`  - Model: ${forecast.model}`)
    console.log(`  - Accuracy: ${(forecast.accuracy * 100).toFixed(1)}%`)
    console.log(`  - MAPE: ${forecast.mape.toFixed(1)}%`)
    console.log(`  - Predictions: ${forecast.predictions.length} days`)

    // Show first few predictions with confidence intervals
    console.log('\n🔮 Next 5 Days Revenue Forecast:')
    forecast.predictions.slice(0, 5).forEach((prediction, index) => {
      const date = prediction.timestamp.toLocaleDateString()
      const value = prediction.predictedValue.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      })
      const confidence = (prediction.confidence * 100).toFixed(0)
      const lower = prediction.confidenceInterval.lower.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      })
      const upper = prediction.confidenceInterval.upper.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      })
      
      console.log(`  Day ${index + 1} (${date}): ${value} (${confidence}% confidence, range: ${lower} - ${upper})`)
    })
  }

  /**
   * Demonstrate trend analysis with actionable insights (Requirement 1.3)
   */
  async demonstrateTrendAnalysis(): Promise<void> {
    console.log('\n📈 Trend Analysis Demo...')

    const metrics = [
      { name: 'Sales Growth', category: 'revenue' as const, pattern: 'increasing' as const },
      { name: 'Customer Churn', category: 'engagement' as const, pattern: 'decreasing' as const },
      { name: 'Support Tickets', category: 'performance' as const, pattern: 'volatile' as const }
    ]

    for (const metric of metrics) {
      const data = MockAnalyticsDataService.generateMetricHistory(
        metric.name,
        metric.category,
        45,
        metric.pattern
      )

      const trend = this.analyticsService.analyzeTrend(data)
      
      console.log(`\n📊 ${metric.name} Analysis:`)
      console.log(`  - Trend: ${trend.trend}`)
      console.log(`  - Strength: ${(trend.strength * 100).toFixed(1)}%`)
      console.log(`  - Slope: ${trend.slope.toFixed(3)}`)
      console.log(`  - R²: ${trend.r2.toFixed(3)}`)

      // Generate actionable recommendations
      const recommendations = this.analyticsService.generateRecommendations([trend], [], [])
      if (recommendations.length > 0) {
        console.log(`  - Recommendations: ${recommendations.length}`)
        recommendations.forEach(rec => {
          console.log(`    • ${rec.title} (${rec.priority} priority)`)
        })
      }
    }
  }

  /**
   * Demonstrate anomaly detection capabilities
   */
  async demonstrateAnomalyDetection(): Promise<void> {
    console.log('\n🚨 Anomaly Detection Demo...')

    const dataWithAnomalies = MockAnalyticsDataService.generateMetricHistoryWithAnomalies(
      'System Performance',
      'performance',
      60
    )

    const anomalies = this.analyticsService.detectAnomalies(dataWithAnomalies)

    console.log(`🔍 Detected ${anomalies.length} anomalies:`)
    anomalies.forEach((anomaly, index) => {
      const date = anomaly.timestamp.toLocaleDateString()
      const confidence = (anomaly.confidence * 100).toFixed(0)
      
      console.log(`  ${index + 1}. ${anomaly.type} on ${date}`)
      console.log(`     - Value: ${anomaly.value.toFixed(2)} (expected: ${anomaly.expectedValue.toFixed(2)})`)
      console.log(`     - Severity: ${anomaly.severity} (${confidence}% confidence)`)
      console.log(`     - Description: ${anomaly.description}`)
    })
  }

  /**
   * Generate a human-readable summary of insights
   */
  private generateInsightsSummary(insights: AnalyticsInsight[]): string {
    const highPriorityInsights = insights.filter(i => 
      i.type === 'recommendation' && 
      (i.data as any).priority === 'high' || (i.data as any).priority === 'critical'
    )

    const trendCount = insights.filter(i => i.type === 'trend').length
    const anomalyCount = insights.filter(i => i.type === 'anomaly').length
    const forecastCount = insights.filter(i => i.type === 'forecast').length

    let summary = `📋 Analytics Summary:\n`
    summary += `• Analyzed trends across ${trendCount} metrics\n`
    summary += `• Generated ${forecastCount} predictive forecasts\n`
    summary += `• Detected ${anomalyCount} anomalies requiring attention\n`
    
    if (highPriorityInsights.length > 0) {
      summary += `• ${highPriorityInsights.length} high-priority recommendations identified\n`
    }

    summary += `\n🎯 Key Recommendations:\n`
    highPriorityInsights.slice(0, 3).forEach((insight, index) => {
      const rec = insight.data as any
      summary += `${index + 1}. ${rec.title} (${rec.category})\n`
    })

    return summary
  }
}

// Example usage function
export async function runPredictiveAnalyticsDemo(): Promise<void> {
  const demo = new PredictiveAnalyticsExample()
  
  try {
    // Run comprehensive business analytics
    const { insights, summary } = await demo.demonstrateBusinessAnalytics()
    console.log('\n' + summary)

    // Demonstrate specific capabilities
    await demo.demonstrateRevenueForecast()
    await demo.demonstrateTrendAnalysis()
    await demo.demonstrateAnomalyDetection()

    console.log('\n✅ Predictive Analytics Demo Complete!')
    console.log(`📊 Total insights generated: ${insights.length}`)
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
  }
}