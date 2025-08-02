import { nlqService } from '../nlq-service'
import { geminiService } from '@/lib/ai/gemini'
import { QueryIntent } from '@/types/nlq'

// Mock the gemini service
jest.mock('@/lib/ai/gemini', () => ({
  geminiService: {
    parseQuery: jest.fn(),
    generateResponse: jest.fn(),
    generateSuggestions: jest.fn()
  }
}))

const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>

describe('NLQueryService', () => {
  const testUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default mocks
    mockGeminiService.parseQuery.mockResolvedValue({
      type: 'metric',
      entities: ['revenue']
    })
    
    mockGeminiService.generateResponse.mockResolvedValue({
      answer: 'Your revenue is $100,000',
      confidence: 0.9,
      insights: ['Revenue increased by 10%'],
      suggestedFollowUps: ['What about last month?']
    })
    
    mockGeminiService.generateSuggestions.mockResolvedValue([
      {
        text: 'What is our revenue?',
        category: 'metrics',
        confidence: 0.8
      }
    ])
  })

  describe('processQuery', () => {
    it('should process a query successfully', async () => {
      const query = 'What is our revenue?'
      const result = await nlqService.processQuery(query, testUserId)

      expect(result).toHaveProperty('id')
      expect(result.query).toBe(query)
      expect(result.userId).toBe(testUserId)
      expect(result.status).toBe('completed')
      expect(result.response).toBeDefined()
      expect(result.response?.answer).toBe('Your revenue is $100,000')
    })

    it('should handle processing errors gracefully', async () => {
      mockGeminiService.parseQuery.mockRejectedValue(new Error('API Error'))

      const query = 'What is our revenue?'
      const result = await nlqService.processQuery(query, testUserId)

      expect(result.status).toBe('error')
      expect(result.response?.answer).toContain('encountered an error')
    })

    it('should add query to history', async () => {
      const query = 'What is our revenue?'
      await nlqService.processQuery(query, testUserId)

      const history = nlqService.getQueryHistory(testUserId)
      expect(history).toHaveLength(1)
      expect(history[0].query).toBe(query)
    })

    it('should limit history to 50 queries', async () => {
      // Process 55 queries
      for (let i = 0; i < 55; i++) {
        await nlqService.processQuery(`Query ${i}`, testUserId)
      }

      const history = nlqService.getQueryHistory(testUserId)
      expect(history).toHaveLength(50)
      expect(history[0].query).toBe('Query 54') // Most recent first
    })
  })

  describe('getSuggestions', () => {
    it('should return suggestions from Gemini service', async () => {
      const suggestions = await nlqService.getSuggestions()

      expect(mockGeminiService.generateSuggestions).toHaveBeenCalled()
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].text).toBe('What is our revenue?')
    })

    it('should return default suggestions on error', async () => {
      mockGeminiService.generateSuggestions.mockRejectedValue(new Error('API Error'))

      const suggestions = await nlqService.getSuggestions()

      expect(suggestions).toHaveLength(3)
      expect(suggestions[0]).toHaveProperty('text')
      expect(suggestions[0]).toHaveProperty('category')
    })
  })

  describe('saveQuery', () => {
    it('should save a query successfully', async () => {
      const query = 'What is our revenue?'
      const name = 'Revenue Query'
      const description = 'Check current revenue'
      const tags = ['revenue', 'metrics']

      const savedQuery = await nlqService.saveQuery(
        testUserId,
        query,
        name,
        description,
        tags
      )

      expect(savedQuery).toHaveProperty('id')
      expect(savedQuery.name).toBe(name)
      expect(savedQuery.query).toBe(query)
      expect(savedQuery.description).toBe(description)
      expect(savedQuery.tags).toEqual(tags)
      expect(savedQuery.useCount).toBe(0)

      const savedQueries = nlqService.getSavedQueries(testUserId)
      expect(savedQueries).toHaveLength(1)
      expect(savedQueries[0]).toEqual(savedQuery)
    })
  })

  describe('useSavedQuery', () => {
    it('should execute a saved query', async () => {
      // First save a query
      const savedQuery = await nlqService.saveQuery(
        testUserId,
        'What is our revenue?',
        'Revenue Query'
      )

      // Then use it
      const result = await nlqService.useSavedQuery(testUserId, savedQuery.id)

      expect(result).toBeDefined()
      expect(result?.query).toBe('What is our revenue?')
      expect(result?.status).toBe('completed')

      // Check that usage stats were updated
      const savedQueries = nlqService.getSavedQueries(testUserId)
      const updatedSavedQuery = savedQueries.find(q => q.id === savedQuery.id)
      expect(updatedSavedQuery?.useCount).toBe(1)
      expect(updatedSavedQuery?.lastUsed).toBeDefined()
    })

    it('should return null for non-existent saved query', async () => {
      const result = await nlqService.useSavedQuery(testUserId, 'non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('query history management', () => {
    it('should return empty history for new user', () => {
      const history = nlqService.getQueryHistory('new-user')
      expect(history).toHaveLength(0)
    })

    it('should maintain separate histories for different users', async () => {
      const user1 = 'user1'
      const user2 = 'user2'

      await nlqService.processQuery('User 1 query', user1)
      await nlqService.processQuery('User 2 query', user2)

      const history1 = nlqService.getQueryHistory(user1)
      const history2 = nlqService.getQueryHistory(user2)

      expect(history1).toHaveLength(1)
      expect(history2).toHaveLength(1)
      expect(history1[0].query).toBe('User 1 query')
      expect(history2[0].query).toBe('User 2 query')
    })
  })

  describe('data fetching for different intents', () => {
    it('should fetch appropriate data for metric intent', async () => {
      const intent: QueryIntent = {
        type: 'metric',
        entities: ['revenue', 'sales']
      }

      mockGeminiService.parseQuery.mockResolvedValue(intent)

      const query = 'Show me revenue and sales'
      const result = await nlqService.processQuery(query, testUserId)

      expect(result.status).toBe('completed')
      expect(mockGeminiService.generateResponse).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          revenue: expect.any(Object),
          sales: expect.any(Object)
        }),
        intent
      )
    })

    it('should fetch trend data for trend intent', async () => {
      const intent: QueryIntent = {
        type: 'trend',
        entities: ['revenue'],
        timeframe: { period: 'month' }
      }

      mockGeminiService.parseQuery.mockResolvedValue(intent)

      const query = 'Show me revenue trends'
      await nlqService.processQuery(query, testUserId)

      expect(mockGeminiService.generateResponse).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          trends: expect.any(Array)
        }),
        intent
      )
    })

    it('should fetch comparison data for comparison intent', async () => {
      const intent: QueryIntent = {
        type: 'comparison',
        entities: ['revenue']
      }

      mockGeminiService.parseQuery.mockResolvedValue(intent)

      const query = 'Compare revenue vs last month'
      await nlqService.processQuery(query, testUserId)

      expect(mockGeminiService.generateResponse).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          current: expect.any(Object),
          previous: expect.any(Object)
        }),
        intent
      )
    })

    it('should fetch forecast data for forecast intent', async () => {
      const intent: QueryIntent = {
        type: 'forecast',
        entities: ['revenue']
      }

      mockGeminiService.parseQuery.mockResolvedValue(intent)

      const query = 'Forecast revenue for next quarter'
      await nlqService.processQuery(query, testUserId)

      expect(mockGeminiService.generateResponse).toHaveBeenCalledWith(
        query,
        expect.any(Array),
        intent
      )
    })
  })
})