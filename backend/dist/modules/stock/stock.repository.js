"use strict";
/**
 * Stock Repository
 * Following SRP - Only handles stock data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockRepository = void 0;
class StockRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.stockItem.findUnique({
            where: { id },
            include: {
                materialType: { select: { id: true, name: true } },
                thicknessRange: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } }
            }
        });
    }
    async findAll(filter) {
        const where = {};
        if (filter?.materialTypeId)
            where.materialTypeId = filter.materialTypeId;
        if (filter?.stockType)
            where.stockType = filter.stockType;
        if (filter?.locationId)
            where.locationId = filter.locationId;
        if (filter?.minQuantity !== undefined)
            where.quantity = { gte: filter.minQuantity };
        return this.prisma.stockItem.findMany({
            where: where,
            include: {
                materialType: { select: { id: true, name: true } },
                thicknessRange: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findByCode(code) {
        return this.prisma.stockItem.findUnique({ where: { code } });
    }
    async create(data) {
        return this.prisma.stockItem.create({
            data: {
                code: data.code,
                name: data.name,
                materialTypeId: data.materialTypeId,
                thicknessRangeId: data.thicknessRangeId,
                thickness: data.thickness,
                stockType: data.stockType,
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                unitPrice: data.unitPrice,
                locationId: data.locationId
            }
        });
    }
    async update(id, data) {
        return this.prisma.stockItem.update({
            where: { id },
            data: {
                code: data.code,
                name: data.name,
                thickness: data.thickness,
                stockType: data.stockType,
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                unitPrice: data.unitPrice
            }
        });
    }
    async delete(id) {
        await this.prisma.stockItem.delete({ where: { id } });
    }
    async updateQuantity(id, quantityDelta, reservedDelta = 0) {
        return this.prisma.stockItem.update({
            where: { id },
            data: {
                quantity: { increment: quantityDelta },
                reservedQty: { increment: reservedDelta }
            }
        });
    }
    async createMovement(data) {
        return this.prisma.stockMovement.create({
            data: {
                stockItemId: data.stockItemId,
                movementType: data.movementType,
                quantity: data.quantity,
                notes: data.notes,
                productionLogId: data.productionLogId
            }
        });
    }
    async getMovements(filter) {
        const where = {};
        if (filter?.stockItemId)
            where.stockItemId = filter.stockItemId;
        if (filter?.movementType)
            where.movementType = filter.movementType;
        if (filter?.startDate || filter?.endDate) {
            where.createdAt = {};
            if (filter.startDate)
                where.createdAt.gte = filter.startDate;
            if (filter.endDate)
                where.createdAt.lte = filter.endDate;
        }
        return this.prisma.stockMovement.findMany({
            where: where,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
}
exports.StockRepository = StockRepository;
//# sourceMappingURL=stock.repository.js.map