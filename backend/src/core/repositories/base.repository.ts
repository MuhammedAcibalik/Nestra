/**
 * Base Repository Implementation using Drizzle ORM
 * Following Open/Closed Principle (OCP)
 */

import { Database } from '../../db';
import { IBaseRepository } from '../interfaces/repository.interface';
import { IEntity, IPaginatedResult, IPaginationOptions } from '../interfaces';
import { eq, sql } from 'drizzle-orm';
import type { AnyPgTable, AnyPgColumn } from '../database/drizzle.types';

/**
 * Abstract base repository for Drizzle ORM
 * Provides common CRUD operations
 *
 * @template TEntity - Entity type returned from queries
 * @template TCreate - Input type for create operations
 * @template TUpdate - Input type for update operations
 */
export abstract class BaseRepository<
    TEntity extends IEntity,
    TCreate,
    TUpdate
> implements IBaseRepository<TEntity, TCreate, TUpdate> {
    protected readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

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

    async findById(id: string): Promise<TEntity | null> {
        const table = this.getTable();
        const results = await this.db
            .select()
            .from(table)
            .where(eq(this.getIdColumn(), id))
            .limit(1);
        return (results[0] as unknown as TEntity) ?? null;
    }

    async findOne(_filter: Partial<TEntity>): Promise<TEntity | null> {
        const table = this.getTable();
        const results = await this.db.select().from(table).limit(1);
        return (results[0] as unknown as TEntity) ?? null;
    }

    async findMany(_filter?: Partial<TEntity>, pagination?: IPaginationOptions): Promise<TEntity[]> {
        const table = this.getTable();
        const { limit = 100 } = pagination ?? {};
        const results = await this.db.select().from(table).limit(limit);
        return results as unknown as TEntity[];
    }

    async findManyPaginated(
        _filter?: Partial<TEntity>,
        pagination?: IPaginationOptions
    ): Promise<IPaginatedResult<TEntity>> {
        const table = this.getTable();
        const { page = 1, limit = 20 } = pagination ?? {};
        const offset = (page - 1) * limit;

        const [data, countResult] = await Promise.all([
            this.db.select().from(table).limit(limit).offset(offset),
            this.db.select({ count: sql<number>`count(*)` }).from(table)
        ]);

        const total = Number(countResult[0]?.count ?? 0);

        return {
            data: data as unknown as TEntity[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async create(data: TCreate): Promise<TEntity> {
        const table = this.getTable();
        const result = await this.db
            .insert(table)
            .values(data as Record<string, unknown>)
            .returning();
        return result[0] as unknown as TEntity;
    }

    async createMany(data: TCreate[]): Promise<TEntity[]> {
        const table = this.getTable();
        const results = await this.db
            .insert(table)
            .values(data as Record<string, unknown>[])
            .returning();
        return results as unknown as TEntity[];
    }

    async update(id: string, data: TUpdate): Promise<TEntity> {
        const table = this.getTable();
        const result = await this.db
            .update(table)
            .set(data as Record<string, unknown>)
            .where(eq(this.getIdColumn(), id))
            .returning();
        return result[0] as unknown as TEntity;
    }

    async updateMany(_filter: Partial<TEntity>, data: TUpdate): Promise<number> {
        const table = this.getTable();
        const result = await this.db
            .update(table)
            .set(data as Record<string, unknown>)
            .returning();
        return result.length;
    }

    async delete(id: string): Promise<void> {
        const table = this.getTable();
        await this.db.delete(table).where(eq(this.getIdColumn(), id));
    }

    async deleteMany(_filter: Partial<TEntity>): Promise<number> {
        const table = this.getTable();
        const result = await this.db.delete(table).returning();
        return result.length;
    }

    async count(_filter?: Partial<TEntity>): Promise<number> {
        const table = this.getTable();
        const result = await this.db.select({ count: sql<number>`count(*)` }).from(table);
        return Number(result[0]?.count ?? 0);
    }

    async exists(filter: Partial<TEntity>): Promise<boolean> {
        const count = await this.count(filter);
        return count > 0;
    }
}
