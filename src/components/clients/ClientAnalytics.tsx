'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  MessageSquare, 
  Brain,
  Activity,
  DollarSign,
  Phone,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { ClientAnalyticsService, ClientAnalytics } from '../../lib/services/client-analytics';
import { Client, ActionPriority, InsightType } from '../../types/client';

interface ClientAnalyticsProps {
  client: Client;
  onActionClick?: (action: string) => void;
}

export function ClientAnalytics({ client, onActionClick }: ClientAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyticsService = new ClientAnalyticsService();

  useEffect(() => {
    const generateAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const clientAnalytics = analyticsService.generateClientAnalytics(client);
        setAnalytics(clientAnalytics);
      } catch (err) {
        setError('Failed to generate client analytics');
        console.error('Analytics generation error:', err);
      } finally {
        setLoading(false);
      }
    };

    generateAnalytics();
  }, [client.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || 'Failed to load client analytics'}
        </AlertDescription>
      </Alert>
    );
  }

  const getPriorityColor = (priority: ActionPriority) => {
    switch (priority) {
      case ActionPriority.URGENT:
        return 'destructive';
      case ActionPriority.HIGH:
        return 'default';
      case ActionPriority.MEDIUM:
        return 'secondary';
      case ActionPriority.LOW:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case InsightType.OPPORTUNITY:
        return <Target className="h-4 w-4 text-green-500" />;
      case InsightType.RISK:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case InsightType.ALERT:
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case InsightType.RECOMMENDATION:
        return <Brain className="h-4 w-4 text-blue-500" />;
      case InsightType.TREND:
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.7) return 'text-red-500';
    if (riskScore >= 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Analytics</h2>
          <p className="text-muted-foreground">
            AI-powered insights for {client.name}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {analytics.healthScore.lastUpdated.toLocaleDateString()}
        </Badge>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{analytics.healthScore.overall}</div>
              {getTrendIcon(analytics.healthScore.trend)}
            </div>
            <Progress value={analytics.healthScore.overall} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.healthScore.trend} trend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(analytics.churnPrediction.riskScore)}`}>
              {Math.round(analytics.churnPrediction.riskScore * 100)}%
            </div>
            <Progress 
              value={analytics.churnPrediction.riskScore * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(analytics.churnPrediction.confidence * 100)}% confidence
            </p>
          </CardContent>
        </Card>

        {analytics.leadScore && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lead Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{analytics.leadScore.score}</div>
                <Badge variant="outline">{analytics.leadScore.grade}</Badge>
              </div>
              <Progress value={analytics.leadScore.score} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(analytics.leadScore.conversionProbability * 100)}% conversion probability
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Pending</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.nextBestActions.length}</div>
            <div className="flex space-x-1 mt-2">
              {analytics.nextBestActions.slice(0, 3).map((action, index) => (
                <Badge 
                  key={index} 
                  variant={getPriorityColor(action.priority)}
                  className="text-xs"
                >
                  {action.priority}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next actions required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
          {analytics.leadScore && <TabsTrigger value="lead">Lead Score</TabsTrigger>}
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Score Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of client health factors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analytics.healthScore.factors).map(([factor, score]) => (
                <div key={factor} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {factor.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-muted-foreground">{score}/100</span>
                  </div>
                  <Progress value={score} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
                <CardDescription>
                  Factors contributing to churn risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.churnPrediction.riskFactors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <Badge variant="outline">
                        {Math.round(factor.impact * 100)}% impact
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                    <Progress value={factor.impact * 100} />
                  </div>
                ))}
                {analytics.churnPrediction.riskFactors.length === 0 && (
                  <p className="text-sm text-muted-foreground">No significant risk factors identified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Strategies</CardTitle>
                <CardDescription>
                  Recommended actions to reduce churn risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.churnPrediction.retentionStrategies.map((strategy, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium">{strategy.strategy}</h4>
                      <Badge variant={getPriorityColor(strategy.priority)}>
                        {strategy.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{strategy.description}</p>
                    <div className="flex justify-between text-xs">
                      <span>Effectiveness: {Math.round(strategy.estimatedEffectiveness * 100)}%</span>
                      <span>Cost: {strategy.estimatedCost}</span>
                      <span>Timeline: {strategy.timeline}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {analytics.leadScore && (
          <TabsContent value="lead" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Scoring Factors</CardTitle>
                <CardDescription>
                  Breakdown of lead qualification score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.leadScore.factors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          Weight: {Math.round(factor.weight * 100)}%
                        </span>
                        <span className="text-sm font-medium">{factor.score}/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                    <Progress value={factor.score} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Suggestions</CardTitle>
              <CardDescription>
                AI-generated personalized communication recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.communicationSuggestions.map((suggestion, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="text-sm font-medium">{suggestion.subject}</h4>
                    </div>
                    <Badge variant={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{suggestion.content}</p>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span>Type: {suggestion.type}</span>
                    <span>Timing: {suggestion.timing.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Expected: {suggestion.expectedOutcome}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onActionClick?.(suggestion.subject)}
                    >
                      Take Action
                    </Button>
                  </div>
                </div>
              ))}
              {analytics.communicationSuggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">No communication suggestions at this time</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>
                  Intelligent observations and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.insights.map((insight, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start space-x-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
                {analytics.insights.length === 0 && (
                  <p className="text-sm text-muted-foreground">No insights available at this time</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Best Actions</CardTitle>
                <CardDescription>
                  Prioritized action recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.nextBestActions.map((action, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium">{action.action}</h4>
                      <Badge variant={getPriorityColor(action.priority)}>
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.reason}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span>Impact: {action.estimatedImpact}</span>
                      <span>Due: {action.suggestedDate.toLocaleDateString()}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onActionClick?.(action.action)}
                    >
                      Execute Action
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}