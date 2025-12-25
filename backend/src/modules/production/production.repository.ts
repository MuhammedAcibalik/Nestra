/**
 * Production Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */

import { Database } from '../../db';
import { productionLogs, downtimeLogs, qualityChecks, DowntimeReason, QcResult } from '../../db/schema';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { createFilter } from '../../core/database';
import { getCurrentTenantIdOptional } from '../../core/tenant';

// Type definitions
export type ProductionLog = typeof productionLogs.$inferSelect;
export type DowntimeLog = typeof downtimeLogs.$inferSelect;
export type QualityCheck = typeof qualityChecks.$inferSelect;

export type ProductionLogWithRelations = ProductionLog & {
    cuttingPlan?: { id: string; planNumber: string };
    operator?: { id: string; firstName: string; lastName: string };
};

export type DowntimeLogWithRelations = DowntimeLog & {
    machine?: { id: string; name: string; code: string } | null;
};

export type QualityCheckWithRelations = QualityCheck & {
    inspector?: { id: string; firstName: string; lastName: string } | null;
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

export class ProductionRepository implements IProductionRepository {
    constructor(private readonly db: Database) {}

    // ==================== TENANT FILTERING ====================

    private getTenantFilter(): SQL | undefined {
        const tenantId = getCurrentTenantIdOptional();
        if (!tenantId) return undefined;
        return eq(productionLogs.tenantId, tenantId);
    }

    private withTenantFilter(conditions: SQL[]): SQL | undefined {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter) conditions.push(tenantFilter);
        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    private getCurrentTenantId(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    // ==================== PRODUCTION LOG OPERATIONS ====================

    async findById(id: string): Promise<ProductionLogWithRelations | null> {
        const conditions = [eq(productionLogs.id, id)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.productionLogs.findFirst({
            where,
            with: {
                cuttingPlan: true,
                operator: true
            }
        });
        return result ?? null;
    }

    async findByPlanId(planId: string): Promise<ProductionLogWithRelations | null> {
        const conditions = [eq(productionLogs.cuttingPlanId, planId)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.productionLogs.findFirst({
            where,
            with: {
                cuttingPlan: true,
                operator: true
            }
        });
        return result ?? null;
    }

    async findAll(filter?: IProductionFilter): Promise<ProductionLogWithRelations[]> {
        const where = createFilter()
            .eq(productionLogs.status, filter?.status as 'STARTED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | undefined)
            .eq(productionLogs.cuttingPlanId, filter?.cuttingPlanId)
            .eq(productionLogs.operatorId, filter?.operatorId)
            .eq(productionLogs.tenantId, this.getCurrentTenantId())
            .build();

        return this.db.query.productionLogs.findMany({
            where,
            with: {
                cuttingPlan: true,
                operator: true
            },
            orderBy: [desc(productionLogs.createdAt)]
        });
    }

    async create(planId: string, operatorId: string): Promise<ProductionLog> {
        const [result] = await this.db
            .insert(productionLogs)
            .values({
                tenantId: this.getCurrentTenantId(),
                cuttingPlanId: planId,
                operatorId: operatorId,
                startedAt: new Date()
            })
            .returning();
        return result;
    }

    async update(id: string, data: IUpdateProductionLogInput): Promise<ProductionLog> {
        const conditions = [eq(productionLogs.id, id)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db
            .update(productionLogs)
            .set({
                actualWaste: data.actualWaste,
                actualTime: data.actualTime,
                status: data.status as 'STARTED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED',
                completedAt: data.completedAt,
                notes: data.notes,
                issues: data.issues,
                updatedAt: new Date()
            })
            .where(where ?? eq(productionLogs.id, id))
            .returning();
        return result;
    }

    async complete(logId: string, data: ICompleteProductionInput): Promise<ProductionLog> {
        const conditions = [eq(productionLogs.id, logId)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db
            .update(productionLogs)
            .set({
                actualWaste: data.actualWaste,
                actualTime: data.actualTime,
                notes: data.notes,
                issues: data.issues,
                status: 'COMPLETED',
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(where ?? eq(productionLogs.id, logId))
            .returning();
        return result;
    }

    // ==================== DOWNTIME METHODS ====================

    async createDowntime(input: ICreateDowntimeInput): Promise<DowntimeLog> {
        const [result] = await this.db
            .insert(downtimeLogs)
            .values({
                productionLogId: input.productionLogId,
                machineId: input.machineId,
                reason: input.reason,
                notes: input.notes,
                startedAt: new Date()
            })
            .returning();
        return result;
    }

    async updateDowntime(id: string, endedAt: Date, durationMinutes: number): Promise<DowntimeLog> {
        const [result] = await this.db
            .update(downtimeLogs)
            .set({
                endedAt,
                durationMinutes
            })
            .where(eq(downtimeLogs.id, id))
            .returning();
        return result;
    }

    async findDowntimesByLogId(productionLogId: string): Promise<DowntimeLogWithRelations[]> {
        return this.db.query.downtimeLogs.findMany({
            where: eq(downtimeLogs.productionLogId, productionLogId),
            with: {
                machine: true
            },
            orderBy: [desc(downtimeLogs.startedAt)]
        });
    }

    // ==================== QUALITY CHECK METHODS ====================

    async createQualityCheck(input: ICreateQualityCheckInput): Promise<QualityCheck> {
        const [result] = await this.db
            .insert(qualityChecks)
            .values({
                productionLogId: input.productionLogId,
                result: input.result,
                passedCount: input.passedCount,
                failedCount: input.failedCount,
                defectTypes: input.defectTypes,
                inspectorId: input.inspectorId,
                notes: input.notes,
                checkedAt: new Date()
            })
            .returning();
        return result;
    }

    async findQualityChecksByLogId(productionLogId: string): Promise<QualityCheckWithRelations[]> {
        return this.db.query.qualityChecks.findMany({
            where: eq(qualityChecks.productionLogId, productionLogId),
            with: {
                inspector: true
            },
            orderBy: [desc(qualityChecks.checkedAt)]
        });
    }
}
