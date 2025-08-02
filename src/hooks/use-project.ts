'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/project';
import { UpdateProjectData } from '@/lib/validations/project';

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: Error | null;
  updateProject: (data: Partial<UpdateProjectData>) => Promise<Project>;
  refreshProject: () => Promise<void>;
}

// Mock project data - in a real app, this would come from the API
const mockProject: Project = {
  id: '1',
  name: 'E-commerce Platform Redesign',
  description: 'Complete overhaul of the existing e-commerce platform with modern UI/UX and improved performance.',
  status: 'active' as const,
  timeline: {
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    milestones: [
      {
        id: 'm1',
        name: 'Design System Complete',
        description: 'Finalize design system and component library',
        dueDate: new Date('2024-03-01'),
        completed: true,
        completedAt: new Date('2024-02-28'),
        dependencies: [],
      },
      {
        id: 'm2',
        name: 'Frontend Development',
        description: 'Complete frontend implementation',
        dueDate: new Date('2024-05-15'),
        completed: false,
        dependencies: ['m1'],
      },
      {
        id: 'm3',
        name: 'Backend Integration',
        description: 'Integrate with existing backend systems',
        dueDate: new Date('2024-06-01'),
        completed: false,
        dependencies: ['m2'],
      },
    ],
    phases: [
      {
        id: 'p1',
        name: 'Discovery & Planning',
        description: 'Research and planning phase',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        status: 'completed' as const,
        tasks: [],
        progress: 100,
      },
      {
        id: 'p2',
        name: 'Design & Prototyping',
        description: 'UI/UX design and prototyping',
        startDate: new Date('2024-02-16'),
        endDate: new Date('2024-04-15'),
        status: 'in_progress' as const,
        tasks: [],
        progress: 75,
      },
      {
        id: 'p3',
        name: 'Development',
        description: 'Frontend and backend development',
        startDate: new Date('2024-04-16'),
        endDate: new Date('2024-06-15'),
        status: 'not_started' as const,
        tasks: [],
        progress: 0,
      },
    ],
  },
  resources: [
    {
      id: 'r1',
      type: 'human' as const,
      name: 'Frontend Developer',
      allocation: 100,
      cost: 8000,
      availability: [],
    },
    {
      id: 'r2',
      type: 'human' as const,
      name: 'UI/UX Designer',
      allocation: 50,
      cost: 4000,
      availability: [],
    },
    {
      id: 'r3',
      type: 'software' as const,
      name: 'Design Tools License',
      allocation: 100,
      cost: 500,
      availability: [],
    },
  ],
  risks: [
    {
      id: 'r1',
      title: 'Third-party API Changes',
      description: 'Payment gateway API might change during development',
      category: 'technical' as const,
      probability: 0.3,
      impact: 0.7,
      severity: 'medium' as const,
      mitigation: 'Monitor API documentation and maintain fallback options',
      owner: 'Tech Lead',
      status: 'monitoring' as const,
      identifiedAt: new Date('2024-02-01'),
      reviewDate: new Date('2024-04-01'),
    },
    {
      id: 'r2',
      title: 'Resource Availability',
      description: 'Key team member might be unavailable during critical phase',
      category: 'resource' as const,
      probability: 0.2,
      impact: 0.8,
      severity: 'high' as const,
      mitigation: 'Cross-train team members and identify backup resources',
      owner: 'Project Manager',
      status: 'mitigating' as const,
      identifiedAt: new Date('2024-02-15'),
      reviewDate: new Date('2024-03-15'),
    },
  ],
  aiInsights: {
    healthScore: 85,
    riskLevel: 'medium' as const,
    completionPrediction: new Date('2024-06-25'),
    budgetVariance: -5.2,
    scheduleVariance: 2.1,
    recommendations: [
      {
        id: 'rec1',
        type: 'schedule_optimization' as const,
        title: 'Optimize Frontend Development',
        description: 'Consider parallel development of components to reduce timeline',
        priority: 'medium' as const,
        actionRequired: true,
        estimatedImpact: 'Could save 2-3 weeks',
        createdAt: new Date(),
      },
      {
        id: 'rec2',
        type: 'resource_allocation' as const,
        title: 'Additional QA Resources',
        description: 'Consider adding QA resources for the testing phase',
        priority: 'high' as const,
        actionRequired: false,
        estimatedImpact: 'Improved quality and reduced post-launch issues',
        createdAt: new Date(),
      },
    ],
    trends: [
      {
        metric: 'velocity',
        direction: 'up' as const,
        change: 15,
        period: 'last 2 weeks',
        significance: 'medium' as const,
      },
      {
        metric: 'budget_utilization',
        direction: 'stable' as const,
        change: 0,
        period: 'current month',
        significance: 'low' as const,
      },
    ],
    lastUpdated: new Date(),
  },
  collaborators: ['user1', 'user2', 'user3', 'user4'],
  documents: [],
  clientId: 'client1',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

export function useProject(projectId: string): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, this would be an API call
      if (projectId === '1') {
        setProject(mockProject);
      } else {
        throw new Error('Project not found');
      }
    } catch (err) {
      setError(err as Error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = useCallback(async (data: Partial<UpdateProjectData>): Promise<Project> => {
    if (!project) {
      throw new Error('No project loaded');
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedProject = {
        ...project,
        ...data,
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      return updatedProject;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [project]);

  const refreshProject = useCallback(async () => {
    await fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    updateProject,
    refreshProject,
  };
}