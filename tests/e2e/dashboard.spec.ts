/**
 * End-to-end tests for dashboard functionality
 * Tests KPI widgets, real-time updates, and dashboard customization
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should display dashboard with KPI widgets', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-widget"]')).toHaveCount(4)
    
    // Check individual KPI widgets
    await expect(page.locator('[data-testid="revenue-widget"]')).toBeVisible()
    await expect(page.locator('[data-testid="projects-widget"]')).toBeVisible()
    await expect(page.locator('[data-testid="clients-widget"]')).toBeVisible()
    await expect(page.locator('[data-testid="tasks-widget"]')).toBeVisible()
  })

  test('should allow widget customization', async ({ page }) => {
    // Enter customization mode
    await page.click('[data-testid="customize-dashboard"]')
    await expect(page.locator('[data-testid="customization-mode"]')).toBeVisible()
    
    // Drag and drop widget
    const sourceWidget = page.locator('[data-testid="revenue-widget"]')
    const targetPosition = page.locator('[data-testid="widget-drop-zone"]').first()
    
    await sourceWidget.dragTo(targetPosition)
    
    // Save customization
    await page.click('[data-testid="save-customization"]')
    
    // Verify widget position changed
    await expect(page.locator('[data-testid="customization-saved"]')).toBeVisible()
  })

  test('should display real-time data updates', async ({ page }) => {
    // Get initial values
    const initialRevenue = await page.locator('[data-testid="revenue-value"]').textContent()
    
    // Simulate real-time update (this would normally come from WebSocket)
    await page.evaluate(() => {
      // Trigger a mock real-time update
      window.dispatchEvent(new CustomEvent('realtime-update', {
        detail: { type: 'revenue', value: 150000 }
      }))
    })
    
    // Wait for update
    await page.waitForTimeout(1000)
    
    // Check if value updated
    const updatedRevenue = await page.locator('[data-testid="revenue-value"]').textContent()
    expect(updatedRevenue).not.toBe(initialRevenue)
  })

  test('should handle responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible()
  })

  test('should display AI insights panel', async ({ page }) => {
    // Check AI insights panel
    await expect(page.locator('[data-testid="ai-insights-panel"]')).toBeVisible()
    
    // Check for AI-generated insights
    await expect(page.locator('[data-testid="ai-insight"]')).toHaveCount(3)
    
    // Test insight interaction
    await page.click('[data-testid="ai-insight"]').first()
    await expect(page.locator('[data-testid="insight-details"]')).toBeVisible()
  })

  test('should handle chart interactions', async ({ page }) => {
    // Check chart widget
    await expect(page.locator('[data-testid="chart-widget"]')).toBeVisible()
    
    // Test chart hover
    await page.hover('[data-testid="chart-data-point"]')
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
    
    // Test chart zoom
    await page.click('[data-testid="chart-zoom-in"]')
    await expect(page.locator('[data-testid="chart-zoomed"]')).toBeVisible()
  })

  test('should search and filter dashboard data', async ({ page }) => {
    // Test search functionality
    await page.fill('[data-testid="dashboard-search"]', 'revenue')
    await page.press('[data-testid="dashboard-search"]', 'Enter')
    
    // Check filtered results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-widget"]')).toBeVisible()
    
    // Test date filter
    await page.click('[data-testid="date-filter"]')
    await page.click('[data-testid="last-30-days"]')
    
    // Verify data updated
    await expect(page.locator('[data-testid="filter-applied"]')).toBeVisible()
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/dashboard/data', route => {
      route.fulfill({ status: 500, body: 'Server Error' })
    })
    
    // Refresh to trigger error
    await page.reload()
    
    // Check error handling
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // Test retry functionality
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="loading-state"]')).toBeVisible()
  })
})