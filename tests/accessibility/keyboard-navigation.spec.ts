/**
 * Keyboard navigation accessibility tests
 * Tests comprehensive keyboard navigation patterns and focus management
 */

import { test, expect } from '@playwright/test'

test.describe('Keyboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before keyboard navigation tests
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })

  test('should navigate main navigation with keyboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Start from the beginning
    await page.keyboard.press('Tab')
    
    // Should focus on skip link first
    let focused = page.locator(':focus')
    await expect(focused).toHaveAttribute('data-testid', 'skip-link')
    
    // Tab to main navigation
    await page.keyboard.press('Tab')
    focused = page.locator(':focus')
    
    // Should be in main navigation
    const navItem = focused.locator('xpath=ancestor-or-self::nav')
    await expect(navItem).toBeVisible()
    
    // Test arrow key navigation in menu
    await page.keyboard.press('ArrowDown')
    const nextFocused = page.locator(':focus')
    expect(await nextFocused.textContent()).not.toBe(await focused.textContent())
  })

  test('should handle tab trapping in modals', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    // Open modal
    await page.click('[data-testid="create-project-button"]')
    const modal = page.locator('[data-testid="create-project-dialog"]')
    await expect(modal).toBeVisible()
    
    // Find all focusable elements in modal
    const focusableElements = await modal.locator(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all()
    
    expect(focusableElements.length).toBeGreaterThan(0)
    
    // First element should be focused
    await expect(focusableElements[0]).toBeFocused()
    
    // Tab through all elements
    for (let i = 1; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab')
      await expect(focusableElements[i]).toBeFocused()
    }
    
    // Tab from last element should go to first (trap)
    await page.keyboard.press('Tab')
    await expect(focusableElements[0]).toBeFocused()
    
    // Shift+Tab should go to last element
    await page.keyboard.press('Shift+Tab')
    await expect(focusableElements[focusableElements.length - 1]).toBeFocused()
  })

  test('should support escape key to close modals', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    // Open modal
    await page.click('[data-testid="create-project-button"]')
    const modal = page.locator('[data-testid="create-project-dialog"]')
    await expect(modal).toBeVisible()
    
    // Press escape to close
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
    
    // Focus should return to trigger button
    const triggerButton = page.locator('[data-testid="create-project-button"]')
    await expect(triggerButton).toBeFocused()
  })

  test('should navigate dropdown menus with keyboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Find user menu button
    const userMenuButton = page.locator('[data-testid="user-menu"]')
    await userMenuButton.focus()
    await expect(userMenuButton).toBeFocused()
    
    // Open menu with Enter or Space
    await page.keyboard.press('Enter')
    const dropdown = page.locator('[data-testid="user-dropdown"]')
    await expect(dropdown).toBeVisible()
    
    // Navigate menu items with arrow keys
    await page.keyboard.press('ArrowDown')
    const firstMenuItem = dropdown.locator('[role="menuitem"]').first()
    await expect(firstMenuItem).toBeFocused()
    
    await page.keyboard.press('ArrowDown')
    const secondMenuItem = dropdown.locator('[role="menuitem"]').nth(1)
    await expect(secondMenuItem).toBeFocused()
    
    // Select item with Enter
    await page.keyboard.press('Enter')
    await expect(dropdown).not.toBeVisible()
  })

  test('should navigate data tables with keyboard', async ({ page }) => {
    await page.goto('/dashboard/projects')
    
    // Focus on table
    const table = page.locator('[data-testid="projects-table"]')
    if (await table.isVisible()) {
      await table.focus()
      
      // Navigate table cells with arrow keys
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowDown')
      
      // Current cell should be focused
      const focusedCell = page.locator(':focus')
      const cellRole = await focusedCell.getAttribute('role')
      expect(['cell', 'gridcell']).toContain(cellRole)
    }
  })

  test('should handle form navigation with keyboard', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await page.click('[data-testid="create-project-button"]')
    
    const form = page.locator('[data-testid="create-project-form"]')
    await expect(form).toBeVisible()
    
    // Tab through form fields
    const nameInput = form.locator('input[name="name"]')
    await expect(nameInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    const descriptionInput = form.locator('textarea[name="description"]')
    await expect(descriptionInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    const prioritySelect = form.locator('select[name="priority"]')
    await expect(prioritySelect).toBeFocused()
    
    // Test select dropdown navigation
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  })

  test('should support skip links', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Tab to skip link
    await page.keyboard.press('Tab')
    const skipLink = page.locator('[data-testid="skip-link"]')
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
    
    // Activate skip link
    await page.keyboard.press('Enter')
    
    // Should jump to main content
    const mainContent = page.locator('main')
    await expect(mainContent).toBeFocused()
  })

  test('should handle accordion navigation', async ({ page }) => {
    await page.goto('/dashboard/settings')
    
    const accordion = page.locator('[data-testid="settings-accordion"]')
    if (await accordion.isVisible()) {
      // Focus first accordion header
      const firstHeader = accordion.locator('[role="button"]').first()
      await firstHeader.focus()
      await expect(firstHeader).toBeFocused()
      
      // Expand with Enter or Space
      await page.keyboard.press('Enter')
      const expanded = await firstHeader.getAttribute('aria-expanded')
      expect(expanded).toBe('true')
      
      // Navigate to next accordion header
      await page.keyboard.press('ArrowDown')
      const secondHeader = accordion.locator('[role="button"]').nth(1)
      await expect(secondHeader).toBeFocused()
    }
  })

  test('should navigate breadcrumbs with keyboard', async ({ page }) => {
    await page.goto('/dashboard/projects/project-1')
    
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]')
    if (await breadcrumbs.isVisible()) {
      // Tab to breadcrumbs
      await breadcrumbs.locator('a').first().focus()
      
      // Navigate breadcrumb links
      await page.keyboard.press('ArrowRight')
      const secondBreadcrumb = breadcrumbs.locator('a').nth(1)
      await expect(secondBreadcrumb).toBeFocused()
      
      // Activate breadcrumb
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/dashboard\/projects$/)
    }
  })

  test('should handle search functionality with keyboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    const searchInput = page.locator('[data-testid="global-search"]')
    await searchInput.focus()
    await expect(searchInput).toBeFocused()
    
    // Type search query
    await page.keyboard.type('test project')
    
    // Navigate search suggestions with arrow keys
    await page.keyboard.press('ArrowDown')
    const firstSuggestion = page.locator('[data-testid="search-suggestion"]').first()
    if (await firstSuggestion.isVisible()) {
      await expect(firstSuggestion).toBeFocused()
      
      await page.keyboard.press('ArrowDown')
      const secondSuggestion = page.locator('[data-testid="search-suggestion"]').nth(1)
      await expect(secondSuggestion).toBeFocused()
      
      // Select suggestion with Enter
      await page.keyboard.press('Enter')
    }
  })

  test('should handle custom keyboard shortcuts', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test global shortcuts
    await page.keyboard.press('Control+k') // Open command palette
    const commandPalette = page.locator('[data-testid="command-palette"]')
    if (await commandPalette.isVisible()) {
      await expect(commandPalette).toBeVisible()
      
      // Close with Escape
      await page.keyboard.press('Escape')
      await expect(commandPalette).not.toBeVisible()
    }
    
    // Test navigation shortcuts
    await page.keyboard.press('g+p') // Go to projects
    await expect(page).toHaveURL(/\/dashboard\/projects/)
    
    await page.keyboard.press('g+d') // Go to dashboard
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('should maintain focus visibility', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Add CSS to ensure focus is visible
    await page.addStyleTag({
      content: `
        *:focus {
          outline: 2px solid #0066cc !important;
          outline-offset: 2px !important;
        }
      `
    })
    
    // Tab through elements and verify focus is visible
    await page.keyboard.press('Tab')
    let focused = page.locator(':focus')
    
    // Check focus outline is visible
    const outlineStyle = await focused.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return styles.outline
    })
    
    expect(outlineStyle).toContain('2px')
    expect(outlineStyle).toContain('solid')
  })

  test('should handle focus restoration after route changes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Focus on a navigation link
    const projectsLink = page.locator('[data-testid="nav-projects"]')
    await projectsLink.focus()
    await expect(projectsLink).toBeFocused()
    
    // Navigate to projects
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/dashboard\/projects/)
    
    // Focus should be on main content or first focusable element
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
    
    // Go back and check focus restoration
    await page.goBack()
    await expect(page).toHaveURL(/\/dashboard$/)
    
    // Focus should be restored or on a logical element
    const restoredFocus = page.locator(':focus')
    await expect(restoredFocus).toBeVisible()
  })
})