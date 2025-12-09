"use strict";
/**
 * Base Repository Implementation using Prisma
 * Following Open/Closed Principle (OCP)
 *
 * Note: This is an abstract base that requires concrete implementations
 * to provide model access in a type-safe way.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const result = await this.getModel().findUnique({ where: { id } });
        return result;
    }
    async findOne(filter) {
        const result = await this.getModel().findFirst({ where: filter });
        return result;
    }
    async findMany(filter, pagination) {
        const { sortBy, sortOrder, limit } = pagination ?? {};
        const result = await this.getModel().findMany({
            where: filter,
            orderBy: sortBy ? { [sortBy]: sortOrder ?? 'asc' } : undefined,
            take: limit,
        });
        return result;
    }
    async findManyPaginated(filter, pagination) {
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
            data: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async create(data) {
        const result = await this.getModel().create({ data });
        return result;
    }
    async createMany(data) {
        const result = await this.getModel().createMany({ data, skipDuplicates: true });
        const created = await this.getModel().findMany({
            orderBy: { createdAt: 'desc' },
            take: result.count,
        });
        return created;
    }
    async update(id, data) {
        const result = await this.getModel().update({ where: { id }, data });
        return result;
    }
    async updateMany(filter, data) {
        const result = await this.getModel().updateMany({ where: filter, data });
        return result.count;
    }
    async delete(id) {
        await this.getModel().delete({ where: { id } });
    }
    async deleteMany(filter) {
        const result = await this.getModel().deleteMany({ where: filter });
        return result.count;
    }
    async count(filter) {
        return this.getModel().count({ where: filter });
    }
    async exists(filter) {
        const count = await this.getModel().count({ where: filter });
        return count > 0;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map