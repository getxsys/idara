'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Users, DollarSign } from 'lucide-react';
import { Project, ResourceType } from '@/types/project';
import { formatCurrency } from '@/lib/utils';

interface ProjectResourcesProps {
  project: Project;
  onUpdate: (data: Partial<Project>) => Promise<void>;
}

export function ProjectResources({ project, onUpdate }: ProjectResourcesProps) {
  const getResourceTypeColor = (type: ResourceType) => {
    switch (type) {
      case ResourceType.HUMAN:
        return 'bg-blue-100 text-blue-800';
      case ResourceType.EQUIPMENT:
        return 'bg-green-100 text-green-800';
      case ResourceType.SOFTWARE:
        return 'bg-purple-100 text-purple-800';
      case ResourceType.BUDGET:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCost = project.resources.reduce((acc, resource) => acc + resource.cost, 0);
  const humanResources = project.resources.filter(r => r.type === ResourceType.HUMAN);

  return (
    <div className="space-y-6">
      {/* Resource Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              {project.resources.length} resource{project.resources.length !== 1 ? 's' : ''} allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{humanResources.length}</div>
            <p className="text-xs text-muted-foreground">
              Human resources assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {humanResources.length > 0 
                ? Math.round(humanResources.reduce((acc, r) => acc + r.allocation, 0) / humanResources.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average team allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resources List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resource Allocation</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.resources.length > 0 ? (
            <div className="space-y-4">
              {project.resources.map((resource) => (
                <div key={resource.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{resource.name}</h4>
                      <Badge className={getResourceTypeColor(resource.type)}>
                        {resource.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(resource.cost)}</p>
                      <p className="text-sm text-muted-foreground">Cost</p>
                    </div>
                  </div>
                  
                  {resource.type === ResourceType.HUMAN && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Allocation</span>
                        <span className="font-medium">{resource.allocation}%</span>
                      </div>
                      <Progress value={resource.allocation} />
                    </div>
                  )}
                  
                  {resource.availability.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Availability</p>
                      <div className="space-y-1">
                        {resource.availability.map((avail, index) => (
                          <div key={index} className="text-sm">
                            {avail.startDate.toLocaleDateString()} - {avail.endDate.toLocaleDateString()}: {avail.availableHours}h
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No resources allocated</h3>
              <p className="text-muted-foreground">
                Add team members and resources to track project capacity.
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Resource
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}