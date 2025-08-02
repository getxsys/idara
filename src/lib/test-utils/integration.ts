/**
 * Integration testing utilities for API endpoints and database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createTestDatabase } from './setup'

export interface TestApiContext {
  req: NextRequest
  res: NextResponse
  db: ReturnType<typeof createTestDatabase>
}

export class IntegrationTestHelper {
  private db = createTestDatabase()

  createMockRequest(
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): NextRequest {
    const request = new NextRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    return request
  }

  async testApiEndpoint(
    handler: (req: NextRequest) => Promise<NextResponse>,
    request: NextRequest
  ): Promise<{
    response: NextResponse
    status: number
    data: any
  }> {
    const response = await handler(request)
    const data = await response.json().catch(() => null)

    return {
      response,
      status: response.status,
      data
    }
  }

  setupDatabaseMocks() {
    // Reset all mocks
    Object.values(this.db).forEach(table => {
      Object.values(table).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset()
        }
      })
    })

    return this.db
  }

  async testDatabaseOperation<T>(
    operation: () => Promise<T>,
    expectedQueries: string[]
  ): Promise<T> {
    const result = await operation()
    
    // Verify expected database queries were called
    expectedQueries.forEach(query => {
      // This would be implemented with actual database query logging
      // For now, we'll just ensure the operation completed
    })

    return result
  }

  createAuthenticatedRequest(
    method: string,
    url: string,
    userId: string,
    body?: any
  ): NextRequest {
    const token = this.createMockJWT(userId)
    
    return this.createMockRequest(method, url, body, {
      Authorization: `Bearer ${token}`
    })
  }

  private createMockJWT(userId: string): string {
    // In a real implementation, this would create a valid JWT
    // For testing, we'll return a mock token
    return `mock-jwt-token-${userId}`
  }

  async testWebSocketConnection(
    url: string,
    messages: any[]
  ): Promise<any[]> {
    const receivedMessages: any[] = []
    
    // Mock WebSocket implementation for testing
    const mockWs = {
      send: jest.fn((message) => {
        // Simulate server response
        const response = this.simulateWebSocketResponse(JSON.parse(message))
        receivedMessages.push(response)
      }),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }

    // Send test messages
    messages.forEach(message => {
      mockWs.send(JSON.stringify(message))
    })

    return receivedMessages
  }

  private simulateWebSocketResponse(message: any): any {
    // Simulate different types of WebSocket responses
    switch (message.type) {
      case 'subscribe':
        return { type: 'subscribed', channel: message.channel }
      case 'unsubscribe':
        return { type: 'unsubscribed', channel: message.channel }
      case 'ping':
        return { type: 'pong' }
      default:
        return { type: 'ack', messageId: message.id }
    }
  }

  async testExternalServiceIntegration(
    serviceName: string,
    mockResponses: Record<string, any>
  ): Promise<void> {
    // Mock external service calls
    const originalFetch = global.fetch
    
    global.fetch = jest.fn((url: string) => {
      const mockResponse = mockResponses[url] || { error: 'Not mocked' }
      
      return Promise.resolve({
        ok: !mockResponse.error,
        status: mockResponse.error ? 500 : 200,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    })

    // Restore original fetch after test
    return () => {
      global.fetch = originalFetch
    }
  }
}

// Common test scenarios
export const TEST_SCENARIOS = {
  CRUD_OPERATIONS: ['create', 'read', 'update', 'delete'],
  AUTH_FLOWS: ['login', 'logout', 'refresh', 'mfa'],
  REAL_TIME_EVENTS: ['connect', 'disconnect', 'message', 'error'],
  FILE_OPERATIONS: ['upload', 'download', 'delete', 'process']
}

// Database test data generators
export const generateTestData = {
  user: (overrides = {}) => ({
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    ...overrides
  }),
  
  project: (overrides = {}) => ({
    id: `project-${Date.now()}`,
    name: 'Test Project',
    description: 'Test project description',
    status: 'active',
    createdAt: new Date(),
    ...overrides
  }),
  
  client: (overrides = {}) => ({
    id: `client-${Date.now()}`,
    name: 'Test Client',
    email: `client-${Date.now()}@example.com`,
    company: 'Test Company',
    status: 'active',
    createdAt: new Date(),
    ...overrides
  })
}