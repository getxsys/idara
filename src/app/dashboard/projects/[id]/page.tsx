'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Users, Calendar, BarChart3, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProjectOverview } from '@/components/projects/ProjectOverview';
import { ProjectTimeline } from '@/components/projects/ProjectTimeline';
import { ProjectTasks } from '@/components/projects/ProjectTasks';
import { ProjectResources } from '@/components/projects/ProjectResources';
import { ProjectRisks } from '@/components/projects/ProjectRisks';
import { ProjectInsights } from '@/components/projects/ProjectInsights';
import { ProjectOptimization } from '@/components/projects/ProjectOptimization';
import { useProject } from '@/hooks/use-project';
import { ProjectStatus } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    project,
    loading,
    error,
    updateProject,
    refreshProject
  } = useProject(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error ? `Error loading project: ${error.message}` : 'Project not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.aiInsights.healthScore}/100</div>
            <div className={`text-xs ${project.aiInsights.healthScore >= 80 ? 'text-green-600' : 
              project.aiInsights.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {project.aiInsights.healthScore >= 80 ? 'Excellent' : 
               project.aiInsights.healthScore >= 60 ? 'Good' : 'Needs Attention'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(project.timeline.phases.reduce((acc, phase) => acc + phase.progress, 0) / project.timeline.phases.length || 0)}%
            </div>
            <div className="text-xs text-muted-foreground">Overall completion</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.collaborators.length}</div>
            <div className="text-xs text-muted-foreground">Active collaborators</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {project.risks.filter(r => r.status !== 'closed').length}
            </div>
            <div className="text-xs text-muted-foreground">Require attention</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProjectOverview project={project} onUpdate={updateProject} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <ProjectTimeline project={project} onUpdate={updateProject} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ProjectTasks project={project} onUpdate={updateProject} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ProjectResources project={project} onUpdate={updateProject} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <ProjectRisks project={project} onUpdate={updateProject} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <ProjectInsights project={project} onRefresh={refreshProject} />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <ProjectOptimization project={project} onApplyOptimization={async (optimization) => {
            console.log('Applying optimization:', optimization);
            // Here you would implement the logic to apply the optimization
            // For now, we'll just log it
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}