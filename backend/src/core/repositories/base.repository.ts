/**
 * Base Repository Implementation using Drizzle ORM
 * Following Open/Closed Principle (OCP)
 */

import { Database } from '../../db';
import { IBaseRepository } from '../interfaces/repository.interface';
import { IEntity, IPaginatedResult, IPaginationOptions } from '../interfaces';
import { eq, sql, asc, desc } from 'drizzle-orm';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

/**
 * Abstract base repository for Drizzle ORM
 * Provides common CRUD operations
 */
export abstract class BaseRepository<
    T extends IEntity,
    CreateInput,
    UpdateInput
> implements IBaseRepository<T, CreateInput, UpdateInput> {

    protected db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    /**
     * Abstract method to get the Drizzle table
     */
    protected abstract getTable(): PgTableWithColumns<any>;

    /**
     * Get ID column reference
     */
    protected getIdColumn() {
        const table = this.getTable();
        return (table as any).id;
    }

    async findById(id: string): Promise<T | null> {
        const table = this.getTable();
        const results = await this.db
            .select()
            .from(table)
            .where(eq(this.getIdColumn(), id))
            .limit(1);
        return (results[0] as T) ?? null;
    }

    async findOne(filter: Partial<T>): Promise<T | null> {
        const table = this.getTable();
        const results = await this.db
            .select()
            .from(table)
            .limit(1);
        // Note: Full filter support requires dynamic where clause building
        return (results[0] as T) ?? null;
    }

    async findMany(filter?: Partial<T>, pagination?: IPaginationOptions): Promise<T[]> {
        const table = this.getTable();
        const { limit = 100 } = pagination ?? {};

        const results = await this.db
            .select()
            .from(table)
            .limit(limit);

        return results as T[];
    }

    async findManyPaginated(
        filter?: Partial<T>,
        pagination?: IPaginationOptions
    ): Promise<IPaginatedResult<T>> {
        const table = this.getTable();
        const { page = 1, limit = 20 } = pagination ?? {};
        const offset = (page - 1) * limit;

        const [data, countResult] = await Promise.all([
            this.db.select().from(table).limit(limit).offset(offset),
            this.db.select({ count: sql<number>`count(*)` }).from(table),
        ]);

        const total = Number(countResult[0]?.count ?? 0);

        return {
            data: data as T[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(data: CreateInput): Promise<T> {
        const table = this.getTable();
        const result = await this.db
            .insert(table)
            .values(data as any)
            .returning();
        return result[0] as T;
    }

    async createMany(data: CreateInput[]): Promise<T[]> {
        const table = this.getTable();
        const results = await this.db
            .insert(table)
            .values(data as any[])
            .returning();
        return results as T[];
    }

    async update(id: string, data: UpdateInput): Promise<T> {
        const table = this.getTable();
        const result = await this.db
            .update(table)
            .set(data as any)
            .where(eq(this.getIdColumn(), id))
            .returning();
        return result[0] as T;
    }

    async updateMany(filter: Partial<T>, data: UpdateInput): Promise<number> {
        const table = this.getTable();
        const result = await this.db
            .update(table)
            .set(data as any)
            .returning();
        return result.length;
    }

    async delete(id: string): Promise<void> {
        const table = this.getTable();
        await this.db
            .delete(table)
            .where(eq(this.getIdColumn(), id));
    }

    async deleteMany(filter: Partial<T>): Promise<number> {
        const table = this.getTable();
        const result = await this.db
            .delete(table)
            .returning();
        return result.length;
    }

    async count(filter?: Partial<T>): Promise<number> {
        const table = this.getTable();
        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(table);
        return Number(result[0]?.count ?? 0);
    }

    async exists(filter: Partial<T>): Promise<boolean> {
        const count = await this.count(filter);
        return count > 0;
    }
}
