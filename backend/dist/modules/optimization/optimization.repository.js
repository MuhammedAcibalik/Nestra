"use strict";
/**
 * Optimization Repository
 * Following SRP - Only handles optimization data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationRepository = void 0;
class OptimizationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findScenarioById(id) {
        return this.prisma.optimizationScenario.findUnique({
            where: { id },
            include: {
                cuttingJob: { select: { id: true, jobNumber: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { results: true } }
            }
        });
    }
    async findAllScenarios(filter) {
        const where = {};
        if (filter?.cuttingJobId)
            where.cuttingJobId = filter.cuttingJobId;
        if (filter?.status)
            where.status = filter.status;
        return this.prisma.optimizationScenario.findMany({
            where: where,
            include: {
                cuttingJob: { select: { id: true, jobNumber: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { results: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createScenario(data, userId) {
        return this.prisma.optimizationScenario.create({
            data: {
                name: data.name,
                cuttingJobId: data.cuttingJobId,
                parameters: data.parameters,
                useWarehouseStock: data.useWarehouseStock ?? true,
                useStandardSizes: data.useStandardSizes ?? false,
                selectedStockIds: data.selectedStockIds ?? [],
                createdById: userId
            }
        });
    }
    async updateScenarioStatus(id, status) {
        return this.prisma.optimizationScenario.update({
            where: { id },
            data: { status: status }
        });
    }
    async deleteScenario(id) {
        await this.prisma.optimizationScenario.delete({ where: { id } });
    }
    async findPlanById(id) {
        return this.prisma.cuttingPlan.findUnique({
            where: { id },
            include: {
                scenario: { select: { id: true, name: true } },
                stockItems: true,
                machine: { select: { id: true, name: true, code: true } },
                approvedBy: { select: { firstName: true, lastName: true } }
            }
        });
    }
    async findAllPlans(filter) {
        const where = {};
        if (filter?.scenarioId)
            where.scenarioId = filter.scenarioId;
        if (filter?.status)
            where.status = filter.status;
        return this.prisma.cuttingPlan.findMany({
            where: where,
            include: {
                scenario: { select: { id: true, name: true } },
                machine: { select: { id: true, name: true, code: true } },
                _count: { select: { stockItems: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createPlan(scenarioId, data) {
        const planNumber = await this.generatePlanNumber();
        return this.prisma.cuttingPlan.create({
            data: {
                planNumber,
                scenarioId,
                totalWaste: data.totalWaste,
                wastePercentage: data.wastePercentage,
                stockUsedCount: data.stockUsedCount,
                estimatedTime: data.estimatedTime,
                estimatedCost: data.estimatedCost,
                stockItems: {
                    create: data.layoutData.map((layout) => ({
                        stockItemId: layout.stockItemId,
                        sequence: layout.sequence,
                        waste: layout.waste,
                        wastePercentage: layout.wastePercentage,
                        layoutData: layout.layoutJson
                    }))
                }
            }
        });
    }
    async updatePlanStatus(id, status, approvedById, machineId) {
        return this.prisma.cuttingPlan.update({
            where: { id },
            data: {
                status: status,
                approvedById: approvedById,
                approvedAt: approvedById ? new Date() : undefined,
                machineId: machineId
            }
        });
    }
    async getPlanStockItems(planId) {
        return this.prisma.cuttingPlanStock.findMany({
            where: { cuttingPlanId: planId },
            orderBy: { sequence: 'asc' }
        });
    }
    async generatePlanNumber() {
        const count = await this.prisma.cuttingPlan.count();
        return `PLN-${String(count + 1).padStart(6, '0')}`;
    }
}
exports.OptimizationRepository = OptimizationRepository;
//# sourceMappingURL=optimization.repository.js.map