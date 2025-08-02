'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, Clock, FileText, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  SearchFilters,
  QueryContext,
  AccessLevel
} from '@/types/rag';

interface SearchInterfaceProps {
  onSearch: (query: RAGQuery) => Promise<RAGResponse>;
  context?: QueryContext;
  className?: string;
}

interface SearchState {
  query: string;
  isSearching: boolean;
  results: RAGResponse | null;
  filters: SearchFilters;
  showFilters: boolean;
  searchHistory: string[];
  suggestions: string[];
}

export function IntelligentSearchInterface({ 
  onSearch, 
  context, 
  className = '' 
}: SearchInterfaceProps) {
  const [state, setState] = useState<SearchState>({
    query: '',
    isSearching: false,
    results: null,
    filters: {},
    showFilters: false,
    searchHistory: [],
    suggestions: []
  });

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('search-history');
    if (savedHistory) {
      setState(prev => ({
        ...prev,
        searchHistory: JSON.parse(savedHistory).slice(0, 10) // Keep last 10 searches
      }));
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((query: string) => {
    const newHistory = [query, ...state.searchHistory.filter(h => h !== query)].slice(0, 10);
    setState(prev => ({ ...prev, searchHistory: newHistory }));
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  }, [state.searchHistory]);

  // Handle search execution
  const handleSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || state.query;
    if (!queryToSearch.trim()) return;

    setState(prev => ({ ...prev, isSearching: true }));

    try {
      const ragQuery: RAGQuery = {
        query: queryToSearch,
        context,
        filters: state.filters,
        userId: context?.sessionId || 'anonymous',
        maxResults: 10,
        similarityThreshold: 0.7
      };

      const response = await onSearch(ragQuery);
      
      setState(prev => ({
        ...prev,
        results: response,
        suggestions: response.suggestions,
        isSearching: false
      }));

      saveToHistory(queryToSearch);
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({ ...prev, isSearching: false }));
    }
  }, [state.query, state.filters, context, onSearch, saveToHistory]);

  // Handle filter changes
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);

  // Handle query input change
  const handleQueryChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, query: value }));
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setState(prev => ({ ...prev, query: suggestion }));
    handleSearch(suggestion);
  }, [handleSearch]);

  // Handle history item click
  const handleHistoryClick = useCallback((historyItem: string) => {
    setState(prev => ({ ...prev, query: historyItem }));
    handleSearch(historyItem);
  }, [handleSearch]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Ask me anything about your documents..."
                value={state.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-3 text-lg"
                disabled={state.isSearching}
              />
            </div>
            <Button 
              onClick={() => handleSearch()}
              disabled={state.isSearching || !state.query.trim()}
              size="lg"
            >
              {state.isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              size="lg"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {state.showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>

          {/* Search Suggestions */}
          {state.suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Suggested searches:</p>
              <div className="flex flex-wrap gap-2">
                {state.suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {state.searchHistory.length > 0 && !state.query && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {state.searchHistory.slice(0, 5).map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {state.showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Advanced Filters
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Document Types */}
              <div>
                <label className="text-sm font-medium mb-2 block">Document Types</label>
                <div className="space-y-2">
                  {['pdf', 'docx', 'txt', 'html', 'md'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={state.filters.documentTypes?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = state.filters.documentTypes || [];
                          const newTypes = checked
                            ? [...currentTypes, type]
                            : currentTypes.filter(t => t !== type);
                          updateFilters({ documentTypes: newTypes });
                        }}
                      />
                      <label htmlFor={type} className="text-sm capitalize">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categories</label>
                <Select
                  value={state.filters.categories?.[0] || ''}
                  onValueChange={(value) => updateFilters({ categories: value ? [value] : [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Access Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Access Level</label>
                <Select
                  value={state.filters.accessLevel || ''}
                  onValueChange={(value) => updateFilters({ 
                    accessLevel: value as AccessLevel || undefined 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    <SelectItem value={AccessLevel.PUBLIC}>Public</SelectItem>
                    <SelectItem value={AccessLevel.INTERNAL}>Internal</SelectItem>
                    <SelectItem value={AccessLevel.CONFIDENTIAL}>Confidential</SelectItem>
                    <SelectItem value={AccessLevel.RESTRICTED}>Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">From</label>
                  <Input
                    type="date"
                    value={state.filters.dateRange?.start.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const start = e.target.value ? new Date(e.target.value) : undefined;
                      updateFilters({
                        dateRange: start ? {
                          start,
                          end: state.filters.dateRange?.end || new Date()
                        } : undefined
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">To</label>
                  <Input
                    type="date"
                    value={state.filters.dateRange?.end.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const end = e.target.value ? new Date(e.target.value) : undefined;
                      updateFilters({
                        dateRange: end ? {
                          start: state.filters.dateRange?.start || new Date('2020-01-01'),
                          end
                        } : undefined
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {state.results && (
        <SearchResults 
          results={state.results}
          onRelatedSearch={handleSuggestionClick}
        />
      )}
    </div>
  );
}

interface SearchResultsProps {
  results: RAGResponse;
  onRelatedSearch: (query: string) => void;
}

function SearchResults({ results, onRelatedSearch }: SearchResultsProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const toggleSource = useCallback((sourceId: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Answer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI-Generated Answer
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Confidence:</span>
              <Badge 
                variant="outline" 
                className={getConfidenceColor(results.confidence)}
              >
                {getConfidenceLabel(results.confidence)} ({Math.round(results.confidence * 100)}%)
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{results.answer}</p>
          <div className="mt-4 text-sm text-gray-500">
            Found {results.sources.length} relevant sources in {results.processingTime}ms
          </div>
        </CardContent>
      </Card>

      {/* Source Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Source Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.sources.map((source, index) => (
            <div key={source.chunkId} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{source.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{source.citation}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Relevance: {Math.round(source.relevanceScore * 100)}%
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {source.metadata.fileType || 'Unknown'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSource(source.chunkId)}
                >
                  {expandedSources.has(source.chunkId) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedSources.has(source.chunkId) && (
                <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {source.content}
                  </p>
                  {source.metadata.section && (
                    <div className="mt-2 text-xs text-gray-500">
                      Section: {source.metadata.section}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Related Suggestions */}
      {results.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => onRelatedSearch(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IntelligentSearchInterface;