import { Project as PrismaProject } from '../../generated/prisma';
import { Project, ProjectStatus } from '@/types/project';
import { projectRepository } from '@/lib/database/repository/project';
import { CreateProjectData } from '@/lib/validations/project';
// import { SupabaseProjectService } from './supabase-project-service';

/**
 * Service to handle project data transformation and business logic
 */
export class ProjectService {
  /**
   * Transform a Prisma Project to our complex Project type
   */
  static transformPrismaProjectToProject(prismaProject: PrismaProject): Project {
    // Parse AI insights if they exist
    let aiInsights;
    try {
      aiInsights = prismaProject.aiInsights ? JSON.parse(prismaProject.aiInsights as string) : null;
    } catch (error) {
      console.warn('Failed to parse AI insights for project:', prismaProject.id);
      aiInsights = null;
    }

    const project: Project = {
      id: prismaProject.id,
      name: prismaProject.name,
      description: prismaProject.description || '',
      status: this.mapProjectStatus(prismaProject.status),
      timeline: {
        startDate: prismaProject.startDate || new Date(),
        endDate: prismaProject.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: aiInsights?.timeline?.milestones || [],
        phases: aiInsights?.timeline?.phases || [],
        estimatedDuration: this.calculateDuration(prismaProject.startDate, prismaProject.endDate),
        actualDuration: prismaProject.status === 'COMPLETED' ? 
          this.calculateDuration(prismaProject.startDate, prismaProject.endDate) : undefined,
        progress: this.calculateProgress(prismaProject.status),
      },
      resources: aiInsights?.resources || [],
      risks: aiInsights?.risks || [],
      collaborators: [], // Will be populated separately if needed
      documents: [], // Will be populated separately if needed
      aiInsights: {
        healthScore: aiInsights?.healthScore || 75,
        riskLevel: this.calculateRiskLevel(prismaProject.status),
        completionPrediction: this.predictCompletion(prismaProject.startDate, prismaProject.endDate, prismaProject.status),
        recommendations: aiInsights?.recommendations || [],
        insights: aiInsights?.insights || [],
        lastAnalyzed: new Date(),
      },
      clientId: prismaProject.clientId || undefined,
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
    };

    return project;
  }

  /**
   * Create a new project from form data
   */
  static async createProjectFromForm(data: CreateProjectData, ownerId: string): Promise<Project> {
    try {
      // Use Prisma for project creation
      const prismaData = {
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.timeline.startDate,
        endDate: data.timeline.endDate,
        clientId: data.clientId,
        aiInsights: {
          timeline: data.timeline,
          resources: data.resources,
          risks: data.risks,
          collaborators: data.collaborators,
          documents: data.documents,
          healthScore: 75,
          insights: [],
          recommendations: []
        }
      };

      const prismaProject = await projectRepository.create(prismaData);
      return this.transformPrismaProjectToProject(prismaProject);
    } catch (error) {
      console.error('Error creating project from form:', error);
      throw error;
    }
  }

  /**
   * Get all projects with transformation
   */
  static async getAllProjects(): Promise<Project[]> {
    try {
      const prismaProjects = await projectRepository.findMany();
      return prismaProjects.map(this.transformPrismaProjectToProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Get project by ID with transformation
   */
  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const prismaProject = await projectRepository.findById(id);
      if (!prismaProject) return null;
      return this.transformPrismaProjectToProject(prismaProject);
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  /**
   * Update a project
   */
  static async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    try {
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.timeline?.startDate) updateData.startDate = data.timeline.startDate;
      if (data.timeline?.endDate) updateData.endDate = data.timeline.endDate;
      if (data.clientId) updateData.clientId = data.clientId;
      
      // Update AI insights if provided
      if (data.timeline || data.resources || data.risks) {
        const existingProject = await projectRepository.findById(id);
        let existingInsights = {};
        
        if (existingProject?.aiInsights) {
          try {
            existingInsights = JSON.parse(existingProject.aiInsights as string);
          } catch (error) {
            console.warn('Failed to parse existing AI insights');
          }
        }
        
        updateData.aiInsights = {
          ...existingInsights,
          ...(data.timeline && { timeline: data.timeline }),
          ...(data.resources && { resources: data.resources }),
          ...(data.risks && { risks: data.risks }),
          lastUpdated: new Date()
        };
      }

      const prismaProject = await projectRepository.update(id, updateData);
      return this.transformPrismaProjectToProject(prismaProject);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: string): Promise<void> {
    try {
      await projectRepository.delete(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Helper methods
  private static mapProjectStatus(status: string): ProjectStatus {
    switch (status) {
      case 'PLANNING':
        return ProjectStatus.PLANNING;
      case 'IN_PROGRESS':
        return ProjectStatus.ACTIVE;
      case 'ON_HOLD':
        return ProjectStatus.ON_HOLD;
      case 'COMPLETED':
        return ProjectStatus.COMPLETED;
      case 'CANCELLED':
        return ProjectStatus.CANCELLED;
      default:
        return ProjectStatus.PLANNING;
    }
  }

  private static calculateDuration(startDate?: Date | null, endDate?: Date | null): number {
    if (!startDate || !endDate) return 0;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static calculateProgress(status: string): number {
    switch (status) {
      case 'PLANNING':
        return 10;
      case 'IN_PROGRESS':
        return 50;
      case 'ON_HOLD':
        return 30;
      case 'COMPLETED':
        return 100;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  }

  private static calculateRiskLevel(status: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (status) {
      case 'ON_HOLD':
        return 'high';
      case 'CANCELLED':
        return 'critical';
      case 'IN_PROGRESS':
        return 'medium';
      default:
        return 'low';
    }
  }

  private static predictCompletion(startDate?: Date | null, endDate?: Date | null, status?: string): Date {
    if (status === 'COMPLETED') {
      return endDate || new Date();
    }
    
    if (endDate) {
      return endDate;
    }
    
    // Default prediction: 30 days from now
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
}

// Export a singleton instance for easy use
export const projectService = ProjectService;