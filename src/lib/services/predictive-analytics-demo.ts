import { PredictiveAnalyticsSystem } from './predictive-analytics'
import { MockAnalyticsDataService } from './mock-analytics-data'
import { MetricHistory } from '@/types/analytics'

/**
 * Comprehensive demo service for the Predictive Analytics System
 * Demonstrates all key capabilities and requirements implementation
 */
export class PredictiveAnalyticsDemo {
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
        horizon: 14,
        updateFrequency: 24,
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
   * Comprehensive demo showcasing all predictive analytics capabilities
   * Requirements: 1.3, 8.1, 8.2, 8.3
   */
  async runComprehensiveDemo(): Promise<{
    dashboardInsights: any
    trendAnalysis: any
    anomalyDetection: any
    forecasts: any
    recommendations: any
    summary: string
  }> {
    console.log('🚀 Starting Comprehensive Predictive Analytics Demo...')

    // Generate realistic business data
    const businessMetrics: MetricHistory[] = [
      MockAnalyticsDataService.generateMetricHistory('Revenue', 'revenue', 90, 'increasing'),
      MockAnalyticsDataService.generateMetricHistory('Customer Acquisition Cost', 'performance', 60, 'decreasing'),
      MockAnalyticsDataService.generateMetricHistory('User Engagement', 'engagement', 75, 'seasonal'),
      MockAnalyticsDataService.generateMetricHistory('Conversion Rate', 'conversion', 45, 'stable'),
      MockAnalyticsDataService.generateMetricHistoryWithAnomalies('System Performance', 'performance', 50)
    ]

    console.log(`📊 Analyzing ${businessMetrics.length} business metrics...`)

    // Generate comprehensive dashboard insights
    const dashboardInsights = await this.predictiveSystem.generateDashboardInsights(businessMetrics)

    // Demonstrate specific capabilities
    const trendAnalysis = await this.predictiveSystem.analyzeTrendsWithInsights(businessMetrics)
    const anomalyDetection = await this.predictiveSystem.detectAnomaliesWithContext(businessMetrics)
    const forecasts = await this.predictiveSystem.generateAdvancedForecasts(businessMetrics)
    const recommendations = await this.predictiveSystem.generateActionableRecommendations(
      trendAnalysis.trends,
      anomalyDetection.anomalies,
      forecasts.forecasts
    )

    // Generate summary
    const summary = this.generateDemoSummary(dashboardInsights)

    console.log('\n📋 Demo Results:')
    console.log(summary)

    return {
      dashboardInsights,
      trendAnalysis,
      anomalyDetection,
      forecasts,
      recommendations,
      summary
    }
  }

