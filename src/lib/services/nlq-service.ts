import { geminiService } from '@/lib/ai/gemini'
import { 
  NLQuery, 
  NLQueryResponse, 
  QueryIntent, 
  QuerySuggestion,
  QueryHistory,
  SavedQuery,
  NLQueryContext
} from '@/types/nlq'

class NLQueryService {
  private queryHistory: Map<string, NLQuery[]> = new Map()
  private savedQueries: Map<string, SavedQuery[]> = new Map()

  async processQuery(
    query: string, 
    userId: string, 
    context?: NLQueryContext
  ): Promise<NLQuery> {
    const nlQuery: NLQuery = {
      id: this.generateId(),
      query,
      timestamp: new Date(),
      userId,
      status: 'processing'
    }

    try {
      // Parse the query intent
      const intent = await geminiService.parseQuery(query, context)
      
      // Get relevant data based on intent
      const data = await this.fetchDataForIntent(intent, context)
      
      // Generate AI response
      const response = await geminiService.generateResponse(query, data, intent)
      
      nlQuery.response = response
      nlQuery.status = 'completed'
      
      // Add to history
      this.addToHistory(userId, nlQuery)
      
      return nlQuery
    } catch (error) {
      console.error('Error processing NL query:', error)
      nlQuery.status = 'error'
      nlQuery.response = {
        answer: 'I encountered an error processing your query. Please try again.',
        confidence: 0,
        insights: []
      }
      return nlQuery
    }
  }

  async getSuggestions(context?: NLQueryContext): Promise<QuerySuggestion[]> {
    try {
      return await geminiService.generateSuggestions(context)
    } catch (error) {
      console.error('Error getting suggestions:', error)
      return this.getDefaultSuggestions()
    }
  }

  getQueryHistory(userId: string): NLQuery[] {
    return this.queryHistory.get(userId) || []
  }

  getSavedQueries(userId: string): SavedQuery[] {
    return this.savedQueries.get(userId) || []
  }

  async saveQuery(
    userId: string, 
    query: string, 
    name: string, 
    description?: string,
    tags: string[] = []
  ): Promise<SavedQuery> {
    const savedQuery: SavedQuery = {
      id: this.generateId(),
      name,
      query,
      description,
      tags,
      createdAt: new Date(),
      useCount: 0
    }

    const userSavedQueries = this.savedQueries.get(userId) || []
    userSavedQueries.push(savedQuery)
    this.savedQueries.set(userId, userSavedQueries)

    return savedQuery
  }

  async useSavedQuery(userId: string, savedQueryId: string): Promise<NLQuery | null> {
    const savedQueries = this.savedQueries.get(userId) || []
    const savedQuery = savedQueries.find(q => q.id === savedQueryId)
    
    if (!savedQuery) {
      return null
    }

    // Update usage stats
    savedQuery.lastUsed = new Date()
    savedQuery.useCount++

    // Process the saved query
    return this.processQuery(savedQuery.query, userId)
  }

  private async fetchDataForIntent(intent: QueryIntent, context?: NLQueryContext): Promise<any> {
    // This would typically fetch data from your database based on the intent
    // For now, return mock data based on the intent type
    
    switch (intent.type) {
      case 'metric':
        return this.getMockMetricData(intent.entities)
      case 'trend':
        return this.getMockTrendData(intent.entities, intent.timeframe)
      case 'comparison':
        return this.getMockComparisonData(intent.entities)
      case 'forecast':
        return this.getMockForecastData(intent.entities)
      case 'anomaly':
        return this.getMockAnomalyData(intent.entities)
      default:
        return this.getMockSummaryData()
    }
  }

  private getMockMetricData(entities: string[]): any {
    const metrics: Record<string, any> = {
      revenue: { value: 125000, unit: 'USD', change: 12.5 },
      sales: { value: 450, unit: 'count', change: 8.2 },
      customers: { value: 1250, unit: 'count', change: 15.3 },
      conversion: { value: 3.2, unit: '%', change: -2.1 }
    }

    return entities.reduce((acc, entity) => {
      if (metrics[entity]) {
        acc[entity] = metrics[entity]
      }
      return acc
    }, {} as Record<string, any>)
  }

  private getMockTrendData(entities: string[], timeframe?: any): any {
    const trendData = entities.map(entity => ({
      entity,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 1000) + 500
      }))
    }))

    return { trends: trendData, timeframe }
  }

  private getMockComparisonData(entities: string[]): any {
    return {
      current: entities.reduce((acc, entity) => {
        acc[entity] = Math.floor(Math.random() * 1000) + 500
        return acc
      }, {} as Record<string, number>),
      previous: entities.reduce((acc, entity) => {
        acc[entity] = Math.floor(Math.random() * 1000) + 400
        return acc
      }, {} as Record<string, number>)
    }
  }

  private getMockForecastData(entities: string[]): any {
    return entities.map(entity => ({
      entity,
      forecast: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
        predicted: Math.floor(Math.random() * 1000) + 600,
        confidence: 0.7 + Math.random() * 0.2
      }))
    }))
  }

  private getMockAnomalyData(entities: string[]): any {
    return {
      anomalies: entities.map(entity => ({
        entity,
        detected: Math.random() > 0.7,
        severity: Math.random() > 0.5 ? 'high' : 'medium',
        description: `Unusual pattern detected in ${entity} data`
      }))
    }
  }

  private getMockSummaryData(): any {
    return {
      overview: {
        totalRevenue: 125000,
        totalCustomers: 1250,
        conversionRate: 3.2,
        growthRate: 12.5
      },
      highlights: [
        'Revenue increased by 12.5% this month',
        'Customer acquisition up 15.3%',
        'Conversion rate slightly down by 2.1%'
      ]
    }
  }

  private addToHistory(userId: string, query: NLQuery): void {
    const history = this.queryHistory.get(userId) || []
    history.unshift(query) // Add to beginning
    
    // Keep only last 50 queries
    if (history.length > 50) {
      history.splice(50)
    }
    
    this.queryHistory.set(userId, history)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private getDefaultSuggestions(): QuerySuggestion[] {
    return [
      {
        text: "What's our revenue this month?",
        category: 'metrics',
        confidence: 0.8
      },
      {
        text: "Show me sales trends",
        category: 'trends',
        confidence: 0.8
      },
      {
        text: "How are we performing vs last month?",
        category: 'comparisons',
        confidence: 0.8
      }
    ]
  }
}

export const nlqService = new NLQueryService()