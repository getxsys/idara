/**
 * Comprehensive test setup utilities for the Modern Business Dashboard
 * Provides common test configurations, mocks, and utilities
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

// Mock data generators
export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  permissions: ['read', 'write', 'admin'],
  preferences: {
    theme: 'light' as const,
    notifications: true,
    aiAssistance: true
  }
}

export const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'A test project for unit testing',
  status: 'active' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ownerId: mockUser.id
}

export const mockClient = {
  id: 'test-client-1',
  name: 'Test Client',
  email: 'client@example.com',
  company: 'Test Company',
  status: 'active' as const,
  healthScore: 85,
  engagementLevel: 'high' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  // For now, just return children without AuthProvider to avoid import issues
  return children as ReactElement
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock WebSocket for real-time features
export const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN
}

// Mock fetch for API calls
export const mockFetch = jest.fn()
global.fetch = mockFetch

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Database test utilities
export const createTestDatabase = () => {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    client: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}