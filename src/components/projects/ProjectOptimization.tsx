'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, Clock, DollarSign, Users, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project } from '@/types/project';
import { 
  ProjectOptimizationService, 
  OptimizationSuggestion, 
  RiskPrediction, 
  ResourceOptimization,
  ProjectTemplate 
} from '@/lib/services/project-optimization';
import { formatCurrency } from '@/lib/utils';

interface ProjectOptimizationProps {
  project: Project;
  onApplyOptimization?: (optimization: any) => Promise<void>;
}

export function ProjectOptimization({ project, onApplyOptimization }: ProjectOptimizationProps) {
  const [loading, setLoading] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([]);
  const [resourceOptimizations, setResourceOptimizations] = useState<ResourceOptimization[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [progressTracking, setProgressTracking] = useState<{
    alerts: Array<{
      type: 'milestone' | 'phase' | 'risk' | 'budget';
      severity: 'info' | 'warning' | 'critical';
      title: string;
      description: string;
      actionRequired: boolean;
    }>;
    insights: string[];
  } | null>(null);

  useEffect(() => {
    loadOptimizationData();
  }, [project.id]);

  const loadOptimizationData = async () => {
    setLoading(true);
    try {
      const [
        optimizationSuggestions,
        risks,
        resourceOpts,
        templateSuggestions,
        tracking
      ] = await Promise.all([
        ProjectOptimizationService.generateOptimizations(project),
        ProjectOptimizationService.detectRisks(project),
        ProjectOptimizationService.optimizeResources(project),
        ProjectOptimizationService.suggestTemplates(project.description, [], undefined, undefined),
        ProjectOptimizationService.trackProgress(project)
      ]);

      setOptimizations(optimizationSuggestions);
      setRiskPredictions(risks);
      setResourceOptimizations(resourceOpts);
      setTemplates(templateSuggestions);
      setProgressTracking(tracking);
    } catch (error) {
      console.error('Failed to load optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading AI optimization insights...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Tracking Alerts */}
      {progressTracking && progressTracking.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressTracking.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.actionRequired && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Action Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {progressTracking && progressTracking.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progressTracking.insights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Tabs */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions">Optimizations</TabsTrigger>
          <TabsTrigger value="risks">Risk Predictions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Optimization Suggestions */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {optimizations.length > 0 ? (
                <div className="space-y-4">
                  {optimizations.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <Badge className={getImpactColor(suggestion.impact)}>
                              {suggestion.impact.toUpperCase()} IMPACT
                            </Badge>
                            <Badge className={getEffortColor(suggestion.effort)}>
                              {suggestion.effort.toUpperCase()} EFFORT
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                        </div>
                      </div>

                      {/* Estimated Savings */}
                      {suggestion.estimatedSavings && (
                        <div className="grid gap-4 md:grid-cols-3 mb-3">
                          {suggestion.estimatedSavings.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                Save {suggestion.estimatedSavings.time} days
                              </span>
                            </div>
                          )}
                          {suggestion.estimatedSavings.cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                Save {formatCurrency(suggestion.estimatedSavings.cost)}
                              </span>
                            </div>
                          )}
                          {suggestion.estimatedSavings.risk && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">
                                Reduce risk by {Math.round(suggestion.estimatedSavings.risk * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Implementation Steps */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Implementation Steps:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {suggestion.implementation.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => onApplyOptimization?.(suggestion)}
                        >
                          Apply Optimization
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No optimizations needed</h3>
                  <p className="text-muted-foreground">Your project is already well-optimized!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Predictions */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Risk Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {riskPredictions.length > 0 ? (
                <div className="space-y-4">
                  {riskPredictions.map((risk, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{risk.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                        </div>
                        <Badge variant="outline">
                          {Math.round(risk.confidence * 100)}% confidence
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Probability</p>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.predictedProbability * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(risk.predictedProbability * 100)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Impact</p>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.predictedImpact * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(risk.predictedImpact * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Mitigation Strategies:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {risk.mitigationStrategies.map((strategy, strategyIndex) => (
                              <li key={strategyIndex} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                {strategy}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-sm mb-2">Early Warning Signals:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {risk.earlyWarningSignals.map((signal, signalIndex) => (
                              <li key={signalIndex} className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                {signal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium">No significant risks predicted</h3>
                  <p className="text-muted-foreground">AI analysis shows low risk for project issues.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Optimization */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              {resourceOptimizations.length > 0 ? (
                <div className="space-y-4">
                  {resourceOptimizations.map((optimization, index) => {
                    const resource = project.resources.find(r => r.id === optimization.resourceId);
                    if (!resource) return null;

                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{resource.name}</h4>
                            <p className="text-sm text-muted-foreground">{optimization.reasoning}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Current Allocation</p>
                            <div className="flex items-center gap-2">
                              <Progress value={optimization.currentAllocation} className="flex-1" />
                              <span className="text-sm font-medium">
                                {optimization.currentAllocation}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Recommended Allocation</p>
                            <div className="flex items-center gap-2">
                              <Progress value={optimization.recommendedAllocation} className="flex-1" />
                              <span className="text-sm font-medium">
                                {optimization.recommendedAllocation}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm"><strong>Impact:</strong> {optimization.impact}</p>
                        </div>

                        {optimization.alternatives && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Alternative Resources:</h5>
                            <div className="space-y-2">
                              {optimization.alternatives.map((alt, altIndex) => (
                                <div key={altIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div>
                                    <p className="text-sm font-medium">{alt.name}</p>
                                    <p className="text-xs text-muted-foreground">{alt.availability}</p>
                                  </div>
                                  <p className="text-sm font-medium">{formatCurrency(alt.cost)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => onApplyOptimization?.(optimization)}
                          >
                            Apply Changes
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Resources are optimally allocated</h3>
                  <p className="text-muted-foreground">No resource optimization suggestions at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Project Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Duration: {template.estimatedDuration} days</span>
                            <span>Success Rate: {Math.round(template.successRate * 100)}%</span>
                            <span>Avg Budget: {formatCurrency(template.averageBudget)}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Phases:</h5>
                          <div className="space-y-1">
                            {template.phases.map((phase, phaseIndex) => (
                              <div key={phaseIndex} className="text-sm text-muted-foreground">
                                {phaseIndex + 1}. {phase.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-sm mb-2">Tags:</h5>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onApplyOptimization?.(template)}
                        >
                          Apply Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No matching templates found</h3>
                  <p className="text-muted-foreground">Your project appears to be unique!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}