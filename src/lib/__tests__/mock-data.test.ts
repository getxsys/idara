import {
  generateMockKPIData,
  generateMockChartData,
  generateSampleWidgets,
  updateWidgetData
} from '../mock-data'
import { WidgetData } from '@/types/dashboard'

describe('Mock Data Utilities', () => {
  describe('generateMockKPIData', () => {
    it('generates valid KPI data', () => {
      const kpiData = generateMockKPIData('test-id', 'Test KPI')

      expect(kpiData.id).toBe('test-id')
      expect(kpiData.name).toBe('Test KPI')
      expect(typeof kpiData.value).toBe('number')
      expect(typeof kpiData.previousValue).toBe('number')
      expect(typeof kpiData.target).toBe('number')
      expect(['up', 'down', 'stable']).toContain(kpiData.trend)
      expect(['good', 'warning', 'critical']).toContain(kpiData.status)
      expect(kpiData.timestamp).toBeInstanceOf(Date)
    })

    it('generates consistent change calculations', () => {
      const kpiData = generateMockKPIData('test-id', 'Test KPI')

      const expectedChange = kpiData.value - (kpiData.previousValue || 0)
      const expectedChangePercent = ((expectedChange / (kpiData.previousValue || 1)) * 100)

      expect(Math.abs(kpiData.change - expectedChange)).toBeLessThan(1) // Allow for rounding
      expect(Math.abs(kpiData.changePercent - expectedChangePercent)).toBeLessThan(1) // Allow for rounding
    })

    it('sets appropriate units for different KPI types', () => {
      const revenueKPI = generateMockKPIData('revenue', 'Monthly Revenue')
      const rateKPI = generateMockKPIData('rate', 'Conversion Rate')
      const countKPI = generateMockKPIData('count', 'User Count')

      expect(revenueKPI.unit).toBe('$')
      expect(rateKPI.unit).toBe('%')
      expect(countKPI.unit).toBe('')
    })

    it('sets status based on change percentage', () => {
      // Run multiple times to test different scenarios
      const results = Array.from({ length: 20 }, () => 
        generateMockKPIData('test', 'Test KPI')
      )

      // Should have a mix of statuses
      const statuses = results.map(r => r.status)
      const uniqueStatuses = [...new Set(statuses)]
      
      expect(uniqueStatuses.length).toBeGreaterThan(0)
      uniqueStatuses.forEach(status => {
        expect(['good', 'warning', 'critical']).toContain(status)
      })
    })
  })

  describe('generateMockChartData', () => {
    it('generates chart data with correct number of points', () => {
      const chartData = generateMockChartData(5)

      expect(chartData).toHaveLength(5)
    })

    it('generates chart data with default number of points', () => {
      const chartData = generateMockChartData()

      expect(chartData).toHaveLength(10)
    })

    it('generates valid chart data points', () => {
      const chartData = generateMockChartData(3)

      chartData.forEach(point => {
        expect(point.x).toBeInstanceOf(Date)
        expect(typeof point.y).toBe('number')
        expect(typeof point.label).toBe('string')
      })
    })

    it('generates chronological timestamps', () => {
      const chartData = generateMockChartData(5)

      for (let i = 1; i < chartData.length; i++) {
        const prevTime = new Date(chartData[i - 1].x).getTime()
        const currentTime = new Date(chartData[i].x).getTime()
        expect(currentTime).toBeGreaterThan(prevTime)
      }
    })

    it('generates reasonable value ranges', () => {
      const chartData = generateMockChartData(10)

      chartData.forEach(point => {
        expect(point.y).toBeGreaterThan(0)
        expect(point.y).toBeLessThan(200) // Based on the generation logic
      })
    })
  })

  describe('generateSampleWidgets', () => {
    it('generates sample widgets', () => {
      const widgets = generateSampleWidgets()

      expect(Array.isArray(widgets)).toBe(true)
      expect(widgets.length).toBeGreaterThan(0)
    })

    it('generates widgets with required properties', () => {
      const widgets = generateSampleWidgets()

      widgets.forEach(widget => {
        expect(widget.id).toBeDefined()
        expect(widget.title).toBeDefined()
        expect(widget.type).toBeDefined()
        expect(widget.size).toBeDefined()
        expect(typeof widget.realTimeEnabled).toBe('boolean')
        expect(widget.lastUpdated).toBeInstanceOf(Date)
      })
    })

    it('generates mix of widget types', () => {
      const widgets = generateSampleWidgets()
      const types = widgets.map(w => w.type)
      const uniqueTypes = [...new Set(types)]

      expect(uniqueTypes.length).toBeGreaterThan(1)
      expect(uniqueTypes).toContain('kpi')
      expect(uniqueTypes).toContain('chart')
    })

    it('generates mix of real-time enabled widgets', () => {
      const widgets = generateSampleWidgets()
      const realTimeEnabled = widgets.filter(w => w.realTimeEnabled)
      const realTimeDisabled = widgets.filter(w => !w.realTimeEnabled)

      expect(realTimeEnabled.length).toBeGreaterThan(0)
      expect(realTimeDisabled.length).toBeGreaterThan(0)
    })

    it('generates widgets with valid configurations', () => {
      const widgets = generateSampleWidgets()

      widgets.forEach(widget => {
        if (widget.config) {
          if (widget.config.chartType) {
            expect(['line', 'area', 'bar', 'doughnut', 'pie']).toContain(widget.config.chartType)
          }
          if (widget.config.refreshInterval) {
            expect(widget.config.refreshInterval).toBeGreaterThan(0)
          }
          if (widget.config.colors) {
            expect(typeof widget.config.colors.primary).toBe('string')
          }
        }
      })
    })
  })

  describe('updateWidgetData', () => {
    it('updates KPI widget data', () => {
      const originalWidget: WidgetData = {
        id: 'kpi-widget',
        title: 'Test KPI',
        type: 'kpi',
        size: 'medium',
        data: generateMockKPIData('test', 'Test KPI'),
        lastUpdated: new Date('2024-01-01')
      }

      const updatedWidget = updateWidgetData(originalWidget)

      expect(updatedWidget.id).toBe(originalWidget.id)
      expect(updatedWidget.title).toBe(originalWidget.title)
      expect(updatedWidget.type).toBe(originalWidget.type)
      expect(updatedWidget.data).toBeDefined()
      expect(updatedWidget.lastUpdated).not.toEqual(originalWidget.lastUpdated)
    })

    it('updates chart widget data for time series', () => {
      const originalWidget: WidgetData = {
        id: 'chart-widget',
        title: 'Test Chart',
        type: 'chart',
        size: 'large',
        data: generateMockChartData(5),
        config: { chartType: 'line' },
        lastUpdated: new Date('2024-01-01')
      }

      const updatedWidget = updateWidgetData(originalWidget)

      expect(updatedWidget.id).toBe(originalWidget.id)
      expect(Array.isArray(updatedWidget.data)).toBe(true)
      expect(updatedWidget.data).toHaveLength(6) // Should add one point
      expect(updatedWidget.lastUpdated).not.toEqual(originalWidget.lastUpdated)
    })

    it('does not update pie/doughnut chart data', () => {
      const originalWidget: WidgetData = {
        id: 'pie-widget',
        title: 'Test Pie',
        type: 'chart',
        size: 'medium',
        data: [
          { x: 'A', y: 30, label: 'A' },
          { x: 'B', y: 70, label: 'B' }
        ],
        config: { chartType: 'pie' },
        lastUpdated: new Date('2024-01-01')
      }

      const updatedWidget = updateWidgetData(originalWidget)

      expect(updatedWidget).toBe(originalWidget) // Should return same object
    })

    it('maintains data length limit for time series', () => {
      const longData = Array.from({ length: 20 }, (_, i) => ({
        x: new Date(Date.now() - (20 - i) * 60000),
        y: Math.random() * 100
      }))

      const originalWidget: WidgetData = {
        id: 'chart-widget',
        title: 'Test Chart',
        type: 'chart',
        size: 'large',
        data: longData,
        config: { chartType: 'line' },
        lastUpdated: new Date('2024-01-01')
      }

      const updatedWidget = updateWidgetData(originalWidget)

      expect(Array.isArray(updatedWidget.data)).toBe(true)
      expect(updatedWidget.data.length).toBeLessThanOrEqual(15) // Should limit to 15 points
    })

    it('returns unchanged widget for unsupported types', () => {
      const originalWidget: WidgetData = {
        id: 'list-widget',
        title: 'Test List',
        type: 'list',
        size: 'small',
        items: ['Item 1', 'Item 2'],
        lastUpdated: new Date('2024-01-01')
      }

      const updatedWidget = updateWidgetData(originalWidget)

      expect(updatedWidget).toBe(originalWidget) // Should return same object
    })
  })
})