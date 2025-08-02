'use client';

import { useState } from 'react';
import { Edit, Save, X, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, ProjectStatus } from '@/types/project';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ProjectOverviewProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => Promise<void>;
}

export function ProjectOverview({ project, onUpdate }: ProjectOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: project.name,
      description: project.description,
      status: project.status,
    });
    setIsEditing(false);
  };

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

  const calculateProgress = () => {
    if (!project.timeline.phases.length) return 0;
    return Math.round(
      project.timeline.phases.reduce((acc, phase) => acc + phase.progress, 0) / 
      project.timeline.phases.length
    );
  };

  const totalBudget = project.resources.reduce((acc, resource) => acc + resource.cost, 0);
  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Details</CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData({ ...editData, status: value as ProjectStatus })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                    <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                    <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {project.timeline.phases.filter(p => p.status === 'completed').length} of{' '}
              {project.timeline.phases.length} phases complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.ceil((project.timeline.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
            <p className="text-xs text-muted-foreground">
              Until {formatDate(project.timeline.endDate)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Started {formatDate(project.timeline.startDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.collaborators.length}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
            <p className="text-xs text-muted-foreground mt-1">
              {project.resources.filter(r => r.type === 'human').length} resources allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Total allocated</p>
            {project.aiInsights.budgetVariance !== 0 && (
              <p className={`text-xs mt-1 ${
                project.aiInsights.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {project.aiInsights.budgetVariance > 0 ? '+' : ''}
                {project.aiInsights.budgetVariance.toFixed(1)}% variance
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Project Duration</span>
              <span className="font-medium">
                {formatDate(project.timeline.startDate)} - {formatDate(project.timeline.endDate)}
              </span>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Milestones</h4>
              {project.timeline.milestones.length > 0 ? (
                <div className="space-y-2">
                  {project.timeline.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <p className="font-medium">{milestone.name}</p>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(milestone.dueDate)}</p>
                        {milestone.completed && milestone.completedAt && (
                          <p className="text-xs text-green-600">
                            Completed {formatDate(milestone.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No milestones defined</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Phases</h4>
              {project.timeline.phases.length > 0 ? (
                <div className="space-y-2">
                  {project.timeline.phases.map((phase) => (
                    <div key={phase.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{phase.name}</h5>
                        <Badge variant="outline">
                          {phase.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {phase.description && (
                        <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</span>
                        <span className="font-medium">{phase.progress}% complete</span>
                      </div>
                      <Progress value={phase.progress} className="mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No phases defined</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}