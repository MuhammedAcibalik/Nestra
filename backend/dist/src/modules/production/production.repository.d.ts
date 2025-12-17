/**
 * Production Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { productionLogs, downtimeLogs, qualityChecks, DowntimeReason, QcResult } from '../../db/schema';
export type ProductionLog = typeof productionLogs.$inferSelect;
export type DowntimeLog = typeof downtimeLogs.$inferSelect;
export type QualityCheck = typeof qualityChecks.$inferSelect;
export type ProductionLogWithRelations = ProductionLog & {
    cuttingPlan?: {
        id: string;
        planNumber: string;
    };
    operator?: {
        id: string;
        firstName: string;
        lastName: string;
    };
};
export type DowntimeLogWithRelations = DowntimeLog & {
    machine?: {
        id: string;
        name: string;
        code: string;
    } | null;
};
export type QualityCheckWithRelations = QualityCheck & {
    inspector?: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
};
export interface IProductionFilter {
    status?: string;
    cuttingPlanId?: string;
    operatorId?: string;
}
export interface ICreateProductionLogInput {
    cuttingPlanId: string;
    operatorId: string;
    notes?: string;
}
export interface IUpdateProductionLogInput {
    actualWaste?: number;
    actualTime?: number;
    status?: string;
    completedAt?: Date;
    notes?: string;
    issues?: Record<string, unknown>;
}
export interface ICompleteProductionInput {
    actualWaste?: number;
    actualTime?: number;
    notes?: string;
    issues?: Record<string, unknown>;
}
export interface ICreateDowntimeInput {
    productionLogId: string;
    machineId?: string;
    reason: DowntimeReason;
    notes?: string;
}
export interface ICreateQualityCheckInput {
    productionLogId: string;
    result: QcResult;
    passedCount: number;
    failedCount: number;
    defectTypes?: string[];
    inspectorId?: string;
    notes?: string;
}
export interface IProductionRepository {
    findById(id: string): Promise<ProductionLogWithRelations | null>;
    findByPlanId(planId: string): Promise<ProductionLogWithRelations | null>;
    findAll(filter?: IProductionFilter): Promise<ProductionLogWithRelations[]>;
    create(planId: string, operatorId: string): Promise<ProductionLog>;
    update(id: string, data: IUpdateProductionLogInput): Promise<ProductionLog>;
    complete(logId: string, data: ICompleteProductionInput): Promise<ProductionLog>;
    createDowntime(input: ICreateDowntimeInput): Promise<DowntimeLog>;
    updateDowntime(id: string, endedAt: Date, durationMinutes: number): Promise<DowntimeLog>;
    findDowntimesByLogId(productionLogId: string): Promise<DowntimeLogWithRelations[]>;
    createQualityCheck(input: ICreateQualityCheckInput): Promise<QualityCheck>;
    findQualityChecksByLogId(productionLogId: string): Promise<QualityCheckWithRelations[]>;
}
export declare class ProductionRepository implements IProductionRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<ProductionLogWithRelations | null>;
    findByPlanId(planId: string): Promise<ProductionLogWithRelations | null>;
    findAll(filter?: IProductionFilter): Promise<ProductionLogWithRelations[]>;
    create(planId: string, operatorId: string): Promise<ProductionLog>;
    update(id: string, data: IUpdateProductionLogInput): Promise<ProductionLog>;
    complete(logId: string, data: ICompleteProductionInput): Promise<ProductionLog>;
    createDowntime(input: ICreateDowntimeInput): Promise<DowntimeLog>;
    updateDowntime(id: string, endedAt: Date, durationMinutes: number): Promise<DowntimeLog>;
    findDowntimesByLogId(productionLogId: string): Promise<DowntimeLogWithRelations[]>;
    createQualityCheck(input: ICreateQualityCheckInput): Promise<QualityCheck>;
    findQualityChecksByLogId(productionLogId: string): Promise<QualityCheckWithRelations[]>;
}
//# sourceMappingURL=production.repository.d.ts.map