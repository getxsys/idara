/**
 * Performance and load testing for critical application features
 * Tests response times, memory usage, and concurrent user scenarios
 */

import { test, expect } from '@playwright/test'
import { PerformanceTester, PERFORMANCE_THRESHOLDS, assertPerformance } from '../../src/lib/test-utils/performance'

test.describe('Performance Testing', () => {
  let performanceTester: PerformanceTester

  test.beforeEach(async ({ page }) => {
    performanceTester = new PerformanceTester()
    
    // Login before performance tests
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should load dashboard within performance threshold', async ({ page }) => {
    const { metrics } = await performanceTester.measureFunction(async () => {
      await page.goto('/dashboard')
      await page.waitForSelector('[data-testid="dashboard-grid"]')
    })

    // Assert dashboard loads within 2 seconds
    assertPerformance(metrics, 2000, 'Dashboard Load')
    
    // Check for performance marks
    const performanceMarks = await page.evaluate(() => {
      return performance.getEntriesByType('mark').map(mark => ({
        name: mark.name,
        startTime: mark.startTime
      }))
    })
    
    expect(performanceMarks.length).toBeGreaterThan(0)
  })

  test('should handle API requests within threshold', async ({ page }) => {
    // Measure API response time
    const apiResponseTime = await page.evaluate(async () => {
      const start = performance.now()
      const response = await fetch('/api/dashboard/data')
      const end = performance.now()
      return end - start
    })

    expect(apiResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE)
  })

  test('should render large datasets efficiently', async ({ page }) => {
    // Navigate to projects with large dataset
    await page.goto('/dashboard/projects')
    
    const { metrics } = await performanceTester.measureFunction(async () => {
      // Simulate loading 1000 projects
      await page.evaluate(() => {
        const mockProjects = Array.from({ length: 1000 }, (_, i) => ({
          id: `project-${i}`,
          name: `Project ${i}`,
          status: 'active',
          progress: Math.random() * 100
        }))
        
        // Trigger re-render with large dataset
        window.dispatchEvent(new CustomEvent('load-large-dataset', {
          detail: { projects: mockProjects }
        }))
      })
      
      await page.waitForSelector('[data-testid="projects-loaded"]')
    })

    // Should render within 1 second even with large dataset
    assertPerformance(metrics, 1000, 'Large Dataset Render')
  })

  test('should handle concurrent user interactions', async ({ page, context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ])

    // Login all pages
    for (const p of pages) {
      await p.goto('/')
      await p.fill('input[name="email"]', 'test@example.com')
      await p.fill('input[name="password"]', 'password123')
      await p.click('button[type="submit"]')
    }

    // Simulate concurrent operations
    const concurrentOperations = pages.map(async (p, index) => {
      return performanceTester.measureFunction(async () => {
        await p.goto('/dashboard/projects')
        await p.click('[data-testid="create-project-button"]')
        await p.fill('input[name="name"]', `Concurrent Project ${index}`)
        await p.click('[data-testid="create-project-submit"]')
        await p.waitForSelector('[data-testid="project-created-toast"]')
      })
    })

    const results = await Promise.all(concurrentOperations)
    
    // All operations should complete within reasonable time
    results.forEach((result, index) => {
      assertPerformance(result.metrics, 3000, `Concurrent Operation ${index}`)
    })

    // Cleanup
    await Promise.all(pages.map(p => p.close()))
  })

  test('should maintain performance during real-time updates', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Start performance monitoring
    await page.evaluate(() => {
      window.performanceMetrics = []
      
      // Monitor frame rate
      let frameCount = 0
      function countFrames() {
        frameCount++
        requestAnimationFrame(countFrames)
      }
      countFrames()
      
      // Store frame count every second
      setInterval(() => {
        window.performanceMetrics.push({
          timestamp: Date.now(),
          fps: frameCount,
          memory: performance.memory?.usedJSHeapSize || 0
        })
        frameCount = 0
      }, 1000)
    })

    // Simulate real-time updates for 10 seconds
    for (let i = 0; i < 10; i++) {
      await page.evaluate((iteration) => {
        // Simulate WebSocket updates
        window.dispatchEvent(new CustomEvent('realtime-update', {
          detail: {
            type: 'dashboard-data',
            data: {
              revenue: 100000 + (iteration * 1000),
              projects: 50 + iteration,
              clients: 25 + iteration
            }
          }
        }))
      }, i)
      
      await page.waitForTimeout(1000)
    }

    // Check performance metrics
    const metrics = await page.evaluate(() => window.performanceMetrics)
    
    // Ensure FPS stays above 30 (smooth animation)
    const avgFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length
    expect(avgFps).toBeGreaterThan(30)
    
    // Ensure memory usage doesn't grow excessively
    const memoryGrowth = metrics[metrics.length - 1].memory - metrics[0].memory
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
  })

  test('should handle search performance with large datasets', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    // Load large dataset
    await page.evaluate(() => {
      const mockProjects = Array.from({ length: 5000 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        description: `Description for project ${i}`,
        status: ['active', 'completed', 'on-hold'][i % 3]
      }))
      
      window.dispatchEvent(new CustomEvent('load-search-dataset', {
        detail: { projects: mockProjects }
      }))
    })

    // Measure search performance
    const { metrics } = await performanceTester.measureFunction(async () => {
      await page.fill('[data-testid="project-search"]', 'Project 1234')
      await page.press('[data-testid="project-search"]', 'Enter')
      await page.waitForSelector('[data-testid="search-results"]')
    })

    // Search should complete within 200ms
    assertPerformance(metrics, PERFORMANCE_THRESHOLDS.SEARCH_QUERY, 'Search Performance')
  })

  test('should handle file upload performance', async ({ page }) => {
    await page.goto('/dashboard/documents')
    
    // Create a mock large file
    const fileContent = 'x'.repeat(1024 * 1024) // 1MB file
    
    const { metrics } = await performanceTester.measureFunction(async () => {
      // Simulate file upload
      await page.evaluate((content) => {
        const file = new File([content], 'test-file.txt', { type: 'text/plain' })
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.files = dataTransfer.files
          fileInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }, fileContent)
      
      await page.waitForSelector('[data-testid="upload-complete"]')
    })

    // File upload should complete within 5 seconds
    assertPerformance(metrics, PERFORMANCE_THRESHOLDS.FILE_UPLOAD, 'File Upload Performance')
  })

  test('should maintain performance during AI processing', async ({ page }) => {
    await page.goto('/dashboard/ai-insights')
    
    const { metrics } = await performanceTester.measureFunction(async () => {
      // Trigger AI query
      await page.fill('[data-testid="ai-query-input"]', 'What are the trends in our revenue?')
      await page.click('[data-testid="submit-query"]')
      await page.waitForSelector('[data-testid="ai-response"]')
    })

    // AI processing should complete within threshold
    assertPerformance(metrics, PERFORMANCE_THRESHOLDS.AI_PROCESSING, 'AI Processing Performance')
  })
})