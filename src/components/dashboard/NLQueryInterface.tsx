'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  History, 
  Star, 
  Trash2, 
  Download,
  Settings
} from 'lucide-react'
import { QueryInput } from './QueryInput'
import { QueryResponse } from './QueryResponse'
import { nlqService } from '@/lib/services/nlq-service'
import { 
  NLQuery, 
  QuerySuggestion, 
  SavedQuery,
  NLQueryContext 
} from '@/types/nlq'

interface NLQueryInterfaceProps {
  userId: string
  context?: NLQueryContext
  className?: string
}

export function NLQueryInterface({ 
  userId, 
  context,
  className = '' 
}: NLQueryInterfaceProps) {
  const [currentQuery, setCurrentQuery] = useState<NLQuery | null>(null)
  const [queryHistory, setQueryHistory] = useState<NLQuery[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'saved'>('chat')

  useEffect(() => {
    loadInitialData()
  }, [userId])

  const loadInitialData = async () => {
    try {
      // Load suggestions
      const newSuggestions = await nlqService.getSuggestions(context)
      setSuggestions(newSuggestions)

      // Load history and saved queries
      const history = nlqService.getQueryHistory(userId)
      const saved = nlqService.getSavedQueries(userId)
      
      setQueryHistory(history)
      setSavedQueries(saved)
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const handleQuerySubmit = async (query: string) => {
    setIsLoading(true)
    try {
      const result = await nlqService.processQuery(query, userId, context)
      setCurrentQuery(result)
      
      // Refresh history
      const updatedHistory = nlqService.getQueryHistory(userId)
      setQueryHistory(updatedHistory)
    } catch (error) {
      console.error('Error processing query:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowUpClick = (followUpQuery: string) => {
    handleQuerySubmit(followUpQuery)
  }

  const handleSaveQuery = async () => {
    if (!currentQuery) return

    try {
      const name = `Query ${savedQueries.length + 1}`
      const savedQuery = await nlqService.saveQuery(
        userId,
        currentQuery.query,
        name,
        'Saved from chat'
      )
      
      setSavedQueries(prev => [...prev, savedQuery])
    } catch (error) {
      console.error('Error saving query:', error)
    }
  }

  const handleUseSavedQuery = async (savedQueryId: string) => {
    setIsLoading(true)
    try {
      const result = await nlqService.useSavedQuery(userId, savedQueryId)
      if (result) {
        setCurrentQuery(result)
        setActiveTab('chat')
        
        // Refresh history
        const updatedHistory = nlqService.getQueryHistory(userId)
        setQueryHistory(updatedHistory)
      }
    } catch (error) {
      console.error('Error using saved query:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHistoryClick = (query: NLQuery) => {
    setCurrentQuery(query)
    setActiveTab('chat')
  }

  const getRecentQueries = () => {
    return queryHistory.slice(0, 5).map(q => q.query)
  }

  const renderChatTab = () => (
    <div className="space-y-6">
      <QueryInput
        onSubmit={handleQuerySubmit}
        suggestions={suggestions}
        isLoading={isLoading}
        recentQueries={getRecentQueries()}
      />

      {currentQuery && currentQuery.response && (
        <QueryResponse
          response={currentQuery.response}
          query={currentQuery.query}
          onFollowUpClick={handleFollowUpClick}
          onSaveQuery={handleSaveQuery}
          onFeedback={(positive) => {
            console.log('Feedback:', positive ? 'positive' : 'negative')
          }}
        />
      )}

      {!currentQuery && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Try asking about...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleQuerySubmit(suggestion.text)}
                  className="justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">{suggestion.text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.category} • {Math.round(suggestion.confidence * 100)}% confidence
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Query History</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {queryHistory.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No queries yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {queryHistory.map((query) => (
            <Card 
              key={query.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleHistoryClick(query)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{query.query}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{query.timestamp.toLocaleDateString()}</span>
                      <Badge 
                        variant={query.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {query.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle delete
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderSavedTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Saved Queries</h3>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </div>

      {savedQueries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No saved queries</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {savedQueries.map((savedQuery) => (
            <Card 
              key={savedQuery.id}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleUseSavedQuery(savedQuery.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{savedQuery.name}</p>
                    <p className="text-sm text-gray-600 mb-2">{savedQuery.query}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Used {savedQuery.useCount} times</span>
                      {savedQuery.lastUsed && (
                        <span>• Last used {savedQuery.lastUsed.toLocaleDateString()}</span>
                      )}
                    </div>
                    {savedQuery.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {savedQuery.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('history')}
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
              <Button
                variant={activeTab === 'saved' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('saved')}
              >
                <Star className="h-4 w-4 mr-1" />
                Saved
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'saved' && renderSavedTab()}
        </CardContent>
      </Card>
    </div>
  )
}