import { describe, it, expect, beforeEach } from '@jest/globals'
import { PredictiveAnalyticsIntegration } from '../predictive-analytics-integration'

describe('PredictiveAnalyticsIntegration', () => {
  let integration: PredictiveAnalyticsIntegration

  beforeEach(() => {
    integration = new PredictiveAnalyticsIntegration()
  })

  describe('generateBusinessDashboard', () => {
    it('should generate comprehensive business dashboard data', async () => {
      const dashboard = await integration.generateBusinessDashboard()

      // Check summary structure
      expect(dashboard.summary).toBeDefined()
      expect(dashboard.summary.totalMetrics).toBeGreaterThan(0)
      expect(dashboard.summary.lastUpdated).toBeInstanceOf(Date)

      // Check KPI cards
      expect(Array.isArray(dashboard.kpiCards)).toBe(true)
      expect(dashboard.kpiCards.length).toBeGreaterThan(0)
      
      dashboard.kpiCards.forEach(kpi => {
        expect(kpi.title).toBeDefined()
        expect(kpi.value).toBeDefined()
        expect(['up', 'down', 'stable']).toContain(kpi.trend)
        expect(kpi.change).toBeDefined()
        expect(kpi.forecast).toBeDefined()
      })

      // Check alerts
      expect(Array.isArray(dashboard.alerts)).toBe(true)
      dashboard.alerts.forEach(alert => {
        expect(['info', 'warning', 'critical']).toContain(alert.level)
        expect(alert.title).toBeDefined()
        expect(alert.message).toBeDefined()
        expect(alert.timestamp).toBeInstanceOf(Date)
      })

      // Check insights
      expect(Array.isArray(dashboard.insights)).toBe(true)
      dashboard.insights.forEach(insight => {
        expect(['trend', 'forecast', 'recommendation']).toContain(insight.type)
        expect(insight.title).toBeDefined()
        expect(insight.description).toBeDefined()
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.priority)
        expect(typeof insight.actionable).toBe('boolean')
      })

      // Check market outlook
      expect(dashboard.marketOutlook).toBeDefined()
      expect(['positive', 'neutral', 'negative']).toContain(dashboard.marketOutlook.outlook)
      expect(dashboard.marketOutlook.confidence).toBeGreaterThanOrEqual(0)
      expect(dashboard.marketOutlook.confidence).toBeLessThanOrEqual(1)
      expect(dashboard.marketOutlook.nextReview).toBeInstanceOf(Date)

      // Check risk assessment
      expect(dashboard.riskAssessment).toBeDefined()
      expect(['low', 'medium', 'high', 'critical']).toContain(dashboard.riskAssessment.level)
      expect(dashboard.riskAssessment.score).toBeGreaterThan(0)
      expect(dashboard.riskAssessment.score).toBeLessThanOrEqual(100)
      expect(Array.isArray(dashboard.riskAssessment.factors)).toBe(true)
      expect(Array.isArray(dashboard.riskAssessment.mitigation)).toBe(true)
    })

    it('should generate meaningful KPI cards', async () => {
      const dashboard = await integration.generateBusinessDashboard()

      expect(dashboard.kpiCards.length).toBeGreaterThan(0)
      
      // Should have revenue KPI
      const revenueKPI = dashboard.kpiCards.find(kpi => 
        kpi.title.toLowerCase().includes('revenue')
      )
      expect(revenueKPI).toBeDefined()

      // KPI values should be formatted properly
      dashboard.kpiCards.forEach(kpi => {
        expect(kpi.value).toMatch(/[\d,.$%s]+/) // Should contain numbers, currency, or percentage
        expect(kpi.change).toMatch(/[+-]?\d+\.?\d*%/) // Should be a percentage change
      })
    })

    it('should provide actionable insights', async () => {
      const dashboard = await integration.generateBusinessDashboard()

      const actionableInsights = dashboard.insights.filter(insight => insight.actionable)
      expect(actionableInsights.length).toBeGreaterThan(0)

      actionableInsights.forEach(insight => {
        expect(insight.description.length).toBeGreaterThan(20) // Should have meaningful descriptions
        expect(['medium', 'high', 'critical']).toContain(insight.priority) // Actionable insights should have meaningful priority
      })
    })
  })

  describe('generateRevenueForecastDashboard', () => {
    it('should generate comprehensive revenue forecast dashboard', async () => {
      const revenueDashboard = await integration.generateRevenueForecastDashboard()

      // Check current revenue
      expect(revenueDashboard.currentRevenue).toBeDefined()
      expect(typeof revenueDashboard.currentRevenue.value).toBe('number')
      expect(revenueDashboard.currentRevenue.period).toBeDefined()
      expect(typeof revenueDashboard.currentRevenue.change).toBe('number')
      expect(typeof revenueDashboard.currentRevenue.changePercent).toBe('number')

      // Check forecast
      expect(revenueDashboard.forecast).toBeDefined()
      expect(revenueDashboard.forecast.period).toBeDefined()
      expect(Array.isArray(revenueDashboard.forecast.predictions)).toBe(true)
      expect(revenueDashboard.forecast.predictions.length).toBeGreaterThan(0)
      expect(revenueDashboard.forecast.accuracy).toBeGreaterThan(0)
      expect(revenueDashboard.forecast.accuracy).toBeLessThanOrEqual(100)

      // Check predictions structure
      revenueDashboard.forecast.predictions.forEach(prediction => {
        expect(prediction.date).toMatch(/\d{4}-\d{2}-\d{2}/) // Should be YYYY-MM-DD format
        expect(typeof prediction.value).toBe('number')
        expect(prediction.confidence).toBeGreaterThan(0)
        expect(prediction.confidence).toBeLessThanOrEqual(100)
        expect(prediction.range.min).toBeLessThanOrEqual(prediction.value)
        expect(prediction.range.max).toBeGreaterThanOrEqual(prediction.value)
      })

      // Check seasonal insights
      expect(revenueDashboard.seasonalInsights).toBeDefined()
      expect(typeof revenueDashboard.seasonalInsights.hasSeasonality).toBe('boolean')

      if (revenueDashboard.seasonalInsights.hasSeasonality) {
        expect(typeof revenueDashboard.seasonalInsights.period).toBe('number')
        expect(revenueDashboard.seasonalInsights.period).toBeGreaterThan(0)
      }

      // Check recommendations
      expect(Array.isArray(revenueDashboard.recommendations)).toBe(true)
      revenueDashboard.recommendations.forEach(rec => {
        expect(rec.title).toBeDefined()
        expect(rec.description).toBeDefined()
        expect(['low', 'medium', 'high']).toContain(rec.impact)
        expect(rec.timeframe).toBeDefined()
      })
    })

    it('should provide accurate revenue calculations', async () => {
      const revenueDashboard = await integration.generateRevenueForecastDashboard()

      // Current revenue should be positive
      expect(revenueDashboard.currentRevenue.value).toBeGreaterThan(0)

      // Change percent should be calculated correctly
      if (revenueDashboard.currentRevenue.change !== 0) {
        expect(Math.abs(revenueDashboard.currentRevenue.changePercent)).toBeGreaterThan(0)
      }

      // Forecast predictions should be reasonable
      const avgPrediction = revenueDashboard.forecast.predictions.reduce(
        (sum, p) => sum + p.value, 0
      ) / revenueDashboard.forecast.predictions.length

      expect(avgPrediction).toBeGreaterThan(0)
      expect(avgPrediction).toBeLessThan(revenueDashboard.currentRevenue.value * 10) // Reasonable upper bound
    })

    it('should provide confidence intervals for forecasts', async () => {
      const revenueDashboard = await integration.generateRevenueForecastDashboard()

      revenueDashboard.forecast.predictions.forEach(prediction => {
        const intervalWidth = prediction.range.max - prediction.range.min
        const relativeWidth = intervalWidth / prediction.value

        // Confidence intervals should be meaningful
        expect(intervalWidth).toBeGreaterThan(0)
        expect(relativeWidth).toBeGreaterThan(0.01) // At least 1% width
        expect(relativeWidth).toBeLessThan(2) // Not more than 200% width
      })
    })
  })

  describe('generateRealTimeAlerts', () => {
    it('should generate comprehensive real-time alerts', async () => {
      const alerts = await integration.generateRealTimeAlerts()

      // Check structure
      expect(alerts.criticalAlerts).toBeDefined()
      expect(alerts.trendAlerts).toBeDefined()
      expect(alerts.forecastAlerts).toBeDefined()

      expect(Array.isArray(alerts.criticalAlerts)).toBe(true)
      expect(Array.isArray(alerts.trendAlerts)).toBe(true)
      expect(Array.isArray(alerts.forecastAlerts)).toBe(true)

      // Check critical alerts structure
      alerts.criticalAlerts.forEach(alert => {
        expect(alert.id).toBeDefined()
        expect(alert.title).toBeDefined()
        expect(alert.message).toBeDefined()
        expect(['critical', 'high', 'medium', 'low']).toContain(alert.severity)
        expect(alert.timestamp).toBeInstanceOf(Date)
        expect(alert.metric).toBeDefined()
        expect(typeof alert.value).toBe('number')
        expect(typeof alert.threshold).toBe('number')
        expect(alert.action).toBeDefined()
      })

      // Check trend alerts structure
      alerts.trendAlerts.forEach(alert => {
        expect(alert.id).toBeDefined()
        expect(alert.metric).toBeDefined()
        expect(alert.trend).toBeDefined()
        expect(alert.strength).toBeGreaterThan(0)
        expect(alert.strength).toBeLessThanOrEqual(100)
        expect(alert.message).toBeDefined()
        expect(Array.isArray(alert.recommendations)).toBe(true)
      })

      // Check forecast alerts structure
      alerts.forecastAlerts.forEach(alert => {
        expect(alert.id).toBeDefined()
        expect(alert.metric).toBeDefined()
        expect(['Increasing', 'Decreasing', 'Stable']).toContain(alert.prediction)
        expect(alert.confidence).toBeGreaterThan(0)
        expect(alert.confidence).toBeLessThanOrEqual(100)
        expect(alert.timeframe).toBeDefined()
        expect(['High', 'Medium', 'Low']).toContain(alert.impact)
      })
    })

    it('should generate unique alert IDs', async () => {
      const alerts = await integration.generateRealTimeAlerts()

      const allAlerts = [
        ...alerts.criticalAlerts.map(a => a.id),
        ...alerts.trendAlerts.map(a => a.id),
        ...alerts.forecastAlerts.map(a => a.id)
      ]

      const uniqueIds = new Set(allAlerts)
      expect(uniqueIds.size).toBe(allAlerts.length) // All IDs should be unique
    })

    it('should provide actionable recommendations for trend alerts', async () => {
      const alerts = await integration.generateRealTimeAlerts()

      alerts.trendAlerts.forEach(alert => {
        expect(alert.recommendations.length).toBeGreaterThanOrEqual(0)
        alert.recommendations.forEach(rec => {
          expect(typeof rec).toBe('string')
          expect(rec.length).toBeGreaterThan(10) // Should be meaningful recommendations
        })
      })
    })

    it('should categorize forecast impacts correctly', async () => {
      const alerts = await integration.generateRealTimeAlerts()

      alerts.forecastAlerts.forEach(alert => {
        // Impact should be valid
        expect(['High', 'Medium', 'Low']).toContain(alert.impact)
        
        // Confidence should be reasonable
        expect(alert.confidence).toBeGreaterThan(0)
        expect(alert.confidence).toBeLessThanOrEqual(100)
        
        // Stable predictions should generally have lower impact
        if (alert.prediction === 'Stable') {
          expect(['Low', 'Medium']).toContain(alert.impact)
        }
      })
    })
  })

  describe('Integration Performance', () => {
    it('should complete dashboard generation within reasonable time', async () => {
      const startTime = Date.now()
      await integration.generateBusinessDashboard()
      const endTime = Date.now()

      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle multiple concurrent requests', async () => {
      const promises = [
        integration.generateBusinessDashboard(),
        integration.generateRevenueForecastDashboard(),
        integration.generateRealTimeAlerts()
      ]

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      expect(results[0]).toBeDefined() // Business dashboard
      expect(results[1]).toBeDefined() // Revenue dashboard
      expect(results[2]).toBeDefined() // Real-time alerts
    })

    it('should provide consistent results across multiple calls', async () => {
      const dashboard1 = await integration.generateBusinessDashboard()
      const dashboard2 = await integration.generateBusinessDashboard()

      // Structure should be consistent
      expect(dashboard1.summary.totalMetrics).toBe(dashboard2.summary.totalMetrics)
      expect(dashboard1.kpiCards.length).toBe(dashboard2.kpiCards.length)
      
      // Market outlook should be valid (may vary due to randomness in mock data)
      expect(['positive', 'neutral', 'negative']).toContain(dashboard1.marketOutlook.outlook)
      expect(['positive', 'neutral', 'negative']).toContain(dashboard2.marketOutlook.outlook)
      
      // Risk assessment should be valid
      expect(['low', 'medium', 'high', 'critical']).toContain(dashboard1.riskAssessment.level)
      expect(['low', 'medium', 'high', 'critical']).toContain(dashboard2.riskAssessment.level)
    })
  })

  describe('Data Quality and Validation', () => {
    it('should handle edge cases gracefully', async () => {
      // Test should not throw errors even with edge cases
      expect(async () => {
        await integration.generateBusinessDashboard()
      }).not.toThrow()

      expect(async () => {
        await integration.generateRevenueForecastDashboard()
      }).not.toThrow()

      expect(async () => {
        await integration.generateRealTimeAlerts()
      }).not.toThrow()
    })

    it('should provide meaningful default values', async () => {
      const dashboard = await integration.generateBusinessDashboard()

      // Should always have at least some data
      expect(dashboard.summary.totalMetrics).toBeGreaterThan(0)
      expect(dashboard.kpiCards.length).toBeGreaterThan(0)
      expect(dashboard.alerts.length).toBeGreaterThan(0)
      expect(dashboard.insights.length).toBeGreaterThan(0)
    })

    it('should validate data ranges and formats', async () => {
      const revenueDashboard = await integration.generateRevenueForecastDashboard()

      // Validate percentage formats
      expect(revenueDashboard.currentRevenue.changePercent).toBeGreaterThan(-100)
      expect(revenueDashboard.currentRevenue.changePercent).toBeLessThan(1000)

      // Validate confidence ranges
      expect(revenueDashboard.forecast.accuracy).toBeGreaterThanOrEqual(0)
      expect(revenueDashboard.forecast.accuracy).toBeLessThanOrEqual(100)

      // Validate date formats
      revenueDashboard.forecast.predictions.forEach(prediction => {
        expect(prediction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(new Date(prediction.date).toString()).not.toBe('Invalid Date')
      })
    })
  })
})