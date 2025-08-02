import { Client, Prisma } from '../../../generated/prisma';
import { prisma } from '../connection';
import { AbstractRepository, FindManyOptions, PaginatedResult, PaginationOptions } from './base';

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  ownerId: string;
  aiProfile?: any;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  aiProfile?: any;
}

export interface ClientWithRelations extends Client {
  owner?: any;
  projects?: any[];
  interactions?: any[];
  documents?: any[];
}

export class ClientRepository extends AbstractRepository<Client, CreateClientInput, UpdateClientInput> {
  async create(data: CreateClientInput): Promise<Client> {
    return prisma.client.create({
      data: {
        ...data,
        aiProfile: data.aiProfile ? JSON.stringify(data.aiProfile) : undefined,
      },
    });
  }

  async findById(id: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { id },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Client[]> {
    return prisma.client.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: options.include,
    });
  }

  async findManyWithRelations(options: FindManyOptions = {}): Promise<ClientWithRelations[]> {
    return prisma.client.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: {
        owner: true,
        projects: true,
        interactions: {
          include: {
            user: true,
          },
        },
        documents: true,
        ...options.include,
      },
    });
  }

  async update(id: string, data: UpdateClientInput): Promise<Client> {
    return prisma.client.update({
      where: { id },
      data: {
        ...data,
        aiProfile: data.aiProfile ? JSON.stringify(data.aiProfile) : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.client.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.ClientWhereInput): Promise<number> {
    return prisma.client.count({ where });
  }

  async findPaginated(options: PaginationOptions & { where?: Prisma.ClientWhereInput }): Promise<PaginatedResult<Client>> {
    return this.paginate(
      (opts) => this.findMany(opts),
      (where) => this.count(where),
      options
    );
  }

  async findByOwner(ownerId: string): Promise<Client[]> {
    return prisma.client.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string): Promise<Client | null> {
    return prisma.client.findFirst({
      where: { email },
    });
  }

  async findByCompany(company: string): Promise<Client[]> {
    return prisma.client.findMany({
      where: {
        company: {
          contains: company,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchClients(query: string, ownerId?: string): Promise<Client[]> {
    const whereClause: Prisma.ClientWhereInput = {
      AND: [
        ownerId ? { ownerId } : {},
        {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              company: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    return prisma.client.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAIProfile(id: string, aiProfile: any): Promise<Client> {
    return prisma.client.update({
      where: { id },
      data: {
        aiProfile: JSON.stringify(aiProfile),
      },
    });
  }

  async getClientStats(ownerId?: string): Promise<{
    total: number;
    active: number;
    withProjects: number;
  }> {
    const whereClause = ownerId ? { ownerId } : {};

    const [total, withProjects] = await Promise.all([
      prisma.client.count({ where: whereClause }),
      prisma.client.count({
        where: {
          ...whereClause,
          projects: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active: total, // For now, all clients are considered active
      withProjects,
    };
  }
}

// Export a singleton instance
export const clientRepository = new ClientRepository();