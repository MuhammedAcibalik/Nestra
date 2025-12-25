/**
 * Real-time Dashboard Repository
 * Data access for dashboard metrics and real-time data
 * Following Repository Pattern with Drizzle ORM
 */

import { eq, and, gte, count, sql, desc } from 'drizzle-orm';
import { Database } from '../../db';
import {
    orders,
    stockItems,
    productionLogs,
    optimizationScenarios,
    cuttingPlans,
    activities
} from '../../db/schema';

// ==================== INTERFACES ====================

export interface IDashboardRepository {
    // KPIs
    getActiveProductionCount(tenantId: string): Promise<number>;
    getPendingOptimizationCount(tenantId: string): Promise<number>;
    getPendingOrderCount(tenantId: string): Promise<number>;
    getLowStockCount(tenantId: string): Promise<number>;
    getTodayWastePercentage(tenantId: string): Promise<number>;
    getTodayCompletedPlanCount(tenantId: string): Promise<number>;

    // Lists
    getActiveProductions(tenantId: string, limit?: number): Promise<IActiveProduction[]>;
    getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]>;
    getLowStockItems(tenantId: string, limit?: number): Promise<ILowStockItem[]>;
    getRecentActivities(tenantId: string, limit?: number): Promise<IRecentActivity[]>;

    // Stats
    getOrderStats(tenantId: string): Promise<IOrderStats>;
    getProductionStats(tenantId: string): Promise<IProductionStats>;
}

export interface IActiveProduction {
    readonly id: string;
    readonly planNumber: string;
    readonly status: string;
    readonly progress: number;
    readonly operatorId: string;
    readonly startedAt: Date;
}

export interface IRunningOptimization {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly createdAt: Date;
}

export interface ILowStockItem {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly quantity: number;
    readonly alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
}

export interface IRecentActivity {
    readonly id: string;
    readonly activityType: string;
    readonly actorId: string;
    readonly targetType: string | null;
    readonly targetId: string | null;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: Date;
}

export interface IOrderStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
}

export interface IProductionStats {
    active: number;
    completed: number;
    paused: number;
}

// ==================== REPOSITORY ====================

export class RealtimeDashboardRepository implements IDashboardRepository {
    constructor(private readonly db: Database) { }

    // ==================== KPIs ====================

    async getActiveProductionCount(tenantId: string): Promise<number> {
        const result = await this.db
            .select({ count: count() })
            .from(productionLogs)
            .where(
                and(
                    // Note: Production logs don't have tenantId yet in schema
                    // This will be added during migration
                    eq(productionLogs.status, 'STARTED')
                )
            );
        return result[0]?.count ?? 0;
    }

    async getPendingOptimizationCount(tenantId: string): Promise<number> {
        const result = await this.db
            .select({ count: count() })
            .from(optimizationScenarios)
            .where(eq(optimizationScenarios.status, 'PENDING'));
        return result[0]?.count ?? 0;
    }

    async getPendingOrderCount(tenantId: string): Promise<number> {
        const result = await this.db
            .select({ count: count() })
            .from(orders)
            .where(eq(orders.status, 'DRAFT'));
        return result[0]?.count ?? 0;
    }

    async getLowStockCount(tenantId: string): Promise<number> {
        // Count items where quantity is below a threshold (e.g., 10)
        const result = await this.db
            .select({ count: count() })
            .from(stockItems)
            .where(sql`${stockItems.quantity} < 10`);
        return result[0]?.count ?? 0;
    }

    async getTodayWastePercentage(tenantId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await this.db
            .select({
                avgWaste: sql<number>`AVG(${cuttingPlans.wastePercentage})`
            })
            .from(cuttingPlans)
            .where(
                and(
                    eq(cuttingPlans.status, 'COMPLETED'),
                    gte(cuttingPlans.createdAt, today)
                )
            );

        return result[0]?.avgWaste ?? 0;
    }

