/**
 * Screen reader compatibility tests
 * Tests ARIA attributes, semantic markup, and screen reader announcements
 */

import { test, expect } from '@playwright/test'

test.describe('Screen Reader Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before screen reader tests
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should have proper page structure for screen readers', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for single h1
    const h1Elements = await page.locator('h1').all()
    expect(h1Elements.length).toBe(1)
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(1)
    
    // Verify heading levels are logical
    let previousLevel = 0
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
      const currentLevel = parseInt(tagName.charAt(1))
      
      if (previousLevel > 0) {
        // Heading levels shouldn't skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
      }
      previousLevel = currentLevel
    }
  })

  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]')
    await expect(main).toBeVisible()
    expect(await main.count()).toBe(1)
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]')
    await expect(nav).toBeVisible()
    
    // Check for banner (header)
    const banner = page.locator('header, [role="banner"]')
    await expect(banner).toBeVisible()
    
    // Check for contentinfo (footer) if present
    const footer = page.locator('footer, [role="contentinfo"]')
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible()
    }
    
    // Check for complementary regions (sidebars)
    const aside = page.locator('aside, [role="complementary"]')
    if (await aside.count() > 0) {
      await expect(aside).toBeVisible()
    }
  })

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    const form = page.locator('[data-testid="create-project-form"]')
    await expect(form).toBeVisible()
    
    // Check all form inputs have labels
    const inputs = await form.locator('input, select, textarea').all()
    
    for (const input of inputs) {
      const inputId = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')
      
      // Input should have one of these labeling methods
      const hasLabel = ariaLabel || 
                      ariaLabelledby || 
                      (inputId && await page.locator(`label[for="${inputId}"]`).count() > 0)
      
      expect(hasLabel).toBeTruthy()
    }
    
    // Check required fields are marked
    const requiredInputs = await form.locator('input[required], select[required], textarea[required]').all()
    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required')
      expect(ariaRequired).toBe('true')
    }
  })

  test('should announce form validation errors', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    // Submit form without filling required fields
    await page.click('[data-testid="create-project-submit"]')
    
    // Check for error announcements
    const errorMessages = await page.locator('[role="alert"], [aria-live="assertive"]').all()
    expect(errorMessages.length).toBeGreaterThan(0)
    
    for (const error of errorMessages) {
      await expect(error).toBeVisible()
      const errorText = await error.textContent()
      expect(errorText?.trim()).toBeTruthy()
    }
    
    // Check that errors are associated with form fields
    const inputsWithErrors = await page.locator('input[aria-describedby], select[aria-describedby], textarea[aria-describedby]').all()
    expect(inputsWithErrors.length).toBeGreaterThan(0)
  })

  test('should have accessible button descriptions', async ({ page }) => {
    await page.goto('/dashboard')
    
    const buttons = await page.locator('button').all()
    
    for (const button of buttons) {
      const buttonText = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledby = await button.getAttribute('aria-labelledby')
      const title = await button.getAttribute('title')
      
      // Button should have accessible text
      const hasAccessibleName = buttonText?.trim() || ariaLabel || ariaLabelledby || title
      expect(hasAccessibleName).toBeTruthy()
      
      // Icon-only buttons should have aria-label
      if (!buttonText?.trim()) {
        expect(ariaLabel || title).toBeTruthy()
      }
    }
  })

  test('should have accessible data tables', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    const table = page.locator('table, [role="table"]')
    if (await table.count() > 0) {
      // Table should have caption or aria-label
      const caption = table.locator('caption')
      const ariaLabel = await table.getAttribute('aria-label')
      const ariaLabelledby = await table.getAttribute('aria-labelledby')
      
      expect(await caption.count() > 0 || ariaLabel || ariaLabelledby).toBeTruthy()
      
      // Check table headers
      const headers = await table.locator('th, [role="columnheader"]').all()
      expect(headers.length).toBeGreaterThan(0)
      
      for (const header of headers) {
        const headerText = await header.textContent()
        const scope = await header.getAttribute('scope')
        
        expect(headerText?.trim()).toBeTruthy()
        expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(scope)
      }
    }
  })

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').all()
    expect(liveRegions.length).toBeGreaterThan(0)
    
    // Test status updates
    const statusRegion = page.locator('[aria-live="polite"], [role="status"]')
    if (await statusRegion.count() > 0) {
      await expect(statusRegion).toBeVisible()
    }
    
    // Test alert announcements
    const alertRegion = page.locator('[aria-live="assertive"], [role="alert"]')
    
    // Trigger an action that should create an announcement
    await page.click('[data-testid="refresh-data"]')
    
    // Wait for announcement
    await page.waitForTimeout(1000)
    
    if (await alertRegion.count() > 0) {
      const alertText = await alertRegion.textContent()
      expect(alertText?.trim()).toBeTruthy()
    }
  })

  test('should have accessible modal dialogs', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    const modal = page.locator('[role="dialog"], [role="alertdialog"]')
    await expect(modal).toBeVisible()
    
    // Modal should have accessible name
    const ariaLabel = await modal.getAttribute('aria-label')
    const ariaLabelledby = await modal.getAttribute('aria-labelledby')
    expect(ariaLabel || ariaLabelledby).toBeTruthy()
    
    // Modal should have description if needed
    const ariaDescribedby = await modal.getAttribute('aria-describedby')
    if (ariaDescribedby) {
      const description = page.locator(`#${ariaDescribedby}`)
      await expect(description).toBeVisible()
    }
    
    // Modal should be marked as modal
    const ariaModal = await modal.getAttribute('aria-modal')
    expect(ariaModal).toBe('true')
  })

  test('should have accessible navigation menus', async ({ page }) => {
    await page.goto('/dashboard')
    
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Navigation should have accessible name
    const navLabel = await nav.getAttribute('aria-label')
    const navLabelledby = await nav.getAttribute('aria-labelledby')
    expect(navLabel || navLabelledby).toBeTruthy()
    
    // Check for menu structure
    const menuItems = await nav.locator('[role="menuitem"], a').all()
    expect(menuItems.length).toBeGreaterThan(0)
    
    // Check current page indication
    const currentItem = nav.locator('[aria-current="page"], [aria-current="true"], .active')
    if (await currentItem.count() > 0) {
      await expect(currentItem).toBeVisible()
    }
  })

  test('should have accessible progress indicators', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    const progressBars = await page.locator('[role="progressbar"], progress').all()
    
    for (const progress of progressBars) {
      // Progress should have accessible name
      const ariaLabel = await progress.getAttribute('aria-label')
      const ariaLabelledby = await progress.getAttribute('aria-labelledby')
      expect(ariaLabel || ariaLabelledby).toBeTruthy()
      
      // Progress should have value information
      const ariaValuenow = await progress.getAttribute('aria-valuenow')
      const ariaValuemin = await progress.getAttribute('aria-valuemin')
      const ariaValuemax = await progress.getAttribute('aria-valuemax')
      
      if (ariaValuenow) {
        expect(ariaValuemin).toBeTruthy()
        expect(ariaValuemax).toBeTruthy()
        expect(parseInt(ariaValuenow)).toBeGreaterThanOrEqual(parseInt(ariaValuemin || '0'))
        expect(parseInt(ariaValuenow)).toBeLessThanOrEqual(parseInt(ariaValuemax || '100'))
      }
    }
  })

  test('should have accessible loading states', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Trigger loading state
    await page.click('[data-testid="refresh-data"]')
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('[aria-busy="true"], [role="status"]').all()
    
    if (loadingIndicators.length > 0) {
      for (const indicator of loadingIndicators) {
        // Loading indicator should have accessible text
        const ariaLabel = await indicator.getAttribute('aria-label')
        const text = await indicator.textContent()
        expect(ariaLabel || text?.trim()).toBeTruthy()
      }
    }
  })

  test('should have accessible error states', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/dashboard/data', route => {
      route.fulfill({ status: 500, body: 'Server Error' })
    })
    
    await page.goto('/dashboard')
    
    // Check for error announcements
    const errorAlerts = await page.locator('[role="alert"]').all()
    
    if (errorAlerts.length > 0) {
      for (const alert of errorAlerts) {
        await expect(alert).toBeVisible()
        const alertText = await alert.textContent()
        expect(alertText?.trim()).toBeTruthy()
        expect(alertText?.toLowerCase()).toContain('error')
      }
    }
  })

  test('should have accessible tooltips', async ({ page }) => {
    await page.goto('/dashboard')
    
    const elementsWithTooltips = await page.locator('[title], [aria-describedby]').all()
    
    for (const element of elementsWithTooltips) {
      const title = await element.getAttribute('title')
      const ariaDescribedby = await element.getAttribute('aria-describedby')
      
      if (title) {
        expect(title.trim()).toBeTruthy()
      }
      
      if (ariaDescribedby) {
        const tooltip = page.locator(`#${ariaDescribedby}`)
        // Tooltip content should exist (may not be visible until hover)
        expect(await tooltip.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should support screen reader shortcuts', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test heading navigation (H key in screen readers)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(1)
    
    // Test landmark navigation (D key for landmarks)
    const landmarks = await page.locator('main, nav, aside, header, footer, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]').all()
    expect(landmarks.length).toBeGreaterThan(1)
    
    // Test form field navigation (F key for form fields)
    const formFields = await page.locator('input, select, textarea, button').all()
    expect(formFields.length).toBeGreaterThan(0)
    
    // Test link navigation (K key for links)
    const links = await page.locator('a[href]').all()
    expect(links.length).toBeGreaterThan(0)
  })
})