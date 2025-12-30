/**
 * Base Repository Implementation using Drizzle ORM
 * Following Open/Closed Principle (OCP)
 */
import { Database } from '../../db';
import { IBaseRepository } from '../interfaces/repository.interface';
import { IEntity, IPaginatedResult, IPaginationOptions } from '../interfaces';
import type { AnyPgTable, AnyPgColumn } from '../database/drizzle.types';
/**
 * Abstract base repository for Drizzle ORM
 * Provides common CRUD operations
 *
 * @template TEntity - Entity type returned from queries
 * @template TCreate - Input type for create operations
 * @template TUpdate - Input type for update operations
 */
export declare abstract class BaseRepository<TEntity extends IEntity, TCreate, TUpdate> implements IBaseRepository<TEntity, TCreate, TUpdate> {
    protected readonly db: Database;
    constructor(db: Database);
    /**
     * Abstract method to get the Drizzle table
     * Must be implemented by subclass
     */
    protected abstract getTable(): AnyPgTable;
    /**
     * Abstract method to get the ID column
     * Must be implemented by subclass
     */
    protected abstract getIdColumn(): AnyPgColumn;
    findById(id: string): Promise<TEntity | null>;
    findOne(_filter: Partial<TEntity>): Promise<TEntity | null>;
    findMany(_filter?: Partial<TEntity>, pagination?: IPaginationOptions): Promise<TEntity[]>;
    findManyPaginated(_filter?: Partial<TEntity>, pagination?: IPaginationOptions): Promise<IPaginatedResult<TEntity>>;
    create(data: TCreate): Promise<TEntity>;
    createMany(data: TCreate[]): Promise<TEntity[]>;
    update(id: string, data: TUpdate): Promise<TEntity>;
    updateMany(_filter: Partial<TEntity>, data: TUpdate): Promise<number>;
    delete(id: string): Promise<void>;
    deleteMany(_filter: Partial<TEntity>): Promise<number>;
    count(_filter?: Partial<TEntity>): Promise<number>;
    exists(filter: Partial<TEntity>): Promise<boolean>;
}
//# sourceMappingURL=base.repository.d.ts.map