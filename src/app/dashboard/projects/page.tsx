'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { ProjectList } from '@/components/projects/ProjectList';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { useProjects } from '@/hooks/use-projects';
import { ProjectStatus } from '@/types/project';

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects
  } = useProjects({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject(projectData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    planning: projects.filter(p => p.status === ProjectStatus.PLANNING).length,
    completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects with AI-powered insights and optimization
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{projectStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{projectStats.planning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{projectStats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
            <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>

        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <ProjectFilters />
          </CardContent>
        </Card>
      )}

      {/* Projects Display */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading projects: {error.message}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ProjectGrid 
              projects={projects}
              onUpdate={updateProject}
              onDelete={deleteProject}
            />
          ) : (
            <ProjectList 
              projects={projects}
              onUpdate={updateProject}
              onDelete={deleteProject}
            />
          )}
        </>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}