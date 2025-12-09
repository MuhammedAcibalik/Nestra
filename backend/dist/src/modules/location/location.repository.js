"use strict";
/**
 * Location Repository
 * Following SRP - Only handles Location data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationRepository = void 0;
class LocationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.location.findUnique({
            where: { id },
            include: {
                _count: { select: { stockItems: true, machines: true } }
            }
        });
    }
    async findByName(name) {
        return this.prisma.location.findUnique({ where: { name } });
    }
    async findAll(filter) {
        const where = filter?.search
            ? {
                OR: [
                    { name: { contains: filter.search, mode: 'insensitive' } },
                    { description: { contains: filter.search, mode: 'insensitive' } },
                    { address: { contains: filter.search, mode: 'insensitive' } }
                ]
            }
            : {};
        return this.prisma.location.findMany({
            where,
            include: {
                _count: { select: { stockItems: true, machines: true } }
            },
            orderBy: { name: 'asc' }
        });
    }
    async create(data) {
        return this.prisma.location.create({
            data: {
                name: data.name,
                description: data.description,
                address: data.address
            }
        });
    }
    async update(id, data) {
        return this.prisma.location.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                address: data.address
            }
        });
    }
    async delete(id) {
        await this.prisma.location.delete({ where: { id } });
    }
}
exports.LocationRepository = LocationRepository;
//# sourceMappingURL=location.repository.js.map