    async getTodayCompletedPlanCount(tenantId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await this.db
            .select({ count: count() })
            .from(cuttingPlans)
            .where(
                and(
                    eq(cuttingPlans.status, 'COMPLETED'),
                    gte(cuttingPlans.createdAt, today)
                )
            );

        return result[0]?.count ?? 0;
    }

    // ==================== LISTS ====================

    async getActiveProductions(tenantId: string, limit = 10): Promise<IActiveProduction[]> {
        const result = await this.db.query.productionLogs.findMany({
            where: eq(productionLogs.status, 'STARTED'),
            limit,
            orderBy: desc(productionLogs.startedAt),
            with: {
                cuttingPlan: true
            }
        });

        return result.map(p => ({
            id: p.id,
            planNumber: p.cuttingPlan?.planNumber ?? 'Unknown',
            status: p.status,
            progress: this.calculateProgress(p),
            operatorId: p.operatorId,
            startedAt: p.startedAt
        }));
    }

    async getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]> {
        const result = await this.db.query.optimizationScenarios.findMany({
            where: eq(optimizationScenarios.status, 'RUNNING'),
            orderBy: desc(optimizationScenarios.createdAt)
        });

        return result.map(s => ({
            id: s.id,
            name: s.name,
            status: s.status,
            createdAt: s.createdAt
        }));
    }

    async getLowStockItems(tenantId: string, limit = 10): Promise<ILowStockItem[]> {
        const result = await this.db
            .select()
            .from(stockItems)
            .where(sql`${stockItems.quantity} < 20`)
            .orderBy(stockItems.quantity)
            .limit(limit);

        return result.map(item => ({
            id: item.id,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            alertLevel: this.getAlertLevel(item.quantity)
        }));
    }

    async getRecentActivities(tenantId: string, limit = 20): Promise<IRecentActivity[]> {
        const result = await this.db.query.activities.findMany({
            where: eq(activities.tenantId, tenantId),
            orderBy: desc(activities.createdAt),
            limit
        });

        return result.map(a => ({
            id: a.id,
            activityType: a.activityType,
            actorId: a.actorId,
            targetType: a.targetType,
            targetId: a.targetId,
            metadata: a.metadata as Record<string, unknown>,
            createdAt: a.createdAt
        }));
    }

    // ==================== STATS ====================

    async getOrderStats(tenantId: string): Promise<IOrderStats> {
        const result = await this.db
            .select({
                status: orders.status,
                count: count()
            })
            .from(orders)
            .groupBy(orders.status);

        const stats: IOrderStats = {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0
        };

        for (const row of result) {
            stats.total += row.count;
            if (row.status === 'DRAFT' || row.status === 'CONFIRMED') {
                stats.pending += row.count;
            } else if (row.status === 'IN_PRODUCTION' || row.status === 'IN_PLANNING') {
                stats.inProgress += row.count;
            } else if (row.status === 'COMPLETED') {
                stats.completed += row.count;
            }
        }

        return stats;
    }

    async getProductionStats(tenantId: string): Promise<IProductionStats> {
        const result = await this.db
            .select({
                status: productionLogs.status,
                count: count()
            })
            .from(productionLogs)
            .groupBy(productionLogs.status);

        const stats: IProductionStats = {
            active: 0,
            completed: 0,
            paused: 0
        };

        for (const row of result) {
            if (row.status === 'STARTED') {
                stats.active += row.count;
            } else if (row.status === 'COMPLETED') {
                stats.completed += row.count;
            } else if (row.status === 'PAUSED' || row.status === 'CANCELLED') {
                stats.paused += row.count;
            }
        }

        return stats;
    }

    // ==================== HELPERS ====================

    private calculateProgress(production: { actualTime?: number | null }): number {
        // Simplified progress calculation
        // In real implementation, this would be based on completed pieces
        return 0;
    }

    private getAlertLevel(quantity: number): 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK' {
        if (quantity <= 0) return 'OUT_OF_STOCK';
        if (quantity < 5) return 'CRITICAL';
        return 'WARNING';
    }
}
