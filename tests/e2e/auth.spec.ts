/**
 * End-to-end tests for authentication flows
 * Tests login, logout, registration, and MFA flows
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form on initial visit', async ({ page }) => {
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should register new user', async ({ page }) => {
    // Navigate to registration
    await page.click('[data-testid="register-link"]')
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()
    
    // Fill registration form
    await page.fill('input[name="name"]', 'New User')
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard or verification page
    await expect(page).toHaveURL(/\/(dashboard|verify)/)
  })

  test('should handle MFA setup flow', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to MFA setup
    await page.goto('/dashboard/settings/security')
    await page.click('[data-testid="setup-mfa-button"]')
    
    // Should show QR code
    await expect(page.locator('[data-testid="mfa-qr-code"]')).toBeVisible()
    
    // Enter verification code
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('[data-testid="verify-mfa-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="mfa-success"]')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
    
    // Reload page
    await page.reload()
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
    await expect(page).toHaveURL('/dashboard')
  })
})