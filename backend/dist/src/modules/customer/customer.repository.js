"use strict";
/**
 * Customer Repository
 * Following SRP - Only handles Customer data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
class CustomerRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.customer.findUnique({
            where: { id },
            include: {
                _count: { select: { orders: true } }
            }
        });
    }
    async findByCode(code) {
        return this.prisma.customer.findUnique({ where: { code } });
    }
    async findAll(filter) {
        const where = filter?.search
            ? {
                OR: [
                    { code: { contains: filter.search, mode: 'insensitive' } },
                    { name: { contains: filter.search, mode: 'insensitive' } },
                    { email: { contains: filter.search, mode: 'insensitive' } }
                ]
            }
            : {};
        return this.prisma.customer.findMany({
            where,
            include: {
                _count: { select: { orders: true } }
            },
            orderBy: { name: 'asc' }
        });
    }
    async create(data) {
        return this.prisma.customer.create({
            data: {
                code: data.code,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
                customFields: data.customFields
            }
        });
    }
    async update(id, data) {
        return this.prisma.customer.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
                customFields: data.customFields
            }
        });
    }
    async delete(id) {
        await this.prisma.customer.delete({ where: { id } });
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=customer.repository.js.map