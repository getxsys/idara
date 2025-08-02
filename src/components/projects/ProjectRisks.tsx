'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Project, RiskSeverity, RiskStatus } from '@/types/project';
import { formatDate } from '@/lib/utils';

interface ProjectRisksProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => Promise<void>;
}

export function ProjectRisks({ project, onUpdate }: ProjectRisksProps) {
  const getSeverityColor = (severity: RiskSeverity) => {
    switch (severity) {
      case RiskSeverity.LOW:
        return 'bg-green-100 text-green-800';
      case RiskSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case RiskSeverity.HIGH:
        return 'bg-orange-100 text-orange-800';
      case RiskSeverity.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: RiskStatus) => {
    switch (status) {
      case RiskStatus.IDENTIFIED:
        return 'bg-blue-100 text-blue-800';
      case RiskStatus.ANALYZING:
        return 'bg-purple-100 text-purple-800';
      case RiskStatus.MITIGATING:
        return 'bg-orange-100 text-orange-800';
      case RiskStatus.MONITORING:
        return 'bg-yellow-100 text-yellow-800';
      case RiskStatus.CLOSED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeRisks = project.risks.filter(r => r.status !== RiskStatus.CLOSED);
  const closedRisks = project.risks.filter(r => r.status === RiskStatus.CLOSED);
  
  const riskStats = {
    total: project.risks.length,
    active: activeRisks.length,
    high: activeRisks.filter(r => r.severity === RiskSeverity.HIGH || r.severity === RiskSeverity.CRITICAL).length,
    avgImpact: project.risks.length > 0 
      ? Math.round((project.risks.reduce((acc, r) => acc + r.impact, 0) / project.risks.length) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {riskStats.active} active, {closedRisks.length} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskStats.high}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskStats.avgImpact}%</div>
            <p className="text-xs text-muted-foreground">
              Average risk impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              project.aiInsights.riskLevel === 'low' ? 'text-green-600' :
              project.aiInsights.riskLevel === 'medium' ? 'text-yellow-600' :
              project.aiInsights.riskLevel === 'high' ? 'text-orange-600' : 'text-red-600'
            }`}>
              {project.aiInsights.riskLevel.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall project risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Risks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Risks</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Risk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeRisks.length > 0 ? (
            <div className="space-y-4">
              {activeRisks.map((risk) => (
                <div key={risk.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{risk.title}</h4>
                        <Badge className={getSeverityColor(risk.severity)}>
                          {risk.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(risk.status)}>
                          {risk.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Probability</p>
                      <div className="flex items-center gap-2">
                        <Progress value={risk.probability * 100} className="flex-1" />
                        <span className="text-sm font-medium">{Math.round(risk.probability * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Impact</p>
                      <div className="flex items-center gap-2">
                        <Progress value={risk.impact * 100} className="flex-1" />
                        <span className="text-sm font-medium">{Math.round(risk.impact * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Mitigation Strategy</p>
                      <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Owner: <span className="font-medium">{risk.owner}</span></span>
                      <span>Review: <span className="font-medium">{formatDate(risk.reviewDate)}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">No active risks</h3>
              <p className="text-muted-foreground">
                Great! Your project currently has no active risks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Risks */}
      {closedRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Closed Risks ({closedRisks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {closedRisks.map((risk) => (
                <div key={risk.id} className="p-3 bg-muted rounded-lg opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{risk.title}</h5>
                      <p className="text-sm text-muted-foreground">{risk.description}</p>
                    </div>
                    <Badge className={getSeverityColor(risk.severity)}>
                      {risk.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}