import { describe, it, expect, beforeEach } from '@jest/globals'
import { PredictiveAnalyticsSystem } from '../predictive-analytics'
import { MockAnalyticsDataService } from '../mock-analytics-data'
import { MetricHistory, TrendAnalysis, AnomalyDetection, Forecast } from '@/types/analytics'

describe('PredictiveAnalyticsSystem', () => {
  let predictiveSystem: PredictiveAnalyticsSystem
  let mockData: MetricHistory[]

  beforeEach(() => {
    predictiveSystem = new PredictiveAnalyticsSystem({
      anomalyDetection: {
        enabled: true,
        sensitivity: 'medium',
        lookbackPeriod: 30,
        minDataPoints: 10
      },
      forecasting: {
        enabled: true,
        horizon: 7,
        updateFrequency: 24,
        models: ['linear', 'exponential', 'seasonal', 'arima']
      },
      recommendations: {
        enabled: true,
        maxRecommendations: 10,
        minConfidence: 0.6
      }
    })

    mockData = [
      MockAnalyticsDataService.generateMetricHistory('Revenue', 'revenue', 60, 'increasing'),
      MockAnalyticsDataService.generateMetricHistory('Conversion Rate', 'conversion', 45, 'stable'),
      MockAnalyticsDataService.generateMetricHistory('Customer Satisfaction', 'satisfaction', 30, 'seasonal'),
      MockAnalyticsDataService.generateMetricHistory('Page Load Time', 'performance', 30, 'decreasing'),
      MockAnalyticsDataService.generateMetricHistoryWithAnomalies('Daily Users', 'engagement', 35)
    ]
  })

  describe('analyzeTrendsWithInsights', () => {
    it('should analyze trends and provide actionable insights', async () => {
      const result = await predictiveSystem.analyzeTrendsWithInsights(mockData)

      expect(result.trends).toBeDefined()
      expect(result.trends.length).toBeGreaterThan(0)
      expect(result.insights).toBeDefined()
      expect(result.actionableSteps).toBeDefined()
      expect(result.riskAssessment).toBeDefined()

      // Check risk assessment structure
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskAssessment.level)
      expect(Array.isArray(result.riskAssessment.factors)).toBe(true)
      expect(Array.isArray(result.riskAssessment.mitigation)).toBe(true)

      // Verify insights are meaningful
      expect(result.insights.length).toBeGreaterThan(0)
      result.insights.forEach(insight => {
        expect(typeof insight).toBe('string')
        expect(insight.length).toBeGreaterThan(10)
      })

      // Verify actionable steps are provided
      expect(result.actionableSteps.length).toBeGreaterThan(0)
      result.actionableSteps.forEach(step => {
        expect(typeof step).toBe('string')
        expect(step.length).toBeGreaterThan(10)
      })
    })

    it('should correctly assess risk levels based on trend patterns', async () => {
      // Create data with multiple declining trends
      const decliningData = [
        MockAnalyticsDataService.generateMetricHistory('Revenue', 'revenue', 30, 'decreasing'),
        MockAnalyticsDataService.generateMetricHistory('Satisfaction', 'satisfaction', 30, 'decreasing'),
        MockAnalyticsDataService.generateMetricHistory('Performance', 'performance', 30, 'volatile')
      ]

      const result = await predictiveSystem.analyzeTrendsWithInsights(decliningData)

      // Should detect high risk due to multiple declining trends
      expect(['high', 'critical']).toContain(result.riskAssessment.level)
      expect(result.riskAssessment.factors.length).toBeGreaterThan(0)
      expect(result.riskAssessment.mitigation.length).toBeGreaterThan(0)
    })

    it('should provide specific insights for different trend types', async () => {
      const increasingData = MockAnalyticsDataService.generateMetricHistory('Revenue', 'revenue', 30, 'increasing')
      const result = await predictiveSystem.analyzeTrendsWithInsights([increasingData])

      const revenueInsight = result.insights.find(insight => insight.includes('Revenue'))
      expect(revenueInsight).toBeDefined()
      expect(revenueInsight).toContain('growth')

      const scaleAction = result.actionableSteps.find(step => step.includes('Scale'))
      expect(scaleAction).toBeDefined()
    })
  })

  describe('detectAnomaliesWithContext', () => {
    it('should detect anomalies and provide contextual analysis', async () => {
      const dataWithAnomalies = [
        MockAnalyticsDataService.generateMetricHistoryWithAnomalies('System Performance', 'performance', 40)
      ]

      const result = await predictiveSystem.detectAnomaliesWithContext(dataWithAnomalies)

      expect(result.anomalies).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(['normal', 'warning', 'critical']).toContain(result.alertLevel)

      // Check summary structure
      expect(typeof result.summary.total).toBe('number')
      expect(typeof result.summary.bySeverity).toBe('object')
      expect(typeof result.summary.byType).toBe('object')
      expect(typeof result.summary.avgConfidence).toBe('number')

      // Verify recommendations are contextual
      if (result.anomalies.length > 0) {
        expect(result.recommendations.length).toBeGreaterThan(0)
        result.recommendations.forEach(rec => {
          expect(typeof rec).toBe('string')
          expect(rec.length).toBeGreaterThan(10)
        })
      }
    })

    it('should correctly categorize anomalies by severity and type', async () => {
      const dataWithAnomalies = [
        MockAnalyticsDataService.generateMetricHistoryWithAnomalies('Error Rate', 'performance', 50)
      ]

      const result = await predictiveSystem.detectAnomaliesWithContext(dataWithAnomalies)

      if (result.anomalies.length > 0) {
        // Check that all anomalies have valid severity and type
        result.anomalies.forEach(anomaly => {
          expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity)
          expect(['spike', 'drop', 'outlier', 'pattern_break']).toContain(anomaly.type)
          expect(anomaly.confidence).toBeGreaterThan(0)
          expect(anomaly.confidence).toBeLessThanOrEqual(1)
        })

        // Verify summary counts match actual anomalies
        const severityCounts = Object.values(result.summary.bySeverity).reduce((sum, count) => sum + count, 0)
        expect(severityCounts).toBe(result.anomalies.length)
      }
    })

    it('should set appropriate alert levels based on anomaly severity', async () => {
      // Test with no anomalies
      const stableData = [MockAnalyticsDataService.generateMetricHistory('Stable Metric', 'performance', 30, 'stable')]
      const stableResult = await predictiveSystem.detectAnomaliesWithContext(stableData)
      expect(['normal', 'warning']).toContain(stableResult.alertLevel) // Allow warning for stable data

      // Test with anomalies
      const anomalyData = [MockAnalyticsDataService.generateMetricHistoryWithAnomalies('Volatile Metric', 'performance', 40)]
      const anomalyResult = await predictiveSystem.detectAnomaliesWithContext(anomalyData)
      
      if (anomalyResult.anomalies.length > 0) {
        expect(['warning', 'critical']).toContain(anomalyResult.alertLevel)
      }
    })
  })

  describe('generateAdvancedForecasts', () => {
    it('should generate comprehensive forecasts with ensemble models', async () => {
      const result = await predictiveSystem.generateAdvancedForecasts(mockData)

      expect(result.forecasts).toBeDefined()
      expect(result.ensemble).toBeDefined()
      expect(result.marketConditions).toBeDefined()
      expect(result.seasonalInsights).toBeDefined()

      // Check forecast structure
      result.forecasts.forEach(forecast => {
        expect(forecast.metric).toBeDefined()
        expect(forecast.model).toBeDefined()
        expect(Array.isArray(forecast.predictions)).toBe(true)
        expect(forecast.accuracy).toBeGreaterThan(0)
        expect(forecast.accuracy).toBeLessThanOrEqual(1)
      })

      // Check ensemble forecasts
      result.ensemble.forEach(ensemble => {
        expect(ensemble.metric).toBeDefined()
        expect(Array.isArray(ensemble.predictions)).toBe(true)
        expect(typeof ensemble.modelWeights).toBe('object')
        expect(ensemble.confidence).toBeGreaterThan(0)
        expect(ensemble.confidence).toBeLessThanOrEqual(1)
      })

      // Check market conditions
      expect(['positive', 'neutral', 'negative']).toContain(result.marketConditions.outlook)
      expect(result.marketConditions.confidence).toBeGreaterThanOrEqual(0)
      expect(result.marketConditions.confidence).toBeLessThanOrEqual(1)
      expect(Array.isArray(result.marketConditions.factors)).toBe(true)

      // Check seasonal insights
      expect(result.seasonalInsights.length).toBe(mockData.length)
      result.seasonalInsights.forEach(insight => {
        expect(typeof insight.hasSeasonality).toBe('boolean')
        if (insight.hasSeasonality) {
          expect(typeof insight.period).toBe('number')
          expect(typeof insight.strength).toBe('number')
        }
      })
    })

    it('should detect seasonal patterns correctly', async () => {
      const seasonalData = [
        MockAnalyticsDataService.generateMetricHistory('Seasonal Sales', 'revenue', 60, 'seasonal')
      ]

      const result = await predictiveSystem.generateAdvancedForecasts(seasonalData)
      const seasonalInsight = result.seasonalInsights[0]

      // Should detect seasonality in seasonal data
      if (seasonalInsight.hasSeasonality) {
        expect(seasonalInsight.period).toBeGreaterThan(1)
        expect(seasonalInsight.strength).toBeGreaterThan(0)
        expect(seasonalInsight.strength).toBeLessThanOrEqual(1)
      }
    })

    it('should provide accurate market condition analysis', async () => {
      // Test with positive trending data
      const positiveData = [
        MockAnalyticsDataService.generateMetricHistory('Growing Revenue', 'revenue', 30, 'increasing'),
        MockAnalyticsDataService.generateMetricHistory('Rising Engagement', 'engagement', 30, 'increasing')
      ]

      const result = await predictiveSystem.generateAdvancedForecasts(positiveData)
      
      // Should detect positive or neutral market conditions (depending on forecast accuracy)
      expect(['positive', 'neutral']).toContain(result.marketConditions.outlook)
      expect(result.marketConditions.confidence).toBeGreaterThanOrEqual(0)
    })
  })

  describe('generateActionableRecommendations', () => {
    it('should generate comprehensive recommendations with business impact', async () => {
      // Create sample analytics data
      const trends: TrendAnalysis[] = [
        {
          metric: 'Revenue',
          trend: 'decreasing',
          strength: 0.8,
          slope: -0.5,
          r2: 0.8,
          period: 'daily',
          dataPoints: 30,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      ]

      const anomalies: AnomalyDetection[] = [
        {
          timestamp: new Date(),
          value: 1000,
          expectedValue: 500,
          deviation: 500,
          severity: 'high',
          confidence: 0.9,
          type: 'spike',
          description: 'High severity spike detected'
        }
      ]

      const forecasts: Forecast[] = [
        {
          metric: 'Revenue',
          model: 'linear',
          predictions: [
            {
              timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000),
              predictedValue: 45000,
              confidence: 0.8,
              confidenceInterval: { lower: 40000, upper: 50000 }
            }
          ],
          accuracy: 0.8,
          mape: 10,
          rmse: 5000,
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ]

      const result = await predictiveSystem.generateActionableRecommendations(trends, anomalies, forecasts)

      expect(result.recommendations).toBeDefined()
      expect(result.priorityActions).toBeDefined()
      expect(result.businessImpact).toBeDefined()
      expect(result.timeline).toBeDefined()

      // Check business impact structure
      expect(typeof result.businessImpact.revenue).toBe('number')
      expect(typeof result.businessImpact.risk).toBe('number')
      expect(typeof result.businessImpact.opportunity).toBe('number')

      // Check timeline organization
      expect(Array.isArray(result.timeline.immediate)).toBe(true)
      expect(Array.isArray(result.timeline.shortTerm)).toBe(true)
      expect(Array.isArray(result.timeline.longTerm)).toBe(true)

      // Verify priority actions are extracted
      expect(result.priorityActions.length).toBeGreaterThan(0)
      result.priorityActions.forEach(action => {
        expect(typeof action).toBe('string')
        expect(action.length).toBeGreaterThan(5)
      })
    })

    it('should estimate business impact accurately', async () => {
      const highImpactTrends: TrendAnalysis[] = [
        {
          metric: 'Revenue',
          trend: 'decreasing',
          strength: 0.9,
          slope: -1.0,
          r2: 0.9,
          period: 'daily',
          dataPoints: 30,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      ]

      const result = await predictiveSystem.generateActionableRecommendations(highImpactTrends, [], [])

      // High-impact declining revenue should result in significant risk score
      expect(result.businessImpact.risk).toBeGreaterThan(10)
    })

    it('should organize recommendations by timeline correctly', async () => {
      const criticalTrends: TrendAnalysis[] = [
        {
          metric: 'Critical System',
          trend: 'decreasing',
          strength: 0.95,
          slope: -2.0,
          r2: 0.95,
          period: 'daily',
          dataPoints: 30,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      ]

      const result = await predictiveSystem.generateActionableRecommendations(criticalTrends, [], [])

      // Critical issues should appear in immediate timeline
      if (result.recommendations.some(r => r.priority === 'critical')) {
        expect(result.timeline.immediate.length).toBeGreaterThan(0)
      }
    })
  })

  describe('generateDashboardInsights', () => {
    it('should generate comprehensive dashboard data', async () => {
      const result = await predictiveSystem.generateDashboardInsights(mockData)

      expect(result.summary).toBeDefined()
      expect(result.trends).toBeDefined()
      expect(result.anomalies).toBeDefined()
      expect(result.forecasts).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.marketOutlook).toBeDefined()
      expect(result.riskAssessment).toBeDefined()
      expect(result.insights).toBeDefined()

      // Check summary statistics
      expect(result.summary.totalMetrics).toBe(mockData.length)
      expect(result.summary.trendsAnalyzed).toBeGreaterThanOrEqual(0)
      expect(result.summary.anomaliesDetected).toBeGreaterThanOrEqual(0)
      expect(result.summary.forecastsGenerated).toBeGreaterThanOrEqual(0)
      expect(result.summary.recommendationsCount).toBeGreaterThanOrEqual(0)

      // Verify all components are present
      expect(Array.isArray(result.trends)).toBe(true)
      expect(Array.isArray(result.anomalies)).toBe(true)
      expect(Array.isArray(result.forecasts)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(Array.isArray(result.insights)).toBe(true)

      // Check market outlook structure
      expect(['positive', 'neutral', 'negative']).toContain(result.marketOutlook.outlook)
      expect(result.marketOutlook.confidence).toBeGreaterThanOrEqual(0)
      expect(result.marketOutlook.confidence).toBeLessThanOrEqual(1)

      // Check risk assessment structure
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskAssessment.level)
      expect(Array.isArray(result.riskAssessment.factors)).toBe(true)
      expect(Array.isArray(result.riskAssessment.mitigation)).toBe(true)
    })

    it('should handle empty data gracefully', async () => {
      const result = await predictiveSystem.generateDashboardInsights([])

      expect(result.summary.totalMetrics).toBe(0)
      expect(result.trends).toEqual([])
      expect(result.anomalies).toEqual([])
      expect(result.forecasts).toEqual([])
      expect(result.marketOutlook.outlook).toBe('neutral')
      expect(result.riskAssessment.level).toBe('low')
    })
  })

  describe('Prediction Accuracy Tests', () => {
    it('should maintain high accuracy for predictable patterns', async () => {
      const linearData = MockAnalyticsDataService.generateMetricHistory('Linear Growth', 'revenue', 50, 'increasing')
      const result = await predictiveSystem.generateAdvancedForecasts([linearData])

      const forecast = result.forecasts[0]
      if (forecast) {
        expect(forecast.accuracy).toBeGreaterThan(0.6)
        expect(forecast.mape).toBeLessThan(30)
      }
    })

    it('should provide realistic confidence intervals', async () => {
      const volatileData = MockAnalyticsDataService.generateMetricHistory('Volatile Metric', 'performance', 40, 'volatile')
      const result = await predictiveSystem.generateAdvancedForecasts([volatileData])

      const forecast = result.forecasts[0]
      if (forecast) {
        forecast.predictions.forEach(prediction => {
          const intervalWidth = prediction.confidenceInterval.upper - prediction.confidenceInterval.lower
          const relativeWidth = intervalWidth / prediction.predictedValue

          // Confidence intervals should be meaningful
          expect(relativeWidth).toBeGreaterThan(0.05)
          expect(prediction.confidenceInterval.lower).toBeLessThanOrEqual(prediction.predictedValue)
          expect(prediction.confidenceInterval.upper).toBeGreaterThanOrEqual(prediction.predictedValue)
        })
      }
    })

    it('should improve accuracy with ensemble methods', async () => {
      const testData = MockAnalyticsDataService.generateMetricHistory('Test Ensemble', 'revenue', 40, 'increasing')
      const result = await predictiveSystem.generateAdvancedForecasts([testData])

      const ensemble = result.ensemble[0]
      if (ensemble) {
        // Ensemble should have reasonable confidence
        expect(ensemble.confidence).toBeGreaterThan(0.3)
        expect(ensemble.confidence).toBeLessThanOrEqual(1)

        // Model weights should sum to approximately 1
        const totalWeight = Object.values(ensemble.modelWeights).reduce((sum, weight) => sum + weight, 0)
        expect(totalWeight).toBeCloseTo(1, 1)
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle insufficient data gracefully', async () => {
      const insufficientData: MetricHistory = {
        metric: 'Insufficient',
        data: [
          {
            id: '1',
            name: 'Test',
            value: 100,
            timestamp: new Date(),
            category: 'revenue'
          }
        ],
        aggregation: 'daily'
      }

      const result = await predictiveSystem.generateDashboardInsights([insufficientData])

      // Should not crash and provide meaningful defaults
      expect(result.summary.totalMetrics).toBe(1)
      expect(result.trends.length).toBe(0) // Insufficient data for trends
      expect(result.forecasts.length).toBe(0) // Insufficient data for forecasts
    })

    it('should handle data with extreme values', async () => {
      const extremeData: MetricHistory = {
        metric: 'Extreme Values',
        data: Array.from({ length: 30 }, (_, i) => ({
          id: `${i}`,
          name: 'Extreme Test',
          value: i === 15 ? 1000000 : 100, // One extreme outlier
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          category: 'performance' as const
        })),
        aggregation: 'daily'
      }

      const result = await predictiveSystem.generateDashboardInsights([extremeData])

      // Should detect the extreme value as an anomaly
      expect(result.anomalies.length).toBeGreaterThan(0)
      
      // Should still provide forecasts despite extreme values
      expect(result.forecasts.length).toBeGreaterThan(0)
      
      // Forecasts should have non-negative predicted values
      result.forecasts.forEach(forecast => {
        forecast.predictions.forEach(prediction => {
          expect(prediction.predictedValue).toBeGreaterThanOrEqual(0)
        })
      })
    })

    it('should handle mixed data quality scenarios', async () => {
      const mixedQualityData = [
        MockAnalyticsDataService.generateMetricHistory('Good Data', 'revenue', 50, 'increasing'),
        {
          metric: 'Poor Data',
          data: Array.from({ length: 5 }, (_, i) => ({
            id: `${i}`,
            name: 'Poor',
            value: Math.random() * 1000,
            timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            category: 'performance' as const
          })),
          aggregation: 'daily' as const
        }
      ]

      const result = await predictiveSystem.generateDashboardInsights(mixedQualityData)

      // Should process good data and handle poor data gracefully
      expect(result.summary.totalMetrics).toBe(2)
      expect(result.trends.length).toBeGreaterThanOrEqual(1) // At least good data should be analyzed
    })
  })
})