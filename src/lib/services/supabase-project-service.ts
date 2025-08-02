import { supabase } from '@/lib/supabase/client';
import { CreateProjectData } from '@/lib/validations/project';
import { Project, ProjectStatus } from '@/types/project';

export class SupabaseProjectService {
  async createProject(projectData: CreateProjectData, ownerId: string): Promise<Project> {
    try {
      // Insert project data into Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          start_date: projectData.timeline.startDate,
          end_date: projectData.timeline.endDate,
          client_id: projectData.clientId || null,
          ai_insights: {
            timeline: projectData.timeline,
            resources: projectData.resources,
            risks: projectData.risks,
            collaborators: projectData.collaborators,
            documents: projectData.documents,
          },
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      // Add project members if specified
      if (projectData.collaborators && projectData.collaborators.length > 0) {
        const memberInserts = projectData.collaborators.map(collaborator => ({
          project_id: data.id,
          user_id: collaborator.userId,
          role: collaborator.role || 'MEMBER',
        }));

        const { error: memberError } = await supabase
          .from('project_members')
          .insert(memberInserts);

        if (memberError) {
          console.error('Failed to add project members:', memberError);
        }
      }

      return this.mapSupabaseProjectToProject(data);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            company
          ),
          project_members (
            id,
            role,
            users (
              id,
              email,
              first_name,
              last_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Project not found
        }
        throw new Error(`Failed to get project: ${error.message}`);
      }

      return this.mapSupabaseProjectToProject(data);
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  async getProjects(filters?: { ownerId?: string; clientId?: string; status?: ProjectStatus }): Promise<Project[]> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            company
          ),
          project_members (
            id,
            role,
            users (
              id,
              email,
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get projects: ${error.message}`);
      }

      return data.map(this.mapSupabaseProjectToProject);
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  async updateProject(id: string, projectData: Partial<CreateProjectData>): Promise<Project> {
    try {
      const updateData: any = {};

      if (projectData.name) updateData.name = projectData.name;
      if (projectData.description !== undefined) updateData.description = projectData.description;
      if (projectData.status) updateData.status = projectData.status;
      if (projectData.timeline?.startDate) updateData.start_date = projectData.timeline.startDate;
      if (projectData.timeline?.endDate) updateData.end_date = projectData.timeline.endDate;
      if (projectData.clientId !== undefined) updateData.client_id = projectData.clientId;

      if (projectData.timeline || projectData.resources || projectData.risks || projectData.collaborators || projectData.documents) {
        // Get current ai_insights and merge with new data
        const { data: currentProject } = await supabase
          .from('projects')
          .select('ai_insights')
          .eq('id', id)
          .single();

        const currentInsights = currentProject?.ai_insights || {};
        updateData.ai_insights = {
          ...currentInsights,
          ...(projectData.timeline && { timeline: projectData.timeline }),
          ...(projectData.resources && { resources: projectData.resources }),
          ...(projectData.risks && { risks: projectData.risks }),
          ...(projectData.collaborators && { collaborators: projectData.collaborators }),
          ...(projectData.documents && { documents: projectData.documents }),
        };
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
      }

      return this.mapSupabaseProjectToProject(data);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async addProjectMember(projectId: string, userId: string, role: string = 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
        });

      if (error) {
        throw new Error(`Failed to add project member: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding project member:', error);
      throw error;
    }
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove project member: ${error.message}`);
      }
    } catch (error) {
      console.error('Error removing project member:', error);
      throw error;
    }
  }

  private mapSupabaseProjectToProject(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status as ProjectStatus,
      timeline: data.ai_insights?.timeline || {
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        milestones: [],
        phases: [],
      },
      resources: data.ai_insights?.resources || [],
      risks: data.ai_insights?.risks || [],
      client: data.clients ? {
        id: data.clients.id,
        name: data.clients.name,
        email: data.clients.email,
        company: data.clients.company,
      } : undefined,
      collaborators: data.project_members?.map((member: any) => ({
        userId: member.users.id,
        email: member.users.email,
        name: `${member.users.first_name || ''} ${member.users.last_name || ''}`.trim(),
        role: member.role,
      })) || [],
      documents: data.ai_insights?.documents || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}