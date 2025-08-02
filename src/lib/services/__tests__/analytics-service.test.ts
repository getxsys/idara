import { describe, it, expect, beforeEach } from '@jest/globals'
import { AnalyticsService } from '../analytics-service'
import { MockAnalyticsDataService } from '../mock-analytics-data'
import { MetricHistory, TrendAnalysis, AnomalyDetection, Forecast } from '@/types/analytics'

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService
  let mockData: MetricHistory[]

  beforeEach(() => {
    analyticsService = new AnalyticsService()
    mockData = MockAnalyticsDataService.generateSampleMetricHistories()
  })

  describe('analyzeTrend', () => {
    it('should detect increasing trend correctly', () => {
      const increasingData = MockAnalyticsDataService.generateMetricHistory(
        'Revenue',
        'revenue',
        30,
        'increasing'
      )

      const trend = analyticsService.analyzeTrend(increasingData)

      expect(trend.metric).toBe('Revenue')
      expect(trend.trend).toBe('increasing')
      expect(trend.slope).toBeGreaterThan(0)
      expect(trend.strength).toBeGreaterThan(0.5)
      expect(trend.r2).toBeGreaterThan(0.5)
      expect(trend.dataPoints).toBe(30)
    })

    it('should detect decreasing trend correctly', () => {
      const decreasingData = MockAnalyticsDataService.generateMetricHistory(
        'Error Rate',
        'performance',
        25,
        'decreasing'
      )

      const trend = analyticsService.analyzeTrend(decreasingData)

      expect(trend.metric).toBe('Error Rate')
      expect(trend.trend).toBe('decreasing')
      expect(trend.slope).toBeLessThan(0)
      expect(trend.strength).toBeGreaterThan(0.3)
    })

    it('should detect stable trend correctly', () => {
      const stableData = MockAnalyticsDataService.generateMetricHistory(
        'Conversion Rate',
        'conversion',
        20,
        'stable'
      )

      const trend = analyticsService.analyzeTrend(stableData)

      expect(trend.metric).toBe('Conversion Rate')
      expect(trend.trend).toBe('stable')
      expect(Math.abs(trend.slope)).toBeLessThan(0.2)
    })

    it('should throw error for insufficient data', () => {
      const insufficientData: MetricHistory = {
        metric: 'Test',
        data: [{
          id: '1',
          name: 'Test',
          value: 100,
          timestamp: new Date(),
          category: 'revenue'
        }],
        aggregation: 'daily'
      }

      expect(() => analyticsService.analyzeTrend(insufficientData)).toThrow('Insufficient data for trend analysis')
    })
  })

  describe('detectAnomalies', () => {
    it('should detect anomalies in data with spikes', () => {
      const dataWithAnomalies = MockAnalyticsDataService.generateMetricHistoryWithAnomalies(
        'Daily Users',
        'engagement',
        30
      )

      const anomalies = analyticsService.detectAnomalies(dataWithAnomalies)

      expect(anomalies.length).toBeGreaterThan(0)
      anomalies.forEach(anomaly => {
        expect(anomaly.confidence).toBeGreaterThan(0)
        expect(anomaly.confidence).toBeLessThanOrEqual(1)
        expect(['spike', 'drop', 'outlier', 'pattern_break']).toContain(anomaly.type)
        expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity)
      })
    })

    it('should return empty array for insufficient data', () => {
      const insufficientData: MetricHistory = {
        metric: 'Test',
        data: Array.from({ length: 5 }, (_, i) => ({
          id: `${i}`,
          name: 'Test',
          value: 100 + i,
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          category: 'revenue' as const
        })),
        aggregation: 'daily'
      }

      const anomalies = analyticsService.detectAnomalies(insufficientData)
      expect(anomalies).toEqual([])
    })
  })

  describe('generateForecast', () => {
    it('should generate forecast for trending data', () => {
      const trendingData = MockAnalyticsDataService.generateMetricHistory(
        'Revenue',
        'revenue',
        30,
        'increasing'
      )

      const forecast = analyticsService.generateForecast(trendingData)

      expect(forecast.metric).toBe('Revenue')
      expect(forecast.model).toBeDefined()
      expect(forecast.predictions.length).toBeGreaterThan(0)
      expect(forecast.accuracy).toBeGreaterThan(0)
      expect(forecast.accuracy).toBeLessThanOrEqual(1)
      expect(forecast.mape).toBeGreaterThanOrEqual(0)
      expect(forecast.rmse).toBeGreaterThanOrEqual(0)

      // Check prediction structure
      forecast.predictions.forEach(prediction => {
        expect(prediction.timestamp).toBeInstanceOf(Date)
        expect(prediction.predictedValue).toBeGreaterThan(0)
        expect(prediction.confidence).toBeGreaterThan(0)
        expect(prediction.confidence).toBeLessThanOrEqual(1)
        expect(prediction.confidenceInterval.lower).toBeLessThanOrEqual(prediction.predictedValue)
        expect(prediction.confidenceInterval.upper).toBeGreaterThanOrEqual(prediction.predictedValue)
      })
    })

    it('should throw error for insufficient data', () => {
      const insufficientData: MetricHistory = {
        metric: 'Test',
        data: Array.from({ length: 3 }, (_, i) => ({
          id: `${i}`,
          name: 'Test',
          value: 100,
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          category: 'revenue' as const
        })),
        aggregation: 'daily'
      }

      expect(() => analyticsService.generateForecast(insufficientData)).toThrow('Insufficient data for forecasting')
    })
  })

  describe('generateRecommendations', () => {
    it('should generate recommendations based on trends', () => {
      const trends: TrendAnalysis[] = [
        {
          metric: 'Revenue',
          trend: 'decreasing',
          strength: 0.8,
          slope: -0.6,
          r2: 0.8,
          period: 'daily',
          dataPoints: 30,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      ]

      const recommendations = analyticsService.generateRecommendations(trends, [], [])

      expect(recommendations.length).toBeGreaterThan(0)
      const revenueRec = recommendations.find(r => r.title.includes('Revenue'))
      expect(revenueRec).toBeDefined()
      expect(revenueRec?.priority).toBe('high')
      expect(revenueRec?.category).toBe('risk_mitigation')
    })

    it('should generate recommendations for critical anomalies', () => {
      const anomalies: AnomalyDetection[] = [
        {
          timestamp: new Date(),
          value: 1000,
          expectedValue: 500,
          deviation: 500,
          severity: 'critical',
          confidence: 0.9,
          type: 'spike',
          description: 'Critical spike detected'
        }
      ]

      const recommendations = analyticsService.generateRecommendations([], anomalies, [])

      expect(recommendations.length).toBeGreaterThan(0)
      const anomalyRec = recommendations.find(r => r.title.includes('Critical Anomalies'))
      expect(anomalyRec).toBeDefined()
      expect(anomalyRec?.priority).toBe('critical')
    })
  })

  describe('generateInsights', () => {
    it('should generate comprehensive insights from metric histories', async () => {
      const insights = await analyticsService.generateInsights(mockData)

      expect(insights.length).toBeGreaterThan(0)

      // Check insight types
      const insightTypes = insights.map(i => i.type)
      expect(insightTypes).toContain('trend')
      expect(insightTypes).toContain('forecast')

      // Check insight structure
      insights.forEach(insight => {
        expect(insight.id).toBeDefined()
        expect(insight.title).toBeDefined()
        expect(insight.summary).toBeDefined()
        expect(insight.relevanceScore).toBeGreaterThan(0)
        expect(insight.relevanceScore).toBeLessThanOrEqual(1)
        expect(insight.createdAt).toBeInstanceOf(Date)
      })

      // Check sorting by relevance
      for (let i = 1; i < insights.length; i++) {
        expect(insights[i - 1].relevanceScore).toBeGreaterThanOrEqual(insights[i].relevanceScore)
      }
    })
  })

  describe('Prediction Accuracy Tests', () => {
    it('should maintain prediction accuracy above threshold for linear trends', () => {
      const linearData = MockAnalyticsDataService.generateMetricHistory(
        'Linear Growth',
        'revenue',
        50,
        'increasing'
      )

      const forecast = analyticsService.generateForecast(linearData)
      
      // For linear data, accuracy should be high
      expect(forecast.accuracy).toBeGreaterThan(0.7)
      expect(forecast.mape).toBeLessThan(20) // Less than 20% error
    })

    it('should provide confidence intervals that reflect uncertainty', () => {
      const volatileData = MockAnalyticsDataService.generateMetricHistory(
        'Volatile Metric',
        'performance',
        30,
        'volatile'
      )

      const forecast = analyticsService.generateForecast(volatileData)
      
      // For volatile data, confidence intervals should be wider
      forecast.predictions.forEach(prediction => {
        const intervalWidth = prediction.confidenceInterval.upper - prediction.confidenceInterval.lower
        const relativeWidth = intervalWidth / prediction.predictedValue
        
        // Confidence interval should be meaningful (not too narrow for volatile data)
        expect(relativeWidth).toBeGreaterThan(0.1)
      })
    })

    it('should degrade confidence over longer forecast horizons', () => {
      const testData = MockAnalyticsDataService.generateMetricHistory(
        'Test Forecast Horizon',
        'revenue',
        30,
        'increasing'
      )

      const forecast = analyticsService.generateForecast(testData)
      
      // Confidence should generally decrease over time
      if (forecast.predictions.length > 2) {
        const firstConfidence = forecast.predictions[0].confidence
        const lastConfidence = forecast.predictions[forecast.predictions.length - 1].confidence
        
        expect(lastConfidence).toBeLessThanOrEqual(firstConfidence)
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty data gracefully', () => {
      const emptyData: MetricHistory = {
        metric: 'Empty',
        data: [],
        aggregation: 'daily'
      }

      expect(() => analyticsService.analyzeTrend(emptyData)).toThrow()
      expect(analyticsService.detectAnomalies(emptyData)).toEqual([])
      expect(() => analyticsService.generateForecast(emptyData)).toThrow()
    })

    it('should handle data with zero values', () => {
      const zeroData: MetricHistory = {
        metric: 'Zero Values',
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `${i}`,
          name: 'Zero Test',
          value: i % 5 === 0 ? 0 : 100 + i,
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          category: 'performance' as const
        })),
        aggregation: 'daily'
      }

      const trend = analyticsService.analyzeTrend(zeroData)
      expect(trend).toBeDefined()

      const anomalies = analyticsService.detectAnomalies(zeroData)
      expect(Array.isArray(anomalies)).toBe(true)

      const forecast = analyticsService.generateForecast(zeroData)
      expect(forecast.predictions.every(p => p.predictedValue >= 0)).toBe(true)
    })
  })
})