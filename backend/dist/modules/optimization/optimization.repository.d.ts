/**
 * Optimization Repository
 * Following SRP - Only handles optimization data access
 */
import { PrismaClient, OptimizationScenario, CuttingPlan, CuttingPlanStock } from '@prisma/client';
import { ICreateScenarioInput, IScenarioFilter, IPlanFilter } from '../../core/interfaces';
export type ScenarioWithRelations = OptimizationScenario & {
    cuttingJob?: {
        id: string;
        jobNumber: string;
    };
    createdBy?: {
        firstName: string;
        lastName: string;
    };
    _count?: {
        results: number;
    };
};
export type PlanWithRelations = CuttingPlan & {
    scenario?: {
        id: string;
        name: string;
    };
    stockUsed?: CuttingPlanStock[];
    assignedMachine?: {
        id: string;
        name: string;
        code: string;
    } | null;
    approvedBy?: {
        firstName: string;
        lastName: string;
    } | null;
    _count?: {
        stockItems: number;
    };
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
export declare class OptimizationRepository implements IOptimizationRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
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
export {};
//# sourceMappingURL=optimization.repository.d.ts.map