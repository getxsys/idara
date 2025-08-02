export interface BaseRepository<T, CreateInput, UpdateInput> {
  create(data: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: any): Promise<number>;
}

export interface FindManyOptions {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
  include?: any;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class AbstractRepository<T, CreateInput, UpdateInput> 
  implements BaseRepository<T, CreateInput, UpdateInput> {
  
  abstract create(data: CreateInput): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(options?: FindManyOptions): Promise<T[]>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract count(where?: any): Promise<number>;

  protected async paginate<TData>(
    findMany: (options: FindManyOptions) => Promise<TData[]>,
    countFn: (where?: any) => Promise<number>,
    options: PaginationOptions & { where?: any }
  ): Promise<PaginatedResult<TData>> {
    const { page, limit, where } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      findMany({ where, skip, take: limit }),
      countFn(where)
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}