'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare,
  Activity,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { Client, InteractionType, InteractionOutcome } from '@/types/client';

interface ClientEngagementMetricsProps {
  client: Client;
}

interface EngagementMetrics {
  totalInteractions: number;
  interactionsByType: Record<InteractionType, number>;
  interactionsByOutcome: Record<InteractionOutcome, number>;
  averageResponseTime: number;
  engagementTrend: 'up' | 'down' | 'stable';
  lastInteractionDays: number;
  communicationFrequency: number; // interactions per month
  sentimentTrend: number; // -1 to 1
  projectEngagement: number; // 0 to 100
}

export default function ClientEngagementMetrics({ client }: ClientEngagementMetricsProps) {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    calculateMetrics();
  }, [client, timeRange]);

  const calculateMetrics = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const recentInteractions = client.interactions.filter(
      interaction => new Date(interaction.date) >= cutoffDate
    );

    // Calculate interaction counts by type
    const interactionsByType = Object.values(InteractionType).reduce((acc, type) => {
      acc[type] = recentInteractions.filter(i => i.type === type).length;
      return acc;
    }, {} as Record<InteractionType, number>);

    // Calculate interaction counts by outcome
    const interactionsByOutcome = Object.values(InteractionOutcome).reduce((acc, outcome) => {
      acc[outcome] = recentInteractions.filter(i => i.outcome === outcome).length;
      return acc;
    }, {} as Record<InteractionOutcome, number>);

    // Calculate average response time (mock calculation)
    const averageResponseTime = recentInteractions.length > 0 
      ? recentInteractions.reduce((sum, interaction) => sum + (interaction.duration || 30), 0) / recentInteractions.length
      : 0;

    // Calculate days since last interaction
    const lastInteractionDate = client.interactions.length > 0 
      ? new Date(Math.max(...client.interactions.map(i => new Date(i.date).getTime())))
      : new Date(client.relationship.lastContactDate);
    const lastInteractionDays = Math.floor((now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate communication frequency (interactions per month)
    const daysInRange = Math.floor((now.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
    const communicationFrequency = (recentInteractions.length / daysInRange) * 30;

    // Calculate sentiment trend
    const sentimentScores = recentInteractions.map(i => i.sentiment.overall);
    const sentimentTrend = sentimentScores.length > 0 
      ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
      : 0;

    // Determine engagement trend (simplified)
    const engagementTrend: 'up' | 'down' | 'stable' = 
      communicationFrequency > 5 ? 'up' : 
      communicationFrequency < 2 ? 'down' : 'stable';

    // Calculate project engagement (based on active projects and interactions)
    const projectEngagement = Math.min(100, (client.projects.length * 20) + (communicationFrequency * 5));

    setMetrics({
      totalInteractions: recentInteractions.length,
      interactionsByType,
      interactionsByOutcome,
      averageResponseTime,
      engagementTrend,
      lastInteractionDays,
      communicationFrequency,
      sentimentTrend,
      projectEngagement,
    });
  };

  const getEngagementTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getInteractionTypeIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case InteractionType.PHONE_CALL:
        return <Phone className="h-4 w-4" />;
      case InteractionType.VIDEO_CALL:
        return <Calendar className="h-4 w-4" />;
      case InteractionType.MEETING:
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatInteractionType = (type: InteractionType) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatOutcome = (outcome: InteractionOutcome) => {
    return outcome.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!metrics) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Engagement Metrics</h3>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInteractions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getEngagementTrendIcon(metrics.engagementTrend)}
              <span className="ml-1">
                {metrics.engagementTrend === 'up' ? 'Increasing' : 
                 metrics.engagementTrend === 'down' ? 'Decreasing' : 'Stable'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communication Frequency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.communicationFrequency.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">interactions/month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Interaction</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.lastInteractionDays}</div>
            <p className="text-xs text-muted-foreground">days ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentiment Trend</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSentimentColor(metrics.sentimentTrend)}`}>
              {metrics.sentimentTrend > 0 ? '+' : ''}{(metrics.sentimentTrend * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">overall sentiment</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactions by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Interactions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.interactionsByType)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getInteractionTypeIcon(type as InteractionType)}
                      <span className="text-sm">{formatInteractionType(type as InteractionType)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / metrics.totalInteractions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Interactions by Outcome */}
        <Card>
          <CardHeader>
            <CardTitle>Interaction Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.interactionsByOutcome)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([outcome, count]) => (
                  <div key={outcome} className="flex items-center justify-between">
                    <span className="text-sm">{formatOutcome(outcome as InteractionOutcome)}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            outcome === 'positive' ? 'bg-green-500' :
                            outcome === 'negative' ? 'bg-red-500' :
                            outcome === 'deal_closed' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${(count / metrics.totalInteractions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Score */}
      <Card>
        <CardHeader>
          <CardTitle>Project Engagement Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Engagement</span>
              <span className="text-2xl font-bold">{metrics.projectEngagement}/100</span>
            </div>
            <Progress value={metrics.projectEngagement} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Active Projects</p>
                <p className="font-medium">{client.projects.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Response Time</p>
                <p className="font-medium">{metrics.averageResponseTime.toFixed(0)} min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Health Score</p>
                <p className="font-medium">{client.aiProfile.healthScore}/100</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.lastInteractionDays > 14 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Follow-up Needed</p>
                  <p className="text-sm text-yellow-700">
                    It's been {metrics.lastInteractionDays} days since last contact. Consider reaching out.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.communicationFrequency < 2 && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Low Engagement</p>
                  <p className="text-sm text-red-700">
                    Communication frequency is below average. Consider increasing touchpoints.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.sentimentTrend < -0.2 && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <Target className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Negative Sentiment Trend</p>
                  <p className="text-sm text-red-700">
                    Recent interactions show declining sentiment. Address concerns proactively.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.engagementTrend === 'up' && metrics.sentimentTrend > 0.2 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Positive Momentum</p>
                  <p className="text-sm text-green-700">
                    Great engagement and positive sentiment. Consider upselling opportunities.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}