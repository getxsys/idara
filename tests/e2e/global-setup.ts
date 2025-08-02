/**
 * Global setup for Playwright end-to-end tests
 * Prepares test environment and authentication
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...')

  // Create a browser instance for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Navigate to the application
    await page.goto('http://localhost:3000')

    // Wait for the application to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 })

    // Set up test user authentication
    await setupTestAuthentication(page)

    // Seed test data if needed
    await seedTestData(page)

    console.log('✅ Global E2E test setup completed')
  } catch (error) {
    console.error('❌ Global E2E test setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestAuthentication(page: any) {
  // Create test user session
  const testUser = {
    id: 'e2e-test-user',
    email: 'e2e-test@example.com',
    name: 'E2E Test User',
    role: 'admin'
  }

  // Store authentication state
  await page.evaluate((user) => {
    localStorage.setItem('test-user', JSON.stringify(user))
    localStorage.setItem('test-auth-token', 'mock-e2e-token')
  }, testUser)
}

async function seedTestData(page: any) {
  // Seed test data for E2E tests
  const testData = {
    projects: [
      {
        id: 'e2e-project-1',
        name: 'E2E Test Project',
        status: 'active',
        description: 'Project for end-to-end testing'
      }
    ],
    clients: [
      {
        id: 'e2e-client-1',
        name: 'E2E Test Client',
        email: 'client@e2etest.com',
        company: 'E2E Test Company'
      }
    ]
  }

  await page.evaluate((data) => {
    localStorage.setItem('test-data', JSON.stringify(data))
  }, testData)
}

export default globalSetup