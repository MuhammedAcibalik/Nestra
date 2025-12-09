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
    findUnique(args: {
        where: {
            id: string;
        };
    }): Promise<unknown>;
    findFirst(args: {
        where: unknown;
    }): Promise<unknown>;
    findMany(args: {
        where?: unknown;
        skip?: number;
        take?: number;
        orderBy?: unknown;
    }): Promise<unknown[]>;
    create(args: {
        data: unknown;
    }): Promise<unknown>;
    createMany(args: {
        data: unknown[];
        skipDuplicates?: boolean;
    }): Promise<{
        count: number;
    }>;
    update(args: {
        where: {
            id: string;
        };
        data: unknown;
    }): Promise<unknown>;
    updateMany(args: {
        where: unknown;
        data: unknown;
    }): Promise<{
        count: number;
    }>;
    delete(args: {
        where: {
            id: string;
        };
    }): Promise<unknown>;
    deleteMany(args: {
        where: unknown;
    }): Promise<{
        count: number;
    }>;
    count(args?: {
        where?: unknown;
    }): Promise<number>;
}
export declare abstract class BaseRepository<T extends IEntity, CreateInput, UpdateInput> implements IBaseRepository<T, CreateInput, UpdateInput> {
    protected prisma: PrismaClient;
    constructor(prisma: PrismaClient);
    /**
     * Abstract method to get the Prisma model delegate
     * Concrete implementations must provide this
     */
    protected abstract getModel(): PrismaDelegate;
    findById(id: string): Promise<T | null>;
    findOne(filter: Partial<T>): Promise<T | null>;
    findMany(filter?: Partial<T>, pagination?: IPaginationOptions): Promise<T[]>;
    findManyPaginated(filter?: Partial<T>, pagination?: IPaginationOptions): Promise<IPaginatedResult<T>>;
    create(data: CreateInput): Promise<T>;
    createMany(data: CreateInput[]): Promise<T[]>;
    update(id: string, data: UpdateInput): Promise<T>;
    updateMany(filter: Partial<T>, data: UpdateInput): Promise<number>;
    delete(id: string): Promise<void>;
    deleteMany(filter: Partial<T>): Promise<number>;
    count(filter?: Partial<T>): Promise<number>;
    exists(filter: Partial<T>): Promise<boolean>;
}
export {};
//# sourceMappingURL=base.repository.d.ts.map