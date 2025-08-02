import { User, UserRole, Prisma } from '../../../generated/prisma';
import { prisma } from '../connection';
import { AbstractRepository, FindManyOptions, PaginatedResult, PaginationOptions } from './base';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
  preferences?: any;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  preferences?: any;
}

export interface UserWithRelations extends User {
  projects?: any[];
  clients?: any[];
  documents?: any[];
}

export class UserRepository extends AbstractRepository<User, CreateUserInput, UpdateUserInput> {
  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        preferences: data.preferences ? JSON.stringify(data.preferences) : undefined,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<User[]> {
    return prisma.user.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: options.include,
    });
  }

  async findManyWithRelations(options: FindManyOptions = {}): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: {
        projects: {
          include: {
            project: true,
          },
        },
        clients: true,
        documents: true,
        ...options.include,
      },
    });
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        preferences: data.preferences ? JSON.stringify(data.preferences) : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({ where });
  }

  async findPaginated(options: PaginationOptions & { where?: Prisma.UserWhereInput }): Promise<PaginatedResult<User>> {
    return this.paginate(
      (opts) => this.findMany(opts),
      (where) => this.count(where),
      options
    );
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMFA(id: string, mfaEnabled: boolean, mfaSecret?: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        mfaEnabled,
        mfaSecret,
      },
    });
  }

  async updatePreferences(id: string, preferences: any): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        preferences: JSON.stringify(preferences),
      },
    });
  }
}