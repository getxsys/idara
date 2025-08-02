# Natural Language Query Interface Setup

This document explains how to set up and use the AI-powered natural language query interface in the dashboard.

## Overview

The Natural Language Query (NLQ) interface allows users to ask questions about their business data in plain English and receive AI-generated insights and visualizations.

## Features

- **Natural Language Processing**: Ask questions in plain English
- **Auto-suggestions**: Smart query suggestions based on context
- **Query History**: Track and reuse previous queries
- **Saved Queries**: Save frequently used queries for quick access
- **AI Insights**: Get intelligent insights and recommendations
- **Follow-up Questions**: AI suggests relevant follow-up queries

## Setup

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables

Add your Gemini API key to the `.env` file:

```env
# AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY="your-actual-gemini-api-key"
```

### 3. Install Dependencies

The required dependencies are already included in the project:

```json
{
  "@google/generative-ai": "^0.24.1"
}
```

## Usage

### Basic Implementation

```tsx
import { NLQueryInterface } from '@/components/dashboard'

export default function DashboardPage() {
  const userId = 'user-123'
  
  const context = {
    currentDashboard: 'main-dashboard',
    userRole: 'analyst',
    businessContext: {
      industry: 'e-commerce',
      primaryMetrics: ['revenue', 'sales', 'customers']
    }
  }

  return (
    <NLQueryInterface 
      userId={userId}
      context={context}
    />
  )
}
```

### Individual Components

You can also use individual components:

```tsx
import { QueryInput, QueryResponse } from '@/components/dashboard'

// Query input with suggestions
<QueryInput
  onSubmit={handleQuery}
  suggestions={suggestions}
  recentQueries={recentQueries}
  isLoading={isProcessing}
/>

// Display AI response
<QueryResponse
  response={aiResponse}
  query={originalQuery}
  onFollowUpClick={handleFollowUp}
  onSaveQuery={handleSave}
/>
```

## API Reference

### NLQueryInterface Props

| Prop | Type | Description |
|------|------|-------------|
| `userId` | `string` | Unique identifier for the user |
| `context` | `NLQueryContext` | Optional context for better AI suggestions |
| `className` | `string` | Additional CSS classes |

### QueryInput Props

| Prop | Type | Description |
|------|------|-------------|
| `onSubmit` | `(query: string) => void` | Callback when query is submitted |
| `suggestions` | `QuerySuggestion[]` | AI-generated query suggestions |
| `isLoading` | `boolean` | Loading state |
| `placeholder` | `string` | Input placeholder text |
| `recentQueries` | `string[]` | Recent query history |

### QueryResponse Props

| Prop | Type | Description |
|------|------|-------------|
| `response` | `NLQueryResponse` | AI-generated response |
| `query` | `string` | Original query text |
| `onFollowUpClick` | `(query: string) => void` | Handle follow-up questions |
| `onSaveQuery` | `() => void` | Save query callback |
| `onFeedback` | `(positive: boolean) => void` | User feedback callback |

## Example Queries

### Metrics
- "What's our revenue this month?"
- "How many customers do we have?"
- "Show me conversion rates"

### Trends
- "Show me sales trends over the last 6 months"
- "How is our customer growth trending?"
- "Display revenue trends by quarter"

### Comparisons
- "Compare this month's performance vs last month"
- "How do our sales compare to last year?"
- "Show me performance vs targets"

### Forecasts
- "Predict next quarter's revenue"
- "What's the forecast for customer growth?"
- "Project sales for the next 6 months"

## Data Integration

The NLQ service includes mock data for demonstration. To integrate with real data:

1. **Update `fetchDataForIntent` method** in `nlq-service.ts`
2. **Connect to your database** or API endpoints
3. **Map query intents** to appropriate data sources
4. **Handle different data formats** for visualizations

### Example Data Integration

```typescript
private async fetchDataForIntent(intent: QueryIntent): Promise<any> {
  switch (intent.type) {
    case 'metric':
      return await this.databaseService.getMetrics(intent.entities)
    case 'trend':
      return await this.databaseService.getTrendData(intent.entities, intent.timeframe)
    // ... other cases
  }
}
```

## Testing

Run the NLQ tests:

```bash
npm test -- --testPathPattern="(nlq|gemini|QueryInput)"
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the API key is correct
   - Check if the key has proper permissions
   - Ensure the key is set in environment variables

2. **No Suggestions Appearing**
   - Check if the Gemini API is responding
   - Verify network connectivity
   - Check browser console for errors

3. **Poor Query Understanding**
   - Use more specific business terms
   - Include time periods in queries
   - Provide better context information

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will log API requests and responses to the console.

## Performance Considerations

- **Caching**: Implement caching for frequently asked queries
- **Rate Limiting**: Be aware of Gemini API rate limits
- **Data Optimization**: Optimize data fetching for large datasets
- **Response Time**: Consider showing loading states for better UX

## Security

- **API Key Protection**: Never expose API keys in client-side code
- **Input Validation**: Validate and sanitize user queries
- **Access Control**: Implement proper user permissions
- **Data Privacy**: Ensure sensitive data is handled appropriately

## Future Enhancements

- **Voice Input**: Add speech-to-text capabilities
- **Multi-language Support**: Support queries in different languages
- **Advanced Visualizations**: More chart types and interactive visualizations
- **Query Templates**: Pre-built query templates for common use cases
- **Export Functionality**: Export query results and insights