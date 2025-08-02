import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/lib/services/project-service';
import { ProjectStatus } from '@/types/project';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status, startDate, endDate } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create project data
    const projectData = {
      name,
      description: description || '',
      status: status as ProjectStatus || ProjectStatus.PLANNING,
      timeline: {
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [],
        phases: []
      },
      resources: [],
      risks: [],
      collaborators: [],
      documents: []
    };

    // Create project using the service
    const project = await projectService.createProjectFromForm(projectData, 'default-user-id');

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.timeline.startDate,
      endDate: project.timeline.endDate,
      message: 'Project created successfully'
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await projectService.getAllProjects();
    
    return NextResponse.json({
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.timeline.startDate,
        endDate: project.timeline.endDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}