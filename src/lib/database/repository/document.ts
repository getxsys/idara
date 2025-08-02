import { Document, DocumentType, AccessLevel, Prisma } from '../../../generated/prisma';
import { prisma } from '../connection';
import { AbstractRepository, FindManyOptions, PaginatedResult, PaginationOptions } from './base';

export interface CreateDocumentInput {
  title: string;
  content: string;
  type?: DocumentType;
  fileUrl?: string;
  metadata?: any;
  tags?: string[];
  accessLevel?: AccessLevel;
  ownerId: string;
  projectId?: string;
  clientId?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  type?: DocumentType;
  fileUrl?: string;
  metadata?: any;
  tags?: string[];
  accessLevel?: AccessLevel;
  projectId?: string;
  clientId?: string;
}

export interface DocumentWithRelations extends Document {
  owner?: any;
  project?: any;
  client?: any;
}

export class DocumentRepository extends AbstractRepository<Document, CreateDocumentInput, UpdateDocumentInput> {
  async create(data: CreateDocumentInput): Promise<Document> {
    return prisma.document.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        tags: data.tags || [],
      },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({
      where: { id },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Document[]> {
    return prisma.document.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: options.include,
    });
  }

  async findManyWithRelations(options: FindManyOptions = {}): Promise<DocumentWithRelations[]> {
    return prisma.document.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: {
        owner: true,
        project: true,
        client: true,
        ...options.include,
      },
    });
  }

  async update(id: string, data: UpdateDocumentInput): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.document.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.DocumentWhereInput): Promise<number> {
    return prisma.document.count({ where });
  }

  async findPaginated(options: PaginationOptions & { where?: Prisma.DocumentWhereInput }): Promise<PaginatedResult<Document>> {
    return this.paginate(
      (opts) => this.findMany(opts),
      (where) => this.count(where),
      options
    );
  }

  async findByOwner(ownerId: string): Promise<Document[]> {
    return prisma.document.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProject(projectId: string): Promise<Document[]> {
    return prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string): Promise<Document[]> {
    return prisma.document.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByType(type: DocumentType): Promise<Document[]> {
    return prisma.document.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByAccessLevel(accessLevel: AccessLevel, userId?: string): Promise<Document[]> {
    const whereClause: Prisma.DocumentWhereInput = {
      accessLevel,
    };

    // If user ID is provided, also include their private documents
    if (userId && accessLevel === AccessLevel.PRIVATE) {
      whereClause.ownerId = userId;
    }

    return prisma.document.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchDocuments(query: string, userId?: string): Promise<Document[]> {
    const whereClause: Prisma.DocumentWhereInput = {
      AND: [
        {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              tags: {
                hasSome: [query],
              },
            },
          ],
        },
        // Access control: only show documents user can access
        userId
          ? {
              OR: [
                { accessLevel: AccessLevel.PUBLIC },
                { ownerId: userId },
                {
                  AND: [
                    { accessLevel: AccessLevel.PROJECT },
                    {
                      project: {
                        members: {
                          some: {
                            userId,
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            }
          : { accessLevel: AccessLevel.PUBLIC },
      ],
    };

    return prisma.document.findMany({
      where: whereClause,
      include: {
        owner: true,
        project: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTags(tags: string[]): Promise<Document[]> {
    return prisma.document.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTags(id: string, newTags: string[]): Promise<Document> {
    const document = await this.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const updatedTags = [...new Set([...document.tags, ...newTags])];

    return prisma.document.update({
      where: { id },
      data: { tags: updatedTags },
    });
  }

  async removeTags(id: string, tagsToRemove: string[]): Promise<Document> {
    const document = await this.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const updatedTags = document.tags.filter(tag => !tagsToRemove.includes(tag));

    return prisma.document.update({
      where: { id },
      data: { tags: updatedTags },
    });
  }

  async getDocumentStats(ownerId?: string): Promise<{
    total: number;
    byType: Record<DocumentType, number>;
    byAccessLevel: Record<AccessLevel, number>;
  }> {
    const whereClause = ownerId ? { ownerId } : {};

    const [total, byType, byAccessLevel] = await Promise.all([
      prisma.document.count({ where: whereClause }),
      prisma.document.groupBy({
        by: ['type'],
        where: whereClause,
        _count: true,
      }),
      prisma.document.groupBy({
        by: ['accessLevel'],
        where: whereClause,
        _count: true,
      }),
    ]);

    const typeStats = Object.values(DocumentType).reduce((acc, type) => {
      acc[type] = byType.find(item => item.type === type)?._count || 0;
      return acc;
    }, {} as Record<DocumentType, number>);

    const accessStats = Object.values(AccessLevel).reduce((acc, level) => {
      acc[level] = byAccessLevel.find(item => item.accessLevel === level)?._count || 0;
      return acc;
    }, {} as Record<AccessLevel, number>);

    return {
      total,
      byType: typeStats,
      byAccessLevel: accessStats,
    };
  }
}