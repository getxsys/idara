'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo } from 'lucide-react';
import { Project } from '@/types/project';

interface ProjectTasksProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => Promise<void>;
}

export function ProjectTasks({ project, onUpdate }: ProjectTasksProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <ListTodo className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Task management coming soon</h3>
          <p className="text-muted-foreground">
            This feature will allow you to create and manage project tasks.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}