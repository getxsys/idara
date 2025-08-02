'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Calendar, Users, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Project, ProjectStatus } from '@/types/project';
import { formatDate } from '@/lib/utils';

interface ProjectListProps {
  projects: Project[];
  onUpdate: (id: string, data: Partial<Project>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectList({ projects, onUpdate, onDelete }: ProjectListProps) {
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
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Risks</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const progress = calculateProgress(project);
              const activeRisks = project.risks.filter(r => r.status !== 'closed').length;
              
              return (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <Link 
                        href={`/dashboard/projects/${project.id}`}
                        className="font-medium hover:text-blue-600 flex items-center gap-2"
                      >
                        {project.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 w-20" />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(project.timeline.endDate)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {project.collaborators.length}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm font-medium ${
                        project.aiInsights.healthScore >= 80 ? 'text-green-600' :
                        project.aiInsights.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {project.aiInsights.healthScore}/100
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {activeRisks > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">
                          {activeRisks}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-green-600">None</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}