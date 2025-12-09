/**
 * Optimization Repository
 * Following SRP - Only handles optimization data access
 */

import { PrismaClient, Prisma, OptimizationScenario, CuttingPlan, CuttingPlanStock } from '@prisma/client';
import { ICreateScenarioInput, IScenarioFilter, IPlanFilter } from '../../core/interfaces';

export type ScenarioWithRelations = OptimizationScenario & {
    cuttingJob?: { id: string; jobNumber: string };
    createdBy?: { firstName: string; lastName: string };
    _count?: { results: number };
};

export type PlanWithRelations = CuttingPlan & {
    scenario?: { id: string; name: string };
    stockUsed?: CuttingPlanStock[];
    assignedMachine?: { id: string; name: string; code: string } | null;
    approvedBy?: { firstName: string; lastName: string } | null;
    _count?: { stockItems: number };
};

interface CreatePlanInput {
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime?: number;
    estimatedCost?: number;
    layoutData: PlanLayoutData[];
}

interface PlanLayoutData {
    stockItemId: string;
    sequence: number;
    waste: number;
    wastePercentage: number;
    layoutJson: string;
}

interface ScenarioWhereInput {
    cuttingJobId?: string;
    status?: string;
}

interface PlanWhereInput {
    scenarioId?: string;
    status?: string;
}

export interface IOptimizationRepository {
    findScenarioById(id: string): Promise<ScenarioWithRelations | null>;
    findAllScenarios(filter?: IScenarioFilter): Promise<ScenarioWithRelations[]>;
    createScenario(data: ICreateScenarioInput, userId: string): Promise<OptimizationScenario>;
    updateScenarioStatus(id: string, status: string): Promise<OptimizationScenario>;
    deleteScenario(id: string): Promise<void>;
    findPlanById(id: string): Promise<PlanWithRelations | null>;
    findAllPlans(filter?: IPlanFilter): Promise<PlanWithRelations[]>;
    createPlan(scenarioId: string, data: CreatePlanInput): Promise<CuttingPlan>;
    updatePlanStatus(id: string, status: string, approvedById?: string, machineId?: string): Promise<CuttingPlan>;
    getPlanStockItems(planId: string): Promise<CuttingPlanStock[]>;
    generatePlanNumber(): Promise<string>;
}

export class OptimizationRepository implements IOptimizationRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findScenarioById(id: string): Promise<ScenarioWithRelations | null> {
        return this.prisma.optimizationScenario.findUnique({
            where: { id },
            include: {
                cuttingJob: { select: { id: true, jobNumber: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { results: true } }
            }
        });
    }

    async findAllScenarios(filter?: IScenarioFilter): Promise<ScenarioWithRelations[]> {
        const where: ScenarioWhereInput = {};
        if (filter?.cuttingJobId) where.cuttingJobId = filter.cuttingJobId;
        if (filter?.status) where.status = filter.status;

        return this.prisma.optimizationScenario.findMany({
            where: where as Prisma.OptimizationScenarioWhereInput,
            include: {
                cuttingJob: { select: { id: true, jobNumber: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { results: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createScenario(data: ICreateScenarioInput, userId: string): Promise<OptimizationScenario> {
        return this.prisma.optimizationScenario.create({
            data: {
                name: data.name,
                cuttingJobId: data.cuttingJobId,
                parameters: data.parameters as object,
                useWarehouseStock: data.useWarehouseStock ?? true,
                useStandardSizes: data.useStandardSizes ?? false,
                selectedStockIds: data.selectedStockIds ?? [],
                createdById: userId
            }
        });
    }

    async updateScenarioStatus(id: string, status: string): Promise<OptimizationScenario> {
        return this.prisma.optimizationScenario.update({
            where: { id },
            data: { status: status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' }
        });
    }

    async deleteScenario(id: string): Promise<void> {
        await this.prisma.optimizationScenario.delete({ where: { id } });
    }

    async findPlanById(id: string): Promise<PlanWithRelations | null> {
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

    async findAllPlans(filter?: IPlanFilter): Promise<PlanWithRelations[]> {
        const where: PlanWhereInput = {};
        if (filter?.scenarioId) where.scenarioId = filter.scenarioId;
        if (filter?.status) where.status = filter.status;

        return this.prisma.cuttingPlan.findMany({
            where: where as Prisma.CuttingPlanWhereInput,
            include: {
                scenario: { select: { id: true, name: true } },
                machine: { select: { id: true, name: true, code: true } },
                _count: { select: { stockItems: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createPlan(scenarioId: string, data: CreatePlanInput): Promise<CuttingPlan> {
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

    async updatePlanStatus(
        id: string,
        status: string,
        approvedById?: string,
        machineId?: string
    ): Promise<CuttingPlan> {
        return this.prisma.cuttingPlan.update({
            where: { id },
            data: {
                status: status as 'DRAFT' | 'APPROVED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED',
                approvedById: approvedById,
                approvedAt: approvedById ? new Date() : undefined,
                machineId: machineId
            }
        });
    }

    async getPlanStockItems(planId: string): Promise<CuttingPlanStock[]> {
        return this.prisma.cuttingPlanStock.findMany({
            where: { cuttingPlanId: planId },
            orderBy: { sequence: 'asc' }
        });
    }

    async generatePlanNumber(): Promise<string> {
        const count = await this.prisma.cuttingPlan.count();
        return `PLN-${String(count + 1).padStart(6, '0')}`;
    }
}
