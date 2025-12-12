/**
 * Export Repository
 * Handles data access for export operations
 * Following SRP - Only handles export-related data queries
 */

import { PrismaClient, CuttingPlan } from '@prisma/client';

// ==================== INTERFACES ====================

export interface IExportPlanData {
    id: string;
    planNumber: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    createdAt: Date;
    scenario: {
        name: string;
        cuttingJob: {
            materialTypeId: string;
            thickness: number;
            items: Array<{
                orderItem: {
                    itemCode: string | null;
                    itemName: string | null;
                } | null;
            }>;
        };
    };
    stockItems: Array<{
        sequence: number;
        waste: number;
        wastePercentage: number;
        layoutData: unknown;
        stockItem: {
            code: string;
            stockType: string;
            length: number | null;
            width: number | null;
            height: number | null;
        };
    }>;
}

export interface IMaterialTypeInfo {
    id: string;
    name: string;
}

export interface IExportRepository {
    findPlanById(planId: string): Promise<IExportPlanData | null>;
    findMaterialTypeById(materialTypeId: string): Promise<IMaterialTypeInfo | null>;
    findPlansByIds(planIds: string[]): Promise<IExportPlanData[]>;
}

// ==================== REPOSITORY ====================

export class ExportRepository implements IExportRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findPlanById(planId: string): Promise<IExportPlanData | null> {
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

        if (!plan) return null;

        return this.mapPlanToExportData(plan);
    }

    async findMaterialTypeById(materialTypeId: string): Promise<IMaterialTypeInfo | null> {
        const material = await this.prisma.materialType.findUnique({
            where: { id: materialTypeId },
            select: { id: true, name: true }
        });

        return material;
    }

    async findPlansByIds(planIds: string[]): Promise<IExportPlanData[]> {
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

    private mapPlanToExportData(plan: CuttingPlan & {
        scenario: {
            name: string;
            cuttingJob: {
                materialTypeId: string;
                thickness: number;
                items: Array<{ orderItem: { itemCode: string | null; itemName: string | null } | null }>;
            };
        };
        stockItems: Array<{
            sequence: number;
            waste: number;
            wastePercentage: number;
            layoutData: unknown;
            stockItem: {
                code: string;
                stockType: string;
                length: number | null;
                width: number | null;
                height: number | null;
            };
        }>;
    }): IExportPlanData {
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
