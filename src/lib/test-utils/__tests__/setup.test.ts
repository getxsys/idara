/**
 * Tests for testing utilities setup
 */

import { mockUser, mockProject, mockClient, measurePerformance } from '../setup'

describe('Test Utils Setup', () => {
  test('should provide mock user data', () => {
    expect(mockUser).toBeDefined()
    expect(mockUser.id).toBe('test-user-1')
    expect(mockUser.email).toBe('test@example.com')
    expect(mockUser.role).toBe('admin')
  })

  test('should provide mock project data', () => {
    expect(mockProject).toBeDefined()
    expect(mockProject.id).toBe('test-project-1')
    expect(mockProject.name).toBe('Test Project')
    expect(mockProject.status).toBe('active')
  })

  test('should provide mock client data', () => {
    expect(mockClient).toBeDefined()
    expect(mockClient.id).toBe('test-client-1')
    expect(mockClient.name).toBe('Test Client')
    expect(mockClient.status).toBe('active')
  })

  test('should measure performance', async () => {
    const testFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return 'test result'
    }

    const duration = await measurePerformance(testFunction)
    expect(duration).toBeGreaterThan(0)
    expect(duration).toBeLessThan(100) // Should complete quickly
  })
})