  /**
   * Demonstrate trend analysis with actionable insights
   * Requirement 1.3: Trend detection with actionable steps
   */
  async demonstrateTrendAnalysis(): Promise<void> {
    console.log('\n📈 Trend Analysis with Actionable Insights Demo...')

    const trendMetrics = [
      MockAnalyticsDataService.generateMetricHistory('Sales Growth', 'revenue', 60, 'increasing'),
      MockAnalyticsDataService.generateMetricHistory('Customer Churn', 'engagement', 45, 'decreasing'),
      MockAnalyticsDataService.generateMetricHistory('Support Response Time', 'performance', 30, 'volatile')
    ]

    const analysis = await this.predictiveSystem.analyzeTrendsWithInsights(trendMetrics)

    console.log(`🔍 Trend Analysis Results:`)
    console.log(`  - Trends analyzed: ${analysis.trends.length}`)
    console.log(`  - Risk level: ${analysis.riskAssessment.level}`)
    console.log(`  - Insights generated: ${analysis.insights.length}`)
    console.log(`  - Actionable steps: ${analysis.actionableSteps.length}`)

    console.log('\n💡 Key Insights:')
    analysis.insights.slice(0, 3).forEach((insight, index) => {
      console.log(`  ${index + 1}. ${insight}`)
    })

    console.log('\n🎯 Actionable Steps:')
    analysis.actionableSteps.slice(0, 3).forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`)
    })
  }

  /**
   * Demonstrate revenue forecasting with confidence intervals
   * Requirement 8.1: Revenue forecasts with confidence intervals
   */
  async demonstrateRevenueForecast(): Promise<void> {
    console.log('\n💰 Revenue Forecasting Demo...')

    const revenueData = MockAnalyticsDataService.generateMetricHistory(
      'Monthly Revenue',
      'revenue',
      120,
      'increasing'
    )

    const forecasts = await this.predictiveSystem.generateAdvancedForecasts([revenueData])
    const revenueForecast = forecasts.forecasts.find(f => f.metric === 'Monthly Revenue')

    if (revenueForecast) {
      console.log(`📊 Revenue Forecast Results:`)
      console.log(`  - Model: ${revenueForecast.model}`)
      console.log(`  - Accuracy: ${(revenueForecast.accuracy * 100).toFixed(1)}%`)
      console.log(`  - MAPE: ${revenueForecast.mape.toFixed(1)}%`)

      console.log('\n🔮 Next 7 Days Revenue Forecast:')
      revenueForecast.predictions.slice(0, 7).forEach((prediction, index) => {
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
        
        console.log(`  Day ${index + 1} (${date}): ${value} (${confidence}% confidence)`)
        console.log(`    Range: ${lower} - ${upper}`)
      })
    }

    // Show market conditions analysis
    console.log('\n📈 Market Conditions:')
    console.log(`  - Outlook: ${forecasts.marketConditions.outlook}`)
    console.log(`  - Confidence: ${(forecasts.marketConditions.confidence * 100).toFixed(1)}%`)
    forecasts.marketConditions.factors.forEach(factor => {
      console.log(`  - ${factor}`)
    })
  }

  /**
   * Demonstrate seasonal pattern detection
   * Requirement 8.3: Seasonal pattern incorporation
   */
  async demonstrateSeasonalAnalysis(): Promise<void> {
    console.log('\n🌊 Seasonal Pattern Analysis Demo...')

    const seasonalData = MockAnalyticsDataService.generateMetricHistory(
      'Seasonal Sales',
      'revenue',
      90,
      'seasonal'
    )

    const forecasts = await this.predictiveSystem.generateAdvancedForecasts([seasonalData])
    const seasonalInsight = forecasts.seasonalInsights[0]

    console.log(`🔍 Seasonal Analysis Results:`)
    console.log(`  - Has seasonality: ${seasonalInsight.hasSeasonality}`)
    
    if (seasonalInsight.hasSeasonality) {
      console.log(`  - Period: ${seasonalInsight.period} days`)
      console.log(`  - Strength: ${((seasonalInsight.strength || 0) * 100).toFixed(1)}%`)
      
      if (seasonalInsight.nextPeak) {
        console.log(`  - Next peak: ${seasonalInsight.nextPeak.toLocaleDateString()}`)
      }
      
      if (seasonalInsight.nextTrough) {
        console.log(`  - Next trough: ${seasonalInsight.nextTrough.toLocaleDateString()}`)
      }
    }
  }

  /**
   * Demonstrate anomaly detection with context
   */
  async demonstrateAnomalyDetection(): Promise<void> {
    console.log('\n🚨 Anomaly Detection Demo...')

    const anomalyData = [
      MockAnalyticsDataService.generateMetricHistoryWithAnomalies('System Performance', 'performance', 60),
      MockAnalyticsDataService.generateMetricHistoryWithAnomalies('Error Rate', 'performance', 45)
    ]

    const analysis = await this.predictiveSystem.detectAnomaliesWithContext(anomalyData)

    console.log(`🔍 Anomaly Detection Results:`)
    console.log(`  - Total anomalies: ${analysis.summary.total}`)
    console.log(`  - Alert level: ${analysis.alertLevel}`)
    console.log(`  - Average confidence: ${(analysis.summary.avgConfidence * 100).toFixed(1)}%`)

    console.log('\n📊 Anomalies by Severity:')
    Object.entries(analysis.summary.bySeverity).forEach(([severity, count]) => {
      console.log(`  - ${severity}: ${count}`)
    })

    console.log('\n💡 Recommendations:')
    analysis.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
  }

  /**
   * Generate comprehensive demo summary
   */
  private generateDemoSummary(dashboardInsights: any): string {
    const summary = dashboardInsights.summary
    
    let report = `📋 Predictive Analytics Demo Summary:\n`
    report += `• Analyzed ${summary.totalMetrics} business metrics\n`
    report += `• Generated ${summary.trendsAnalyzed} trend analyses\n`
    report += `• Detected ${summary.anomaliesDetected} anomalies\n`
    report += `• Created ${summary.forecastsGenerated} forecasts\n`
    report += `• Provided ${summary.recommendationsCount} recommendations\n`
    
    report += `\n🎯 Market Outlook: ${dashboardInsights.marketOutlook.outlook}\n`
    report += `⚠️ Risk Level: ${dashboardInsights.riskAssessment.level}\n`
    
    if (dashboardInsights.recommendations.length > 0) {
      report += `\n🔥 Top Priority Actions:\n`
      dashboardInsights.recommendations
        .filter((rec: any) => rec.priority === 'critical' || rec.priority === 'high')
        .slice(0, 3)
        .forEach((rec: unknown, index: number) => {
          report += `  ${index + 1}. ${rec.title}\n`
        })
    }

    return report
  }
}

/**
 * Run the complete predictive analytics demo
 */
export async function runPredictiveAnalyticsDemo(): Promise<void> {
  const demo = new PredictiveAnalyticsDemo()
  
  try {
    console.log('🎯 Predictive Analytics System Demo')
    console.log('===================================')

    // Run comprehensive demo
    await demo.runComprehensiveDemo()

    // Demonstrate specific capabilities
    await demo.demonstrateTrendAnalysis()
    await demo.demonstrateRevenueForecast()
    await demo.demonstrateSeasonalAnalysis()
    await demo.demonstrateAnomalyDetection()

    console.log('\n✅ Predictive Analytics Demo Complete!')
    console.log('All requirements successfully demonstrated:')
    console.log('  ✓ 1.3: Trend detection with actionable steps')
    console.log('  ✓ 8.1: Revenue forecasts with confidence intervals')
    console.log('  ✓ 8.2: Market condition impact predictions')
    console.log('  ✓ 8.3: Seasonal pattern incorporation')
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
    throw error
  }
}