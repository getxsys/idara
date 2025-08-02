import { Project, ProjectStatus, ProjectRole, Prisma } from '../../../generated/prisma';
import { prisma } from '../connection';
import { AbstractRepository, FindManyOptions, PaginatedResult, PaginationOptions } from './base';

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
  aiInsights?: any;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
  aiInsights?: any;
}

export interface ProjectWithRelations extends Project {
  client?: any;
  members?: any[];
  documents?: any[];
}

export interface AddProjectMemberInput {
  userId: string;
  projectId: string;
  role?: ProjectRole;
}

export class ProjectRepository extends AbstractRepository<Project, CreateProjectInput, UpdateProjectInput> {
  async create(data: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data: {
        ...data,
        aiInsights: data.aiInsights ? JSON.stringify(data.aiInsights) : undefined,
      },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Project[]> {
    return prisma.project.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: options.include,
    });
  }

  async findManyWithRelations(options: FindManyOptions = {}): Promise<ProjectWithRelations[]> {
    return prisma.project.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: {
        client: true,
        members: {
          include: {
            user: true,
          },
        },
        documents: true,
        ...options.include,
      },
    });
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        aiInsights: data.aiInsights ? JSON.stringify(data.aiInsights) : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.ProjectWhereInput): Promise<number> {
    return prisma.project.count({ where });
  }

  async findPaginated(options: PaginationOptions & { where?: Prisma.ProjectWhereInput }): Promise<PaginatedResult<Project>> {
    return this.paginate(
      (opts) => this.findMany(opts),
      (where) => this.count(where),
      options
    );
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return prisma.project.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        client: true,
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMember(data: AddProjectMemberInput): Promise<void> {
    await prisma.projectMember.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        role: data.role || ProjectRole.MEMBER,
      },
    });
  }

  async removeMember(userId: string, projectId: string): Promise<void> {
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  }

  async updateMemberRole(userId: string, projectId: string, role: ProjectRole): Promise<void> {
    await prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      data: { role },
    });
  }

  async updateAIInsights(id: string, aiInsights: any): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        aiInsights: JSON.stringify(aiInsights),
      },
    });
  }
}