/**
 * Mobile accessibility tests
 * Tests touch target sizes, mobile navigation, and mobile-specific accessibility features
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Login before mobile accessibility tests
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should have minimum touch target sizes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Get all interactive elements
    const interactiveElements = await page.locator(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    ).all()
    
    expect(interactiveElements.length).toBeGreaterThan(0)
    
    // Check each element meets minimum touch target size (44x44px)
    for (const element of interactiveElements) {
      const boundingBox = await element.boundingBox()
      
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44)
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]')
    await expect(viewportMeta).toHaveCount(1)
    
    const content = await viewportMeta.getAttribute('content')
    expect(content).toContain('width=device-width')
    expect(content).toContain('initial-scale=1')
  })

  test('should have accessible mobile navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for mobile menu toggle
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]')
    if (await mobileMenuToggle.isVisible()) {
      // Menu toggle should have accessible name
      const ariaLabel = await mobileMenuToggle.getAttribute('aria-label')
      const text = await mobileMenuToggle.textContent()
      expect(ariaLabel || text?.trim()).toBeTruthy()
      
      // Menu should be initially closed
      const ariaExpanded = await mobileMenuToggle.getAttribute('aria-expanded')
      expect(ariaExpanded).toBe('false')
      
      // Open mobile menu
      await mobileMenuToggle.click()
      
      // Menu should now be expanded
      const expandedState = await mobileMenuToggle.getAttribute('aria-expanded')
      expect(expandedState).toBe('true')
      
      // Mobile menu should be visible
      const mobileMenu = page.locator('[data-testid="mobile-sidebar"]')
      await expect(mobileMenu).toBeVisible()
      
      // Menu items should be accessible
      const menuItems = await mobileMenu.locator('a, button, [role="menuitem"]').all()
      expect(menuItems.length).toBeGreaterThan(0)
      
      for (const item of menuItems) {
        const itemText = await item.textContent()
        const itemLabel = await item.getAttribute('aria-label')
        expect(itemText?.trim() || itemLabel).toBeTruthy()
      }
    }
  })

  test('should support swipe gestures for navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test horizontal swipe on carousel or tabs if present
    const carousel = page.locator('[data-testid="dashboard-carousel"]')
    if (await carousel.isVisible()) {
      const initialPosition = await carousel.evaluate(el => el.scrollLeft)
      
      // Simulate swipe left
      await carousel.hover()
      await page.mouse.down()
      await page.mouse.move(100, 0)
      await page.mouse.up()
      
      await page.waitForTimeout(500)
      const newPosition = await carousel.evaluate(el => el.scrollLeft)
      expect(newPosition).not.toBe(initialPosition)
    }
  })

  test('should handle orientation changes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test portrait orientation
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
    
    // Test landscape orientation
    await page.setViewportSize({ width: 667, height: 375 })
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
    
    // Content should remain accessible in both orientations
    const interactiveElements = await page.locator('button, a, input').all()
    expect(interactiveElements.length).toBeGreaterThan(0)
  })

  test('should have accessible mobile forms', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    const form = page.locator('[data-testid="create-project-form"]')
    await expect(form).toBeVisible()
    
    // Form inputs should be large enough for mobile
    const inputs = await form.locator('input, select, textarea').all()
    
    for (const input of inputs) {
      const boundingBox = await input.boundingBox()
      
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
      }
      
      // Input should have proper input type for mobile keyboards
      const inputType = await input.getAttribute('type')
      const inputMode = await input.getAttribute('inputmode')
      
      if (inputType === 'email' || inputMode === 'email') {
        expect(['email', 'email']).toContain(inputType || inputMode)
      }
    }
  })

  test('should support zoom up to 200% without horizontal scrolling', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Set zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })
    
    await page.waitForTimeout(500)
    
    // Check that content doesn't cause horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth * 2.1) // Allow small margin
    
    // Interactive elements should still be accessible
    const buttons = await page.locator('button').all()
    for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
      await expect(button).toBeVisible()
    }
  })

  test('should have accessible mobile modals', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    const modal = page.locator('[data-testid="create-project-dialog"]')
    await expect(modal).toBeVisible()
    
    // Modal should fill most of the screen on mobile
    const modalBox = await modal.boundingBox()
    const viewport = page.viewportSize()
    
    if (modalBox && viewport) {
      expect(modalBox.width).toBeGreaterThan(viewport.width * 0.8)
    }
    
    // Modal should be scrollable if content is too long
    const modalContent = modal.locator('[data-testid="modal-content"]')
    if (await modalContent.isVisible()) {
      const overflowY = await modalContent.evaluate(el => 
        window.getComputedStyle(el).overflowY
      )
      expect(['auto', 'scroll', 'visible']).toContain(overflowY)
    }
    
    // Close button should be easily accessible
    const closeButton = modal.locator('[data-testid="close-modal"]')
    if (await closeButton.isVisible()) {
      const closeBox = await closeButton.boundingBox()
      expect(closeBox?.width).toBeGreaterThanOrEqual(44)
      expect(closeBox?.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('should support voice control accessibility', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Elements should have accessible names for voice control
    const buttons = await page.locator('button').all()
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()
      const title = await button.getAttribute('title')
      
      // Button should have a clear, unique name
      const accessibleName = ariaLabel || text?.trim() || title
      expect(accessibleName).toBeTruthy()
      expect(accessibleName?.length).toBeGreaterThan(2)
    }
    
    // Links should have descriptive text
    const links = await page.locator('a[href]').all()
    
    for (const link of links) {
      const linkText = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      
      const accessibleName = ariaLabel || linkText?.trim()
      expect(accessibleName).toBeTruthy()
      
      // Avoid generic link text
      const genericTexts = ['click here', 'read more', 'link', 'here']
      const isGeneric = genericTexts.some(generic => 
        accessibleName?.toLowerCase().includes(generic)
      )
      expect(isGeneric).toBe(false)
    }
  })

  test('should handle mobile keyboard interactions', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    const nameInput = page.locator('input[name="name"]')
    await nameInput.focus()
    
    // Virtual keyboard should not obscure focused input
    await page.evaluate(() => {
      // Simulate virtual keyboard appearance
      window.visualViewport?.addEventListener('resize', () => {
        const focusedElement = document.activeElement as HTMLElement
        if (focusedElement) {
          focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    })
    
    await nameInput.type('Test Project')
    await expect(nameInput).toHaveValue('Test Project')
    
    // Input should remain visible and focused
    await expect(nameInput).toBeFocused()
    await expect(nameInput).toBeInViewport()
  })

  test('should have accessible mobile tables', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    const table = page.locator('table, [role="table"]')
    if (await table.isVisible()) {
      // Table should be horizontally scrollable on mobile
      const overflowX = await table.evaluate(el => 
        window.getComputedStyle(el).overflowX
      )
      expect(['auto', 'scroll']).toContain(overflowX)
      
      // Table headers should be sticky or clearly visible
      const headers = await table.locator('th, [role="columnheader"]').all()
      for (const header of headers) {
        const headerText = await header.textContent()
        expect(headerText?.trim()).toBeTruthy()
      }
      
      // Table should have accessible navigation
      const tableContainer = table.locator('xpath=..')
      const ariaLabel = await tableContainer.getAttribute('aria-label')
      const caption = table.locator('caption')
      
      expect(ariaLabel || await caption.count() > 0).toBeTruthy()
    }
  })

  test('should support reduced motion on mobile', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')
    
    // Animations should be disabled or minimal
    const animatedElements = await page.locator('[class*="animate"], [style*="transition"]').all()
    
    for (const element of animatedElements) {
      const animationDuration = await element.evaluate(el => 
        window.getComputedStyle(el).animationDuration
      )
      const transitionDuration = await element.evaluate(el => 
        window.getComputedStyle(el).transitionDuration
      )
      
      // Animations should be very short or disabled
      expect(animationDuration === '0s' || parseFloat(animationDuration) < 0.2).toBe(true)
      expect(transitionDuration === '0s' || parseFloat(transitionDuration) < 0.2).toBe(true)
    }
  })

  test('should handle mobile-specific gestures accessibly', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test pull-to-refresh if implemented
    const refreshArea = page.locator('[data-testid="pull-to-refresh"]')
    if (await refreshArea.isVisible()) {
      // Should have accessible alternative
      const refreshButton = page.locator('[data-testid="refresh-button"]')
      await expect(refreshButton).toBeVisible()
      
      const ariaLabel = await refreshButton.getAttribute('aria-label')
      expect(ariaLabel).toContain('refresh')
    }
    
    // Test swipe actions have keyboard alternatives
    const swipeableItems = await page.locator('[data-testid*="swipe"]').all()
    for (const item of swipeableItems) {
      // Should have accessible action buttons
      const actionButtons = await item.locator('button').all()
      expect(actionButtons.length).toBeGreaterThan(0)
    }
  })
})