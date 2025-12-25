/**
 * Optimization Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */
import { Database } from '../../db';
import { optimizationScenarios, cuttingPlans, cuttingPlanStocks } from '../../db/schema';
import { IOptimizationParameters } from '../../core/interfaces';
export type OptimizationScenario = typeof optimizationScenarios.$inferSelect;
export type CuttingPlan = typeof cuttingPlans.$inferSelect;
export type CuttingPlanStock = typeof cuttingPlanStocks.$inferSelect;
export type ScenarioWithRelations = OptimizationScenario & {
    results?: CuttingPlan[];
    cuttingJob?: {
        id: string;
        jobNumber: string;
    };
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    _count?: {
        results: number;
    };
};
export type PlanWithRelations = CuttingPlan & {
    stockItems?: CuttingPlanStock[];
    stockUsed?: CuttingPlanStock[];
    scenario?: OptimizationScenario & {
        name: string;
    };
    approvedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
    assignedMachine?: {
        id: string;
        name: string;
        code: string;
    } | null;
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
    pieces?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        itemId: string;
    }>;
    cuts?: Array<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }>;
    waste?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
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
export declare class OptimizationRepository implements IOptimizationRepository {
    private readonly db;
    private planCounter;
    constructor(db: Database);
    private getTenantFilter;
    private withTenantFilter;
    private getCurrentTenantId;
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
//# sourceMappingURL=optimization.repository.d.ts.map