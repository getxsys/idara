/**
 * Global teardown for Playwright end-to-end tests
 * Cleans up test environment and data
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...')

  // Create a browser instance for cleanup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Navigate to the application
    await page.goto('http://localhost:3000')

    // Clean up test data
    await cleanupTestData(page)

    // Clear authentication state
    await clearTestAuthentication(page)

    console.log('✅ Global E2E test teardown completed')
  } catch (error) {
    console.error('❌ Global E2E test teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  // Remove test data from localStorage
  await page.evaluate(() => {
    localStorage.removeItem('test-data')
    localStorage.removeItem('test-projects')
    localStorage.removeItem('test-clients')
    localStorage.removeItem('test-documents')
  })
}

async function clearTestAuthentication(page: any) {
  // Clear authentication state
  await page.evaluate(() => {
    localStorage.removeItem('test-user')
    localStorage.removeItem('test-auth-token')
    sessionStorage.clear()
  })
}

export default globalTeardown