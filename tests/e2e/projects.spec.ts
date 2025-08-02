/**
 * End-to-end tests for project management functionality
 * Tests project CRUD operations, AI optimization, and collaboration
 */

import { test, expect } from '@playwright/test'

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to projects
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/projects')
    await expect(page.locator('[data-testid="projects-page"]')).toBeVisible()
  })

  test('should display projects list', async ({ page }) => {
    // Check projects list
    await expect(page.locator('[data-testid="projects-grid"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(3)
    
    // Check project card elements
    const firstProject = page.locator('[data-testid="project-card"]').first()
    await expect(firstProject.locator('[data-testid="project-name"]')).toBeVisible()
    await expect(firstProject.locator('[data-testid="project-status"]')).toBeVisible()
    await expect(firstProject.locator('[data-testid="project-progress"]')).toBeVisible()
  })

  test('should create new project', async ({ page }) => {
    // Click create project button
    await page.click('[data-testid="create-project-button"]')
    await expect(page.locator('[data-testid="create-project-dialog"]')).toBeVisible()
    
    // Fill project form
    await page.fill('input[name="name"]', 'E2E Test Project')
    await page.fill('textarea[name="description"]', 'Project created during E2E testing')
    await page.selectOption('select[name="priority"]', 'high')
    
    // Set project dates
    await page.click('[data-testid="start-date-picker"]')
    await page.click('[data-testid="today"]')
    await page.click('[data-testid="end-date-picker"]')
    await page.click('[data-testid="next-month"]')
    
    // Submit form
    await page.click('[data-testid="create-project-submit"]')
    
    // Verify project created
    await expect(page.locator('[data-testid="project-created-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(4)
  })

  test('should view project details', async ({ page }) => {
    // Click on first project
    await page.click('[data-testid="project-card"]')
    await expect(page).toHaveURL(/\/dashboard\/projects\/.*/)
    
    // Check project details page
    await expect(page.locator('[data-testid="project-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-timeline"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-tasks"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-resources"]')).toBeVisible()
  })

  test('should edit project information', async ({ page }) => {
    // Navigate to project details
    await page.click('[data-testid="project-card"]')
    
    // Click edit button
    await page.click('[data-testid="edit-project-button"]')
    await expect(page.locator('[data-testid="edit-project-form"]')).toBeVisible()
    
    // Update project name
    await page.fill('input[name="name"]', 'Updated Project Name')
    await page.fill('textarea[name="description"]', 'Updated description')
    
    // Save changes
    await page.click('[data-testid="save-project-button"]')
    
    // Verify changes saved
    await expect(page.locator('[data-testid="project-updated-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-name"]')).toContainText('Updated Project Name')
  })

  test('should manage project tasks', async ({ page }) => {
    // Navigate to project details
    await page.click('[data-testid="project-card"]')
    
    // Navigate to tasks tab
    await page.click('[data-testid="tasks-tab"]')
    await expect(page.locator('[data-testid="tasks-list"]')).toBeVisible()
    
    // Add new task
    await page.click('[data-testid="add-task-button"]')
    await page.fill('input[name="taskName"]', 'E2E Test Task')
    await page.fill('textarea[name="taskDescription"]', 'Task for testing')
    await page.selectOption('select[name="assignee"]', 'test-user-1')
    await page.click('[data-testid="create-task-button"]')
    
    // Verify task created
    await expect(page.locator('[data-testid="task-item"]')).toContainText('E2E Test Task')
    
    // Mark task as complete
    await page.click('[data-testid="task-checkbox"]')
    await expect(page.locator('[data-testid="task-completed"]')).toBeVisible()
  })

  test('should display AI project insights', async ({ page }) => {
    // Navigate to project details
    await page.click('[data-testid="project-card"]')
    
    // Check AI insights panel
    await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible()
    await expect(page.locator('[data-testid="risk-analysis"]')).toBeVisible()
    await expect(page.locator('[data-testid="optimization-suggestions"]')).toBeVisible()
    
    // Test insight interaction
    await page.click('[data-testid="view-insight-details"]')
    await expect(page.locator('[data-testid="insight-modal"]')).toBeVisible()
  })

  test('should handle project collaboration', async ({ page }) => {
    // Navigate to project details
    await page.click('[data-testid="project-card"]')
    
    // Check team members section
    await expect(page.locator('[data-testid="team-members"]')).toBeVisible()
    
    // Add team member
    await page.click('[data-testid="add-member-button"]')
    await page.fill('input[name="memberEmail"]', 'newmember@example.com')
    await page.selectOption('select[name="role"]', 'contributor')
    await page.click('[data-testid="invite-member-button"]')
    
    // Verify member added
    await expect(page.locator('[data-testid="member-invited-toast"]')).toBeVisible()
    
    // Test real-time collaboration indicator
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible()
  })

  test('should filter and search projects', async ({ page }) => {
    // Test search functionality
    await page.fill('[data-testid="project-search"]', 'Test')
    await page.press('[data-testid="project-search"]', 'Enter')
    
    // Check filtered results
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(1)
    
    // Test status filter
    await page.click('[data-testid="status-filter"]')
    await page.click('[data-testid="active-projects"]')
    
    // Verify filter applied
    await expect(page.locator('[data-testid="filter-active"]')).toBeVisible()
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]')
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(3)
  })

  test('should delete project', async ({ page }) => {
    // Navigate to project details
    await page.click('[data-testid="project-card"]')
    
    // Click delete button
    await page.click('[data-testid="delete-project-button"]')
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    
    // Confirm deletion
    await page.fill('input[name="confirmationText"]', 'DELETE')
    await page.click('[data-testid="confirm-delete-button"]')
    
    // Verify project deleted
    await expect(page.locator('[data-testid="project-deleted-toast"]')).toBeVisible()
    await expect(page).toHaveURL('/dashboard/projects')
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(2)
  })
})