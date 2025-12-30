"use strict";
/**
 * Base Repository Implementation using Drizzle ORM
 * Following Open/Closed Principle (OCP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Abstract base repository for Drizzle ORM
 * Provides common CRUD operations
 *
 * @template TEntity - Entity type returned from queries
 * @template TCreate - Input type for create operations
 * @template TUpdate - Input type for update operations
 */
class BaseRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const table = this.getTable();
        const results = await this.db
            .select()
            .from(table)
            .where((0, drizzle_orm_1.eq)(this.getIdColumn(), id))
            .limit(1);
        return results[0] ?? null;
    }
    async findOne(_filter) {
        const table = this.getTable();
        const results = await this.db.select().from(table).limit(1);
        return results[0] ?? null;
    }
    async findMany(_filter, pagination) {
        const table = this.getTable();
        const { limit = 100 } = pagination ?? {};
        const results = await this.db.select().from(table).limit(limit);
        return results;
    }
    async findManyPaginated(_filter, pagination) {
        const table = this.getTable();
        const { page = 1, limit = 20 } = pagination ?? {};
        const offset = (page - 1) * limit;
        const [data, countResult] = await Promise.all([
            this.db.select().from(table).limit(limit).offset(offset),
            this.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(table)
        ]);
        const total = Number(countResult[0]?.count ?? 0);
        return {
            data: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async create(data) {
        const table = this.getTable();
        const result = await this.db
            .insert(table)
            .values(data)
            .returning();
        return result[0];
    }
    async createMany(data) {
        const table = this.getTable();
        const results = await this.db
            .insert(table)
            .values(data)
            .returning();
        return results;
    }
    async update(id, data) {
        const table = this.getTable();
        const result = await this.db
            .update(table)
            .set(data)
            .where((0, drizzle_orm_1.eq)(this.getIdColumn(), id))
            .returning();
        return result[0];
    }
    async updateMany(_filter, data) {
        const table = this.getTable();
        const result = await this.db
            .update(table)
            .set(data)
            .returning();
        return result.length;
    }
    async delete(id) {
        const table = this.getTable();
        await this.db.delete(table).where((0, drizzle_orm_1.eq)(this.getIdColumn(), id));
    }
    async deleteMany(_filter) {
        const table = this.getTable();
        const result = await this.db.delete(table).returning();
        return result.length;
    }
    async count(_filter) {
        const table = this.getTable();
        const result = await this.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(table);
        return Number(result[0]?.count ?? 0);
    }
    async exists(filter) {
        const count = await this.count(filter);
        return count > 0;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map