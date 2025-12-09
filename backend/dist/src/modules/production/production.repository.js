"use strict";
/**
 * Production Repository
 * Following SRP - Only handles production data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionRepository = void 0;
class ProductionRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.productionLog.findUnique({
            where: { id },
            include: {
                cuttingPlan: {
                    select: {
                        id: true,
                        planNumber: true,
                        scenario: { select: { name: true } }
                    }
                },
                operator: { select: { firstName: true, lastName: true } },
                _count: { select: { stockMovements: true } }
            }
        });
    }
    async findAll(filter) {
        const where = {};
        if (filter?.status)
            where.status = filter.status;
        if (filter?.operatorId)
            where.operatorId = filter.operatorId;
        if (filter?.startDate || filter?.endDate) {
            where.startedAt = {};
            if (filter.startDate)
                where.startedAt.gte = filter.startDate;
            if (filter.endDate)
                where.startedAt.lte = filter.endDate;
        }
        return this.prisma.productionLog.findMany({
            where: where,
            include: {
                cuttingPlan: {
                    select: {
                        id: true,
                        planNumber: true,
                        scenario: { select: { name: true } }
                    }
                },
                operator: { select: { firstName: true, lastName: true } },
                _count: { select: { stockMovements: true } }
            },
            orderBy: { startedAt: 'desc' }
        });
    }
    async create(planId, operatorId) {
        return this.prisma.productionLog.create({
            data: {
                cuttingPlanId: planId,
                operatorId,
                status: 'STARTED',
                startedAt: new Date()
            }
        });
    }
    async update(id, data) {
        return this.prisma.productionLog.update({
            where: { id },
            data: {
                notes: data.notes,
                issues: data.issues
            }
        });
    }
    async complete(id, data) {
        return this.prisma.productionLog.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                actualWaste: data.actualWaste,
                actualTime: data.actualTime,
                notes: data.notes,
                completedAt: new Date()
            }
        });
    }
    async findByPlanId(planId) {
        return this.prisma.productionLog.findFirst({
            where: { cuttingPlanId: planId },
            orderBy: { startedAt: 'desc' }
        });
    }
}
exports.ProductionRepository = ProductionRepository;
//# sourceMappingURL=production.repository.js.map