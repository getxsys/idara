'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Calendar, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project, ProjectStatus } from '@/types/project';
import { formatDate } from '@/lib/utils';

interface ProjectGridProps {
  projects: Project[];
  onUpdate: (id: string, data: Partial<Project>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectGrid({ projects, onUpdate, onDelete }: ProjectGridProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case ProjectStatus.PLANNING:
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case ProjectStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateProgress = (project: Project) => {
    if (!project.timeline.phases.length) return 0;
    return Math.round(
      project.timeline.phases.reduce((acc, phase) => acc + phase.progress, 0) / 
      project.timeline.phases.length
    );
  };

  const handleAction = async (action: () => Promise<void>, projectId: string) => {
    setLoadingActions(prev => ({ ...prev, [projectId]: true }));
    try {
      await action();
    } finally {
      setLoadingActions(prev => ({ ...prev, [projectId]: false }));
    }
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No projects found. Create your first project to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const progress = calculateProgress(project);
        const activeRisks = project.risks.filter(r => r.status !== 'closed').length;
        
        return (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <CardTitle className="text-lg hover:text-blue-600 cursor-pointer line-clamp-1">
                      {project.name}
                    </CardTitle>
                  </Link>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction(
                        () => onUpdate(project.id, { status: ProjectStatus.ACTIVE }),
                        project.id
                      )}
                      disabled={loadingActions[project.id]}
                    >
                      Mark Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction(
                        () => onUpdate(project.id, { status: ProjectStatus.ON_HOLD }),
                        project.id
                      )}
                      disabled={loadingActions[project.id]}
                    >
                      Put on Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction(
                        () => onDelete(project.id),
                        project.id
                      )}
                      disabled={loadingActions[project.id]}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span className="font-medium">
                    {formatDate(project.timeline.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Team:</span>
                  <span className="font-medium">{project.collaborators.length}</span>
                </div>
              </div>

              {/* Health Score and Risks */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Health:</span>
                  <span className={`text-sm font-medium ${
                    project.aiInsights.healthScore >= 80 ? 'text-green-600' :
                    project.aiInsights.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {project.aiInsights.healthScore}/100
                  </span>
                </div>
                
                {activeRisks > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      {activeRisks} risk{activeRisks > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Insights Preview */}
              {project.aiInsights.recommendations.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs text-blue-800 font-medium mb-1">AI Recommendation:</p>
                  <p className="text-xs text-blue-700 line-clamp-2">
                    {project.aiInsights.recommendations[0].description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}