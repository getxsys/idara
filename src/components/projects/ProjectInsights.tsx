'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Lightbulb, AlertCircle } from 'lucide-react';
import { Project, RecommendationPriority } from '@/types/project';
import { formatRelativeTime } from '@/lib/utils';

interface ProjectInsightsProps {
  project: Project;
  onRefresh: () => Promise<void>;
}

export function ProjectInsights({ project, onRefresh }: ProjectInsightsProps) {
  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case RecommendationPriority.LOW:
        return 'bg-green-100 text-green-800';
      case RecommendationPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case RecommendationPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case RecommendationPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              AI-Powered Insights
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Last updated {formatRelativeTime(project.aiInsights.lastUpdated)}
              </span>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthScoreColor(project.aiInsights.healthScore)}`}>
                {project.aiInsights.healthScore}/100
              </div>
              <p className="text-sm text-muted-foreground">Health Score</p>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                project.aiInsights.riskLevel === 'low' ? 'text-green-600' :
                project.aiInsights.riskLevel === 'medium' ? 'text-yellow-600' :
                project.aiInsights.riskLevel === 'high' ? 'text-orange-600' : 'text-red-600'
              }`}>
                {project.aiInsights.riskLevel.toUpperCase()}
              </div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {project.aiInsights.completionPrediction.toLocaleDateString()}
              </div>
              <p className="text-sm text-muted-foreground">Predicted Completion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {project.aiInsights.recommendations.length > 0 ? (
            <div className="space-y-4">
              {project.aiInsights.recommendations.map((rec) => (
                <div key={rec.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      {rec.actionRequired && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Type: {rec.type.replace('_', ' ').toLowerCase()}
                    </span>
                    <span className="font-medium">Impact: {rec.estimatedImpact}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No recommendations</h3>
              <p className="text-muted-foreground">
                Your project is running smoothly. Check back later for AI-generated insights.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {project.aiInsights.trends.length > 0 ? (
            <div className="space-y-4">
              {project.aiInsights.trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(trend.direction)}
                    <div>
                      <p className="font-medium capitalize">{trend.metric.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{trend.period}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      trend.direction === 'up' ? 'text-green-600' :
                      trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                      {Math.abs(trend.change)}%
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {trend.significance} significance
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No trends available</h3>
              <p className="text-muted-foreground">
                Trends will appear as your project progresses and more data becomes available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Variance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              project.aiInsights.budgetVariance > 0 ? 'text-red-600' : 
              project.aiInsights.budgetVariance < 0 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {project.aiInsights.budgetVariance > 0 ? '+' : ''}
              {project.aiInsights.budgetVariance.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {project.aiInsights.budgetVariance > 0 ? 'Over budget' : 
               project.aiInsights.budgetVariance < 0 ? 'Under budget' : 'On budget'}
            </p>
            {Math.abs(project.aiInsights.budgetVariance) > 10 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600">Significant variance detected</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              project.aiInsights.scheduleVariance > 0 ? 'text-red-600' : 
              project.aiInsights.scheduleVariance < 0 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {project.aiInsights.scheduleVariance > 0 ? '+' : ''}
              {project.aiInsights.scheduleVariance.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {project.aiInsights.scheduleVariance > 0 ? 'Behind schedule' : 
               project.aiInsights.scheduleVariance < 0 ? 'Ahead of schedule' : 'On schedule'}
            </p>
            {Math.abs(project.aiInsights.scheduleVariance) > 10 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600">Significant variance detected</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}