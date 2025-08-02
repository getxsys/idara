/**
 * WCAG compliance tests for accessibility
 * Tests compliance with Web Content Accessibility Guidelines
 */

import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from '@axe-core/playwright'
import { AccessibilityTester, assertAccessibility, ACCESSIBILITY_TAGS } from '../../src/lib/test-utils/accessibility'

test.describe('WCAG Compliance Tests', () => {
  let accessibilityTester: AccessibilityTester

  test.beforeEach(async ({ page }) => {
    accessibilityTester = new AccessibilityTester(page)
    
    // Login before accessibility tests
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should pass WCAG 2.1 AA compliance on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await injectAxe(page)

    // Run comprehensive accessibility check
    await checkA11y(page, null, {
      tags: [ACCESSIBILITY_TAGS.WCAG21AA],
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true }
      }
    })

    // Additional custom checks
    const results = await accessibilityTester.runAxeAnalysis(null, {
      tags: [ACCESSIBILITY_TAGS.WCAG21AA]
    })

    assertAccessibility(results, 'AA')
  })

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/dashboard')
    
    const screenReaderTest = await accessibilityTester.testScreenReaderCompatibility()
    expect(screenReaderTest.hasHeadingStructure).toBe(true)

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)

    // Verify h1 exists and is unique
    const h1Elements = await page.locator('h1').all()
    expect(h1Elements.length).toBe(1)
  })

  test('should have proper ARIA labels and landmarks', async ({ page }) => {
    await page.goto('/dashboard')
    
    const screenReaderTest = await accessibilityTester.testScreenReaderCompatibility()
    expect(screenReaderTest.hasAriaLabels).toBe(true)
    expect(screenReaderTest.hasLandmarks).toBe(true)

    // Check for main landmark
    await expect(page.locator('main, [role="main"]')).toBeVisible()

    // Check for navigation landmark
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible()

    // Check interactive elements have accessible names
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent() ||
                            await button.getAttribute('title')
      expect(accessibleName).toBeTruthy()
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    const keyboardTest = await accessibilityTester.testKeyboardNavigation()
    expect(keyboardTest.focusableElements.length).toBeGreaterThan(0)
    expect(keyboardTest.tabOrder.length).toBeGreaterThan(0)

    // Test tab navigation through main elements
    await page.keyboard.press('Tab')
    let focusedElement = await page.locator(':focus').first()
    expect(focusedElement).toBeVisible()

    // Test skip link functionality
    await page.keyboard.press('Tab')
    const skipLink = page.locator('[data-testid="skip-link"]')
    if (await skipLink.isVisible()) {
      await page.keyboard.press('Enter')
      const mainContent = page.locator('main')
      await expect(mainContent).toBeFocused()
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard')
    await injectAxe(page)

    // Test color contrast specifically
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })

    const contrastTest = await accessibilityTester.testColorContrast()
    expect(contrastTest.violations.length).toBe(0)
  })

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')

    await injectAxe(page)
    await checkA11y(page.locator('[data-testid="create-project-dialog"]'), null, {
      tags: [ACCESSIBILITY_TAGS.WCAG21AA]
    })

    // Check form labels
    const formInputs = await page.locator('input, select, textarea').all()
    for (const input of formInputs) {
      const hasLabel = await input.getAttribute('aria-label') ||
                      await input.getAttribute('aria-labelledby') ||
                      await page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0

      expect(hasLabel).toBeTruthy()
    }

    // Check error message accessibility
    await page.click('[data-testid="create-project-submit"]') // Submit empty form
    const errorMessages = await page.locator('[role="alert"], .error-message').all()
    for (const error of errorMessages) {
      expect(await error.isVisible()).toBe(true)
      expect(await error.getAttribute('aria-live')).toBeTruthy()
    }
  })

  test('should handle focus management in modals', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    // Open modal
    await page.click('[data-testid="create-project-button"]')
    const modal = page.locator('[data-testid="create-project-dialog"]')
    await expect(modal).toBeVisible()

    // Check focus is trapped in modal
    const firstFocusable = modal.locator('button, input, select, textarea').first()
    await expect(firstFocusable).toBeFocused()

    // Test escape key closes modal
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()

    // Check focus returns to trigger element
    const triggerButton = page.locator('[data-testid="create-project-button"]')
    await expect(triggerButton).toBeFocused()
  })

  test('should provide proper image alt text', async ({ page }) => {
    await page.goto('/dashboard')
    
    const screenReaderTest = await accessibilityTester.testScreenReaderCompatibility()
    expect(screenReaderTest.hasAltText).toBe(true)

    // Check all images have alt text
    const images = await page.locator('img').all()
    for (const img of images) {
      const altText = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const role = await img.getAttribute('role')
      
      // Images should have alt text, aria-label, or be marked as decorative
      expect(altText !== null || ariaLabel !== null || role === 'presentation').toBe(true)
    }
  })

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all()
    expect(liveRegions.length).toBeGreaterThan(0)

    // Test dynamic content announcements
    await page.click('[data-testid="refresh-data"]')
    const statusMessage = page.locator('[role="status"]')
    await expect(statusMessage).toBeVisible()
    expect(await statusMessage.textContent()).toContain('updated')
  })

  test('should be accessible on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    const mobileTest = await accessibilityTester.testMobileAccessibility()
    expect(mobileTest.viewportMeta).toBe(true)
    expect(mobileTest.touchTargetSize).toBe(true)

    await injectAxe(page)
    await checkA11y(page, null, {
      tags: [ACCESSIBILITY_TAGS.WCAG21AA]
    })

    // Test mobile navigation accessibility
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"]')
    if (await mobileMenuButton.isVisible()) {
      expect(await mobileMenuButton.getAttribute('aria-expanded')).toBe('false')
      
      await mobileMenuButton.click()
      expect(await mobileMenuButton.getAttribute('aria-expanded')).toBe('true')
      
      const mobileMenu = page.locator('[data-testid="mobile-sidebar"]')
      await expect(mobileMenu).toBeVisible()
    }
  })

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: white !important;
            color: black !important;
            border: 1px solid black !important;
          }
        }
      `
    })

    await page.goto('/dashboard')
    await injectAxe(page)
    await checkA11y(page, null, {
      tags: [ACCESSIBILITY_TAGS.WCAG21AA]
    })
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')

    // Check that animations are disabled or reduced
    const animatedElements = await page.locator('[class*="animate"], [style*="transition"]').all()
    for (const element of animatedElements) {
      const computedStyle = await element.evaluate(el => {
        return window.getComputedStyle(el).animationDuration
      })
      
      // Animations should be disabled or very short
      expect(computedStyle === '0s' || computedStyle === 'none').toBe(true)
    }
  })

  test('should generate accessibility report', async ({ page }) => {
    await page.goto('/dashboard')
    
    const results = await accessibilityTester.runAxeAnalysis(null, {
      tags: [ACCESSIBILITY_TAGS.WCAG21AA]
    })

    const report = await accessibilityTester.generateAccessibilityReport(results)
    expect(report).toContain('# Accessibility Test Report')
    expect(report).toContain('## Summary')
    
    // Save report for review
    console.log('Accessibility Report:', report)
  })
})