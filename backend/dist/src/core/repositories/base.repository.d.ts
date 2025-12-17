/**
 * Base Repository Implementation using Drizzle ORM
 * Following Open/Closed Principle (OCP)
 */
import { Database } from '../../db';
import { IBaseRepository } from '../interfaces/repository.interface';
import { IEntity, IPaginatedResult, IPaginationOptions } from '../interfaces';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
/**
 * Abstract base repository for Drizzle ORM
 * Provides common CRUD operations
 */
export declare abstract class BaseRepository<T extends IEntity, CreateInput, UpdateInput> implements IBaseRepository<T, CreateInput, UpdateInput> {
    protected db: Database;
    constructor(db: Database);
    /**
     * Abstract method to get the Drizzle table
     */
    protected abstract getTable(): PgTableWithColumns<any>;
    /**
     * Get ID column reference
     */
    protected getIdColumn(): any;
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
//# sourceMappingURL=base.repository.d.ts.map