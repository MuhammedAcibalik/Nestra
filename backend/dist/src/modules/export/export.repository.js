"use strict";
/**
 * Export Repository
 * Handles data access for export operations
 * Following SRP - Only handles export-related data queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportRepository = void 0;
// ==================== REPOSITORY ====================
class ExportRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findPlanById(planId) {
        const plan = await this.prisma.cuttingPlan.findUnique({
            where: { id: planId },
            include: {
                scenario: {
                    include: {
                        cuttingJob: {
                            include: {
                                items: {
                                    include: {
                                        orderItem: true
                                    }
                                }
                            }
                        }
                    }
                },
                stockItems: {
                    include: {
                        stockItem: true
                    },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
        if (!plan)
            return null;
        return this.mapPlanToExportData(plan);
    }
    async findMaterialTypeById(materialTypeId) {
        const material = await this.prisma.materialType.findUnique({
            where: { id: materialTypeId },
            select: { id: true, name: true }
        });
        return material;
    }
    async findPlansByIds(planIds) {
        const plans = await this.prisma.cuttingPlan.findMany({
            where: { id: { in: planIds } },
            include: {
                scenario: {
                    include: {
                        cuttingJob: {
                            include: {
                                items: {
                                    include: {
                                        orderItem: true
                                    }
                                }
                            }
                        }
                    }
                },
                stockItems: {
                    include: {
                        stockItem: true
                    },
                    orderBy: { sequence: 'asc' }
                }
            }
        });
        return plans.map(plan => this.mapPlanToExportData(plan));
    }
    mapPlanToExportData(plan) {
        return {
            id: plan.id,
            planNumber: plan.planNumber,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            createdAt: plan.createdAt,
            scenario: {
                name: plan.scenario.name,
                cuttingJob: {
                    materialTypeId: plan.scenario.cuttingJob.materialTypeId,
                    thickness: plan.scenario.cuttingJob.thickness,
                    items: plan.scenario.cuttingJob.items.map(item => ({
                        orderItem: item.orderItem ? {
                            itemCode: item.orderItem.itemCode ?? '',
                            itemName: item.orderItem.itemName ?? ''
                        } : null
                    }))
                }
            },
            stockItems: plan.stockItems.map(si => ({
                sequence: si.sequence,
                waste: si.waste,
                wastePercentage: si.wastePercentage,
                layoutData: si.layoutData,
                stockItem: {
                    code: si.stockItem.code,
                    stockType: si.stockItem.stockType,
                    length: si.stockItem.length,
                    width: si.stockItem.width,
                    height: si.stockItem.height
                }
            }))
        };
    }
}
exports.ExportRepository = ExportRepository;
//# sourceMappingURL=export.repository.js.map