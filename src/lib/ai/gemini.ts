import { GoogleGenerativeAI } from '@google/generative-ai'
import { QueryIntent, NLQueryResponse, QuerySuggestion } from '@/types/nlq'

class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async parseQuery(query: string, context?: any): Promise<QueryIntent> {
    const prompt = `
    Analyze this business query and extract the intent, entities, and parameters:
    Query: "${query}"
    
    Context: ${context ? JSON.stringify(context) : 'None'}
    
    Return a JSON object with:
    - type: one of 'metric', 'trend', 'comparison', 'forecast', 'anomaly', 'summary'
    - entities: array of business entities mentioned (revenue, sales, customers, etc.)
    - timeframe: object with start, end, period if mentioned
    - filters: any filters or conditions mentioned
    - aggregation: sum, avg, count, min, max if specified
    
    Example response:
    {
      "type": "trend",
      "entities": ["revenue", "sales"],
      "timeframe": {"period": "month"},
      "aggregation": "sum"
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback intent
      return {
        type: 'summary',
        entities: this.extractEntities(query),
        timeframe: this.extractTimeframe(query)
      }
    } catch (error) {
      console.error('Error parsing query with Gemini:', error)
      return {
        type: 'summary',
        entities: this.extractEntities(query),
        timeframe: this.extractTimeframe(query)
      }
    }
  }

  async generateResponse(query: string, data: any, intent: QueryIntent): Promise<NLQueryResponse> {
    const prompt = `
    Generate a natural language response for this business query:
    Query: "${query}"
    Intent: ${JSON.stringify(intent)}
    Data: ${JSON.stringify(data)}
    
    Provide:
    1. A clear, conversational answer
    2. Key insights from the data
    3. 2-3 suggested follow-up questions
    4. Confidence score (0-1)
    
    Format as JSON:
    {
      "answer": "Clear explanation of the data",
      "insights": ["insight1", "insight2"],
      "suggestedFollowUps": ["question1", "question2"],
      "confidence": 0.85
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          answer: parsed.answer || 'I found some information related to your query.',
          insights: parsed.insights || [],
          confidence: parsed.confidence || 0.7,
          suggestedFollowUps: parsed.suggestedFollowUps || []
        }
      }
      
      return {
        answer: text,
        insights: [],
        confidence: 0.6,
        suggestedFollowUps: []
      }
    } catch (error) {
      console.error('Error generating response with Gemini:', error)
      return {
        answer: 'I encountered an issue processing your query. Please try rephrasing it.',
        insights: [],
        confidence: 0.1,
        suggestedFollowUps: []
      }
    }
  }

  async generateSuggestions(context?: any): Promise<QuerySuggestion[]> {
    const prompt = `
    Generate 5 relevant business query suggestions based on this context:
    Context: ${context ? JSON.stringify(context) : 'General business dashboard'}
    
    Categories: metrics, trends, comparisons, forecasts
    
    Return JSON array:
    [
      {
        "text": "What was our revenue last month?",
        "category": "metrics",
        "confidence": 0.9
      }
    ]
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return this.getDefaultSuggestions()
    } catch (error) {
      console.error('Error generating suggestions with Gemini:', error)
      return this.getDefaultSuggestions()
    }
  }

  private extractEntities(query: string): string[] {
    const businessEntities = [
      'revenue', 'sales', 'profit', 'customers', 'users', 'orders',
      'conversion', 'traffic', 'engagement', 'retention', 'churn',
      'growth', 'performance', 'costs', 'expenses', 'margin'
    ]
    
    const found = businessEntities.filter(entity => 
      query.toLowerCase().includes(entity)
    )
    
    return found.length > 0 ? found : ['general']
  }

  private extractTimeframe(query: string): any {
    const timePatterns = {
      'last month': { period: 'month', offset: -1 },
      'this month': { period: 'month', offset: 0 },
      'last week': { period: 'week', offset: -1 },
      'this week': { period: 'week', offset: 0 },
      'yesterday': { period: 'day', offset: -1 },
      'today': { period: 'day', offset: 0 },
      'last year': { period: 'year', offset: -1 },
      'this year': { period: 'year', offset: 0 }
    }
    
    const queryLower = query.toLowerCase()
    for (const [pattern, timeframe] of Object.entries(timePatterns)) {
      if (queryLower.includes(pattern)) {
        return timeframe
      }
    }
    
    return undefined
  }

  private getDefaultSuggestions(): QuerySuggestion[] {
    return [
      {
        text: "What's our revenue trend this month?",
        category: 'trends',
        confidence: 0.8
      },
      {
        text: "How many new customers did we get?",
        category: 'metrics',
        confidence: 0.8
      },
      {
        text: "Compare sales performance vs last month",
        category: 'comparisons',
        confidence: 0.8
      },
      {
        text: "Show me top performing products",
        category: 'metrics',
        confidence: 0.8
      },
      {
        text: "What's the forecast for next quarter?",
        category: 'forecasts',
        confidence: 0.8
      }
    ]
  }
}

export const geminiService = new GeminiService()