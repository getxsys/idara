'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Send, Sparkles, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuerySuggestion } from '@/types/nlq'

interface QueryInputProps {
  onSubmit: (query: string) => void
  suggestions?: QuerySuggestion[]
  isLoading?: boolean
  placeholder?: string
  recentQueries?: string[]
}

export function QueryInput({
  onSubmit,
  suggestions = [],
  isLoading = false,
  placeholder = "Ask anything about your business data...",
  recentQueries = []
}: QueryInputProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<QuerySuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5))
      setShowSuggestions(suggestions.length > 0)
    }
    setSelectedIndex(-1)
  }, [query, suggestions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSubmit(query.trim())
      setQuery('')
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    onSubmit(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSuggestionClick(filteredSuggestions[selectedIndex].text)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'metrics':
        return <Sparkles className="h-3 w-3" />
      case 'trends':
        return <Search className="h-3 w-3" />
      case 'comparisons':
        return <Star className="h-3 w-3" />
      case 'forecasts':
        return <Clock className="h-3 w-3" />
      default:
        return <Search className="h-3 w-3" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'metrics':
        return 'text-blue-500'
      case 'trends':
        return 'text-green-500'
      case 'comparisons':
        return 'text-purple-500'
      case 'forecasts':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-12 py-3 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (filteredSuggestions.length > 0 || recentQueries.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {/* AI Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                AI Suggestions
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={getCategoryColor(suggestion.category)}>
                      {getCategoryIcon(suggestion.category)}
                    </span>
                    <span className="text-sm text-gray-900">
                      {suggestion.text}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Queries */}
          {recentQueries.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                Recent Queries
              </div>
              {recentQueries.slice(0, 3).map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(recentQuery)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate">
                      {recentQuery}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}