import { geminiService } from '../gemini'
import { QueryIntent } from '@/types/nlq'

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('{"type": "metric", "entities": ["revenue"], "aggregation": "sum"}')
        }
      })
    })
  }))
}))

describe('GeminiService', () => {
  beforeEach(() => {
    // Set up environment variable for tests
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('parseQuery', () => {
    it('should parse a simple revenue query', async () => {
      const query = 'What is our total revenue?'
      const result = await geminiService.parseQuery(query)

      expect(result).toEqual({
        type: 'metric',
        entities: ['revenue'],
        aggregation: 'sum'
      })
    })

    it('should handle query parsing errors gracefully', async () => {
      // Mock a failed API call
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      }
      
      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue(mockModel)
        }))
      }))

      const query = 'What is our revenue?'
      const result = await geminiService.parseQuery(query)

      expect(result.type).toBe('summary')
      expect(result.entities).toContain('revenue')
    })

    it('should extract entities from query text', async () => {
      const query = 'Show me sales and customer data'
      const result = await geminiService.parseQuery(query)

      expect(result.entities).toEqual(expect.arrayContaining(['sales']))
    })

    it('should handle timeframe extraction', async () => {
      const query = 'What was our revenue last month?'
      const result = await geminiService.parseQuery(query)

      expect(result.timeframe).toBeDefined()
    })
  })

  describe('generateResponse', () => {
    it('should generate a response for metric queries', async () => {
      const query = 'What is our revenue?'
      const data = { revenue: { value: 100000, change: 10 } }
      const intent: QueryIntent = {
        type: 'metric',
        entities: ['revenue']
      }

      const result = await geminiService.generateResponse(query, data, intent)

      expect(result).toHaveProperty('answer')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('insights')
      expect(result).toHaveProperty('suggestedFollowUps')
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle response generation errors', async () => {
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      }
      
      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue(mockModel)
        }))
      }))

      const query = 'What is our revenue?'
      const data = {}
      const intent: QueryIntent = { type: 'metric', entities: ['revenue'] }

      const result = await geminiService.generateResponse(query, data, intent)

      expect(result.answer).toContain('encountered an issue')
      expect(result.confidence).toBe(0.1)
    })
  })

  describe('generateSuggestions', () => {
    it('should generate query suggestions', async () => {
      const result = await geminiService.generateSuggestions()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      result.forEach(suggestion => {
        expect(suggestion).toHaveProperty('text')
        expect(suggestion).toHaveProperty('category')
        expect(suggestion).toHaveProperty('confidence')
        expect(['metrics', 'trends', 'comparisons', 'forecasts']).toContain(suggestion.category)
      })
    })

    it('should return default suggestions on error', async () => {
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      }
      
      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue(mockModel)
        }))
      }))

      const result = await geminiService.generateSuggestions()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('text')
    })
  })

  describe('entity extraction', () => {
    it('should extract business entities from queries', async () => {
      const queries = [
        'Show me revenue trends',
        'How many customers do we have?',
        'What is our conversion rate?',
        'Display profit margins'
      ]

      for (const query of queries) {
        const result = await geminiService.parseQuery(query)
        expect(result.entities.length).toBeGreaterThan(0)
      }
    })
  })

  describe('timeframe extraction', () => {
    it('should extract various timeframes', async () => {
      const timeframeQueries = [
        { query: 'revenue last month', expected: 'month' },
        { query: 'sales this week', expected: 'week' },
        { query: 'customers yesterday', expected: 'day' },
        { query: 'profit this year', expected: 'year' }
      ]

      for (const { query, expected } of timeframeQueries) {
        const result = await geminiService.parseQuery(query)
        if (result.timeframe) {
          expect(result.timeframe.period).toBe(expected)
        }
      }
    })
  })
})