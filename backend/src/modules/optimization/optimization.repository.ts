/**
 * Optimization Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { optimizationScenarios, cuttingPlans, cuttingPlanStocks } from '../../db/schema';
import { ScenarioStatus, PlanStatus } from '../../db/schema/enums';
import { eq, desc, and } from 'drizzle-orm';
import { IOptimizationParameters } from '../../core/interfaces';

// Type definitions
export type OptimizationScenario = typeof optimizationScenarios.$inferSelect;
export type CuttingPlan = typeof cuttingPlans.$inferSelect;
export type CuttingPlanStock = typeof cuttingPlanStocks.$inferSelect;

export type ScenarioWithRelations = OptimizationScenario & {
    results?: CuttingPlan[];
    cuttingJob?: { id: string; jobNumber: string };
    createdBy?: { id: string; firstName: string; lastName: string };
    _count?: { results: number };
};

export type PlanWithRelations = CuttingPlan & {
    stockItems?: CuttingPlanStock[];
    stockUsed?: CuttingPlanStock[];
    scenario?: OptimizationScenario & { name: string };
    approvedBy?: { id: string; firstName: string; lastName: string } | null;
    assignedMachine?: { id: string; name: string; code: string } | null;
};

export interface IScenarioFilter {
    status?: string;
    cuttingJobId?: string;
    createdById?: string;
}

export interface IPlanFilter {
    status?: string;
    scenarioId?: string;
}

export interface ICreateScenarioInput {
    name: string;
    cuttingJobId: string;
    parameters: IOptimizationParameters;
    useWarehouseStock?: boolean;
    useStandardSizes?: boolean;
    selectedStockIds?: string[];
}

export interface ICreatePlanData {
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime?: number;
    estimatedCost?: number;
    layoutData?: Array<{
        stockItemId: string;
        sequence: number;
        waste: number;
        wastePercentage: number;
        layoutJson?: unknown;
    }>;
}

/** Layout data for cutting plan visualization */
export interface ILayoutData {
    pieces?: Array<{ x: number; y: number; width: number; height: number; itemId: string }>;
    cuts?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
    waste?: Array<{ x: number; y: number; width: number; height: number }>;
    [key: string]: unknown;
}

export interface IOptimizationRepository {
    findScenarioById(id: string): Promise<ScenarioWithRelations | null>;
    findAllScenarios(filter?: IScenarioFilter): Promise<ScenarioWithRelations[]>;
    createScenario(data: ICreateScenarioInput, userId: string): Promise<OptimizationScenario>;
    updateScenarioStatus(id: string, status: string): Promise<OptimizationScenario>;
    findPlanById(id: string): Promise<PlanWithRelations | null>;
    findAllPlans(filter?: IPlanFilter): Promise<PlanWithRelations[]>;
    createPlan(scenarioId: string, data: ICreatePlanData): Promise<CuttingPlan>;
    updatePlanStatus(id: string, status: string, approvedById?: string, machineId?: string): Promise<CuttingPlan>;
    getPlanStockItems(planId: string): Promise<CuttingPlanStock[]>;
}

export class OptimizationRepository implements IOptimizationRepository {
    private planCounter = 1;

    constructor(private readonly db: Database) { }

    async findScenarioById(id: string): Promise<ScenarioWithRelations | null> {
        const result = await this.db.query.optimizationScenarios.findFirst({
            where: eq(optimizationScenarios.id, id),
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            }
        });
        return result ?? null;
    }

    async findAllScenarios(filter?: IScenarioFilter): Promise<ScenarioWithRelations[]> {
        const conditions = [];

        if (filter?.status) conditions.push(eq(optimizationScenarios.status, filter.status as ScenarioStatus));
        if (filter?.cuttingJobId) conditions.push(eq(optimizationScenarios.cuttingJobId, filter.cuttingJobId));
        if (filter?.createdById) conditions.push(eq(optimizationScenarios.createdById, filter.createdById));

        return this.db.query.optimizationScenarios.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            },
            orderBy: [desc(optimizationScenarios.createdAt)]
        });
    }

    async createScenario(data: ICreateScenarioInput, userId: string): Promise<OptimizationScenario> {
        const [result] = await this.db.insert(optimizationScenarios).values({
            name: data.name,
            cuttingJobId: data.cuttingJobId,
            createdById: userId,
            parameters: data.parameters,
            useWarehouseStock: data.useWarehouseStock ?? true,
            useStandardSizes: data.useStandardSizes ?? true,
            selectedStockIds: data.selectedStockIds
        }).returning();
        return result;
    }

    async updateScenarioStatus(id: string, status: string): Promise<OptimizationScenario> {
        const [result] = await this.db.update(optimizationScenarios)
            .set({
                status: status as ScenarioStatus,
                updatedAt: new Date()
            })
            .where(eq(optimizationScenarios.id, id))
            .returning();
        return result;
    }

    async findPlanById(id: string): Promise<PlanWithRelations | null> {
        const result = await this.db.query.cuttingPlans.findFirst({
            where: eq(cuttingPlans.id, id),
            with: {
                stockItems: true,
                scenario: true,
                approvedBy: true
            }
        });
        if (!result) return null;
        // Add stockUsed as alias for stockItems
        return { ...result, stockUsed: result.stockItems };
    }

    async findAllPlans(filter?: IPlanFilter): Promise<PlanWithRelations[]> {
        const conditions = [];

        if (filter?.status) conditions.push(eq(cuttingPlans.status, filter.status as PlanStatus));
        if (filter?.scenarioId) conditions.push(eq(cuttingPlans.scenarioId, filter.scenarioId));

        const plans = await this.db.query.cuttingPlans.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                stockItems: true,
                scenario: true,
                approvedBy: true
            },
            orderBy: [desc(cuttingPlans.createdAt)]
        });

        return plans.map(p => ({ ...p, stockUsed: p.stockItems }));
    }

    async createPlan(scenarioId: string, data: ICreatePlanData): Promise<CuttingPlan> {
        const planNumber = `PLN-${Date.now()}-${this.planCounter++}`;

        const [plan] = await this.db.insert(cuttingPlans).values({
            planNumber,
            scenarioId,
            totalWaste: data.totalWaste,
            wastePercentage: data.wastePercentage,
            stockUsedCount: data.stockUsedCount,
            estimatedTime: data.estimatedTime,
            estimatedCost: data.estimatedCost
        }).returning();

        // Insert layout data as stock items
        if (data.layoutData && data.layoutData.length > 0) {
            await this.db.insert(cuttingPlanStocks).values(
                data.layoutData.map(layout => ({
                    cuttingPlanId: plan.id,
                    stockItemId: layout.stockItemId,
                    sequence: layout.sequence,
                    waste: layout.waste,
                    wastePercentage: layout.wastePercentage,
                    layoutData: layout.layoutJson
                }))
            );
        }

        return plan;
    }

    async updatePlanStatus(id: string, status: string, approvedById?: string, machineId?: string): Promise<CuttingPlan> {
        const [result] = await this.db.update(cuttingPlans)
            .set({
                status: status as PlanStatus,
                approvedById,
                machineId,
                approvedAt: approvedById ? new Date() : null,
                updatedAt: new Date()
            })
            .where(eq(cuttingPlans.id, id))
            .returning();
        return result;
    }

    async getPlanStockItems(planId: string): Promise<CuttingPlanStock[]> {
        return this.db.select().from(cuttingPlanStocks)
            .where(eq(cuttingPlanStocks.cuttingPlanId, planId));
    }
}
