'use client';

import { useState } from 'react';
import { Plus, Calendar, CheckCircle, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Project, Milestone, ProjectPhase } from '@/types/project';
import { formatDate } from '@/lib/utils';

interface ProjectTimelineProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => Promise<void>;
}

export function ProjectTimeline({ project, onUpdate }: ProjectTimelineProps) {
  const [selectedView, setSelectedView] = useState<'timeline' | 'milestones' | 'phases'>('timeline');

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedMilestones = [...project.timeline.milestones].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  const sortedPhases = [...project.timeline.phases].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant={selectedView === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('timeline')}
        >
          Timeline
        </Button>
        <Button
          variant={selectedView === 'milestones' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('milestones')}
        >
          Milestones
        </Button>
        <Button
          variant={selectedView === 'phases' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('phases')}
        >
          Phases
        </Button>
      </div>

      {/* Timeline View */}
      {selectedView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Project Duration */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-medium">Project Duration</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(project.timeline.startDate)} - {formatDate(project.timeline.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {Math.ceil((project.timeline.endDate.getTime() - project.timeline.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                  <p className="text-sm text-muted-foreground">Total duration</p>
                </div>
              </div>

              {/* Combined Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-4">
                  {/* Phases and Milestones combined and sorted */}
                  {[
                    ...sortedPhases.map(phase => ({ ...phase, type: 'phase' as const })),
                    ...sortedMilestones.map(milestone => ({ ...milestone, type: 'milestone' as const }))
                  ]
                    .sort((a, b) => {
                      const dateA = a.type === 'phase' ? a.startDate : a.dueDate;
                      const dateB = b.type === 'phase' ? b.startDate : b.dueDate;
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((item, index) => (
                      <div key={`${item.type}-${item.id}`} className="relative flex items-start gap-4">
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          item.type === 'milestone' 
                            ? item.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'bg-white border-gray-300'
                            : item.status === 'completed'
                              ? 'bg-green-500 border-green-500'
                              : item.status === 'in_progress'
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-white border-gray-300'
                        }`}>
                          {item.type === 'milestone' ? (
                            item.completed ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )
                          ) : (
                            <Clock className="h-4 w-4 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 pb-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {item.type === 'milestone' ? (
                                <p className="text-sm font-medium">{formatDate(item.dueDate)}</p>
                              ) : (
                                <div>
                                  <p className="text-sm font-medium">
                                    {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                  </p>
                                  <Badge className={getPhaseStatusColor(item.status)}>
                                    {item.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {item.type === 'phase' && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{item.progress}%</span>
                              </div>
                              <Progress value={item.progress} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones View */}
      {selectedView === 'milestones' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Milestones</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedMilestones.length > 0 ? (
              <div className="space-y-4">
                {sortedMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <h4 className="font-medium">{milestone.name}</h4>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        )}
                        {milestone.dependencies.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Depends on: {milestone.dependencies.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDate(milestone.dueDate)}</p>
                      {milestone.completed && milestone.completedAt && (
                        <p className="text-sm text-green-600">
                          Completed {formatDate(milestone.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No milestones yet</h3>
                <p className="text-muted-foreground">Add milestones to track important project goals.</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Milestone
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phases View */}
      {selectedView === 'phases' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Phases</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Phase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedPhases.length > 0 ? (
              <div className="space-y-4">
                {sortedPhases.map((phase) => (
                  <div key={phase.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{phase.name}</h4>
                        {phase.description && (
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        )}
                      </div>
                      <Badge className={getPhaseStatusColor(phase.status)}>
                        {phase.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{formatDate(phase.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{formatDate(phase.endDate)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} />
                    </div>
                    
                    {phase.tasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          {phase.tasks.length} task{phase.tasks.length > 1 ? 's' : ''} in this phase
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No phases defined</h3>
                <p className="text-muted-foreground">Break down your project into manageable phases.</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Phase
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}