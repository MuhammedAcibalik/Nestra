/**
 * Base Repository Implementation using Prisma
 * Following Open/Closed Principle (OCP)
 * 
 * Note: This is an abstract base that requires concrete implementations
 * to provide model access in a type-safe way.
 */

import { PrismaClient } from '@prisma/client';
import { IBaseRepository } from '../interfaces/repository.interface';
import { IEntity, IPaginatedResult, IPaginationOptions } from '../interfaces';

/**
 * Generic delegate type for Prisma model operations
 */
interface PrismaDelegate {
    findUnique(args: { where: { id: string } }): Promise<unknown>;
    findFirst(args: { where: unknown }): Promise<unknown>;
    findMany(args: {
        where?: unknown;
        skip?: number;
        take?: number;
        orderBy?: unknown;
    }): Promise<unknown[]>;
    create(args: { data: unknown }): Promise<unknown>;
    createMany(args: { data: unknown[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
    update(args: { where: { id: string }; data: unknown }): Promise<unknown>;
    updateMany(args: { where: unknown; data: unknown }): Promise<{ count: number }>;
    delete(args: { where: { id: string } }): Promise<unknown>;
    deleteMany(args: { where: unknown }): Promise<{ count: number }>;
    count(args?: { where?: unknown }): Promise<number>;
}

export abstract class BaseRepository<
    T extends IEntity,
    CreateInput,
    UpdateInput
> implements IBaseRepository<T, CreateInput, UpdateInput> {

    protected prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Abstract method to get the Prisma model delegate
     * Concrete implementations must provide this
     */
    protected abstract getModel(): PrismaDelegate;

    async findById(id: string): Promise<T | null> {
        const result = await this.getModel().findUnique({ where: { id } });
        return result as T | null;
    }

    async findOne(filter: Partial<T>): Promise<T | null> {
        const result = await this.getModel().findFirst({ where: filter });
        return result as T | null;
    }

    async findMany(filter?: Partial<T>, pagination?: IPaginationOptions): Promise<T[]> {
        const { sortBy, sortOrder, limit } = pagination ?? {};

        const result = await this.getModel().findMany({
            where: filter,
            orderBy: sortBy ? { [sortBy]: sortOrder ?? 'asc' } : undefined,
            take: limit,
        });

        return result as T[];
    }

    async findManyPaginated(
        filter?: Partial<T>,
        pagination?: IPaginationOptions
    ): Promise<IPaginatedResult<T>> {
        const { page = 1, limit = 20, sortBy, sortOrder } = pagination ?? {};
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.getModel().findMany({
                where: filter,
                skip,
                take: limit,
                orderBy: sortBy ? { [sortBy]: sortOrder ?? 'asc' } : undefined,
            }),
            this.getModel().count({ where: filter }),
        ]);

        return {
            data: data as T[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(data: CreateInput): Promise<T> {
        const result = await this.getModel().create({ data });
        return result as T;
    }

    async createMany(data: CreateInput[]): Promise<T[]> {
        const result = await this.getModel().createMany({ data, skipDuplicates: true });
        const created = await this.getModel().findMany({
            orderBy: { createdAt: 'desc' },
            take: result.count,
        });
        return created as T[];
    }

    async update(id: string, data: UpdateInput): Promise<T> {
        const result = await this.getModel().update({ where: { id }, data });
        return result as T;
    }

    async updateMany(filter: Partial<T>, data: UpdateInput): Promise<number> {
        const result = await this.getModel().updateMany({ where: filter, data });
        return result.count;
    }

    async delete(id: string): Promise<void> {
        await this.getModel().delete({ where: { id } });
    }

    async deleteMany(filter: Partial<T>): Promise<number> {
        const result = await this.getModel().deleteMany({ where: filter });
        return result.count;
    }

    async count(filter?: Partial<T>): Promise<number> {
        return this.getModel().count({ where: filter });
    }

    async exists(filter: Partial<T>): Promise<boolean> {
        const count = await this.getModel().count({ where: filter });
        return count > 0;
    }
}
