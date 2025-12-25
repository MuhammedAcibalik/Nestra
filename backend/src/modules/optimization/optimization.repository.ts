/**
 * Optimization Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */

import { Database } from '../../db';
import { optimizationScenarios, cuttingPlans, cuttingPlanStocks } from '../../db/schema';
import { ScenarioStatus, PlanStatus } from '../../db/schema/enums';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { IOptimizationParameters } from '../../core/interfaces';
import { createFilter } from '../../core/database';
import { getCurrentTenantIdOptional } from '../../core/tenant';

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

    constructor(private readonly db: Database) {}

    // ==================== TENANT FILTERING ====================

    private getTenantFilter(): SQL | undefined {
        const tenantId = getCurrentTenantIdOptional();
        if (!tenantId) return undefined;
        return eq(optimizationScenarios.tenantId, tenantId);
    }

    private withTenantFilter(conditions: SQL[]): SQL | undefined {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter) conditions.push(tenantFilter);
        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    private getCurrentTenantId(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    // ==================== SCENARIO OPERATIONS ====================

    async findScenarioById(id: string): Promise<ScenarioWithRelations | null> {
        const conditions = [eq(optimizationScenarios.id, id)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.optimizationScenarios.findFirst({
            where,
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            }
        });
        return result ?? null;
    }

    async findAllScenarios(filter?: IScenarioFilter): Promise<ScenarioWithRelations[]> {
        const where = createFilter()
            .eq(optimizationScenarios.status, filter?.status as ScenarioStatus | undefined)
            .eq(optimizationScenarios.cuttingJobId, filter?.cuttingJobId)
            .eq(optimizationScenarios.createdById, filter?.createdById)
            .eq(optimizationScenarios.tenantId, this.getCurrentTenantId())
            .build();

        return this.db.query.optimizationScenarios.findMany({
            where,
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            },
            orderBy: [desc(optimizationScenarios.createdAt)]
        });
    }

    async createScenario(data: ICreateScenarioInput, userId: string): Promise<OptimizationScenario> {
        const [result] = await this.db
            .insert(optimizationScenarios)
            .values({
                tenantId: this.getCurrentTenantId(),
                name: data.name,
                cuttingJobId: data.cuttingJobId,
                createdById: userId,
                parameters: data.parameters,
                useWarehouseStock: data.useWarehouseStock ?? true,
                useStandardSizes: data.useStandardSizes ?? true,
                selectedStockIds: data.selectedStockIds
            })
            .returning();
        return result;
    }

    async updateScenarioStatus(id: string, status: string): Promise<OptimizationScenario> {
        const conditions = [eq(optimizationScenarios.id, id)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db
            .update(optimizationScenarios)
            .set({
                status: status as ScenarioStatus,
                updatedAt: new Date()
            })
            .where(where ?? eq(optimizationScenarios.id, id))
            .returning();
        return result;
    }

    // ==================== PLAN OPERATIONS ====================

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
        return { ...result, stockUsed: result.stockItems };
    }

    async findAllPlans(filter?: IPlanFilter): Promise<PlanWithRelations[]> {
        const where = createFilter()
            .eq(cuttingPlans.status, filter?.status as PlanStatus | undefined)
            .eq(cuttingPlans.scenarioId, filter?.scenarioId)
            .build();

        const plans = await this.db.query.cuttingPlans.findMany({
            where,
            with: {
                stockItems: true,
                scenario: true,
                approvedBy: true
            },
            orderBy: [desc(cuttingPlans.createdAt)]
        });

        return plans.map((p) => ({ ...p, stockUsed: p.stockItems }));
    }

    async createPlan(scenarioId: string, data: ICreatePlanData): Promise<CuttingPlan> {
        const planNumber = `PLN-${Date.now()}-${this.planCounter++}`;

        const [plan] = await this.db
            .insert(cuttingPlans)
            .values({
                planNumber,
                scenarioId,
                totalWaste: data.totalWaste,
                wastePercentage: data.wastePercentage,
                stockUsedCount: data.stockUsedCount,
                estimatedTime: data.estimatedTime,
                estimatedCost: data.estimatedCost
            })
            .returning();

        if (data.layoutData && data.layoutData.length > 0) {
            await this.db.insert(cuttingPlanStocks).values(
                data.layoutData.map((layout) => ({
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

    async updatePlanStatus(
        id: string,
        status: string,
        approvedById?: string,
        machineId?: string
    ): Promise<CuttingPlan> {
        const [result] = await this.db
            .update(cuttingPlans)
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
        return this.db.select().from(cuttingPlanStocks).where(eq(cuttingPlanStocks.cuttingPlanId, planId));
    }
}
