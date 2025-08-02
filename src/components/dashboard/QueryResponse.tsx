'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  TrendingUp, 
  BarChart3, 
  MessageSquare, 
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { NLQueryResponse, QueryVisualization } from '@/types/nlq'

interface QueryResponseProps {
  response: NLQueryResponse
  query: string
  onFollowUpClick?: (query: string) => void
  onSaveQuery?: () => void
  onShareResponse?: () => void
  onFeedback?: (positive: boolean) => void
}

export function QueryResponse({
  response,
  query,
  onFollowUpClick,
  onSaveQuery,
  onShareResponse,
  onFeedback
}: QueryResponseProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence'
    if (confidence >= 0.6) return 'Medium Confidence'
    return 'Low Confidence'
  }

  const renderVisualization = (viz: QueryVisualization, index: number) => {
    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {viz.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Visualization: {viz.type} chart
            </p>
            {viz.config && (
              <p className="text-xs text-gray-500 mt-1">
                Type: {viz.config.chartType || 'default'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Query Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">
            "{query}"
          </h3>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={getConfidenceColor(response.confidence)}
            >
              {getConfidenceText(response.confidence)}
            </Badge>
            <span className="text-xs text-gray-500">
              {Math.round(response.confidence * 100)}% confidence
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-4">
          {onSaveQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveQuery}
              className="h-8 w-8 p-0"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          )}
          {onShareResponse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShareResponse}
              className="h-8 w-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Response */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {response.answer}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      {response.visualizations && response.visualizations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Data Visualizations
          </h4>
          {response.visualizations.map(renderVisualization)}
        </div>
      )}

      {/* Insights */}
      {response.insights && response.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {response.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingUp className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Questions */}
      {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              Suggested Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {response.suggestedFollowUps.map((followUp, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onFollowUpClick?.(followUp)}
                  className="w-full justify-start text-left h-auto py-2 px-3"
                >
                  <span className="text-sm">{followUp}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {response.sources && response.sources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {response.sources.map((source, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {onFeedback && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-600">Was this helpful?</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback(true)}
              className="h-8 px-3"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback(false)}
              className="h-8 px-3"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}