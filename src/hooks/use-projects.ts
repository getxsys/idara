'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus } from '@/types/project';
import { CreateProjectData, UpdateProjectData } from '@/lib/validations/project';

interface UseProjectsOptions {
  search?: string;
  status?: ProjectStatus;
  clientId?: string;
  page?: number;
  limit?: number;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: Partial<UpdateProjectData>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

// Mock data for development
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform Redesign',
    description: 'Complete overhaul of the existing e-commerce platform with modern UI/UX and improved performance.',
    status: ProjectStatus.ACTIVE,
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
      ],
    },
    resources: [],
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
      ],
      trends: [],
      lastUpdated: new Date(),
    },
    collaborators: ['user1', 'user2', 'user3'],
    documents: [],
    clientId: 'client1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms.',
    status: ProjectStatus.PLANNING,
    timeline: {
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-30'),
      milestones: [],
      phases: [],
    },
    resources: [],
    risks: [],
    aiInsights: {
      healthScore: 92,
      riskLevel: 'low' as const,
      completionPrediction: new Date('2024-09-25'),
      budgetVariance: 0,
      scheduleVariance: 0,
      recommendations: [],
      trends: [],
      lastUpdated: new Date(),
    },
    collaborators: ['user1', 'user4'],
    documents: [],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
];

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { search, status, clientId, page = 1, limit = 10 } = options;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Filter mock data based on options
      let filteredProjects = [...mockProjects];

      if (search) {
        filteredProjects = filteredProjects.filter(project =>
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (status) {
        filteredProjects = filteredProjects.filter(project => project.status === status);
      }

      if (clientId) {
        filteredProjects = filteredProjects.filter(project => project.clientId === clientId);
      }

      setTotalCount(filteredProjects.length);
      
      // Simulate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

      setProjects(paginatedProjects);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [search, status, clientId, page, limit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (data: CreateProjectData): Promise<Project> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newProject: Project = {
        id: `project-${Date.now()}`,
        ...data,
        aiInsights: {
          healthScore: 100,
          riskLevel: 'low' as const,
          completionPrediction: data.timeline.endDate,
          budgetVariance: 0,
          scheduleVariance: 0,
          recommendations: [],
          trends: [],
          lastUpdated: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjects.push(newProject);
      await fetchProjects();
      return newProject;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, data: Partial<UpdateProjectData>): Promise<Project> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const projectIndex = mockProjects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      const updatedProject = {
        ...mockProjects[projectIndex],
        ...data,
        updatedAt: new Date(),
      };

      mockProjects[projectIndex] = updatedProject;
      await fetchProjects();
      return updatedProject;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const projectIndex = mockProjects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      mockProjects.splice(projectIndex, 1);
      await fetchProjects();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  const hasMore = totalCount > page * limit;

  return {
    projects,
    loading,
    error,
    totalCount,
    hasMore,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}