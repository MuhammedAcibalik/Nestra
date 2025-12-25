/**
 * Dashboard Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { stockItems, orders, cuttingJobs, cuttingPlans, materialTypes } from '../../db/schema';
import { sql, eq, desc, gte, and } from 'drizzle-orm';

// ==================== INTERFACES ====================

export interface IOrderStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
}

export interface IJobStats {
    total: number;
    pending: number;
    optimizing: number;
    completed: number;
}

export interface IStockStats {
    totalItems: number;
    lowStockItems: number;
    totalValue: number;
}

export interface IProductionStats {
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    avgWastePercentage: number;
}

export interface IRecentOrder {
    id: string;
    orderNumber: string;
    status: string;
    updatedAt: Date;
}

export interface IRecentJob {
    id: string;
    jobNumber: string;
    status: string;
    updatedAt: Date;
}

export interface ICompletedPlan {
    id: string;
    totalWaste: number;
    wastePercentage: number;
    createdAt: Date;
}

export interface IJobWithMaterials {
    materialTypeId: string;
    scenarios: Array<{
        results: Array<{
            wastePercentage: number;
        }>;
    }>;
}

export interface IDashboardRepository {
    getOrderStats(): Promise<IOrderStats>;
    getJobStats(): Promise<IJobStats>;
    getStockStats(): Promise<IStockStats>;
    getProductionStats(): Promise<IProductionStats>;
    getRecentOrders(limit: number): Promise<IRecentOrder[]>;
    getRecentJobs(limit: number): Promise<IRecentJob[]>;
    getCompletedPlansInPeriod(startDate: Date): Promise<ICompletedPlan[]>;
    getCompletedJobsWithMaterials(): Promise<IJobWithMaterials[]>;
    getAllMaterialTypes(): Promise<Array<{ id: string; name: string }>>;
}

// ==================== REPOSITORY ====================

export class DashboardRepository implements IDashboardRepository {
    constructor(private readonly db: Database) {}

    async getOrderStats(): Promise<IOrderStats> {
        const [stats] = await this.db
            .select({
                total: sql<number>`count(*)`,
                pending: sql<number>`sum(case when ${orders.status} in ('DRAFT', 'CONFIRMED') then 1 else 0 end)`,
                inProgress: sql<number>`sum(case when ${orders.status} in ('IN_PLANNING', 'IN_PRODUCTION') then 1 else 0 end)`,
                completed: sql<number>`sum(case when ${orders.status} = 'COMPLETED' then 1 else 0 end)`
            })
            .from(orders);

        return {
            total: Number(stats?.total ?? 0),
            pending: Number(stats?.pending ?? 0),
            inProgress: Number(stats?.inProgress ?? 0),
            completed: Number(stats?.completed ?? 0)
        };
    }

    async getJobStats(): Promise<IJobStats> {
        const [stats] = await this.db
            .select({
                total: sql<number>`count(*)`,
                pending: sql<number>`sum(case when ${cuttingJobs.status} = 'PENDING' then 1 else 0 end)`,
                optimizing: sql<number>`sum(case when ${cuttingJobs.status} = 'OPTIMIZING' then 1 else 0 end)`,
                completed: sql<number>`sum(case when ${cuttingJobs.status} = 'COMPLETED' then 1 else 0 end)`
            })
            .from(cuttingJobs);

        return {
            total: Number(stats?.total ?? 0),
            pending: Number(stats?.pending ?? 0),
            optimizing: Number(stats?.optimizing ?? 0),
            completed: Number(stats?.completed ?? 0)
        };
    }

    async getStockStats(): Promise<IStockStats> {
        const [stats] = await this.db
            .select({
                totalItems: sql<number>`count(*)`,
                lowStockItems: sql<number>`sum(case when ${stockItems.quantity} < 10 then 1 else 0 end)`,
                totalValue: sql<number>`coalesce(sum(${stockItems.quantity} * ${stockItems.unitPrice}), 0)`
            })
            .from(stockItems);

        return {
            totalItems: Number(stats?.totalItems ?? 0),
            lowStockItems: Number(stats?.lowStockItems ?? 0),
            totalValue: Number(stats?.totalValue ?? 0)
        };
    }

    async getProductionStats(): Promise<IProductionStats> {
        const [planStats] = await this.db
            .select({
                totalPlans: sql<number>`count(*)`,
                activePlans: sql<number>`sum(case when ${cuttingPlans.status} in ('APPROVED', 'IN_PRODUCTION') then 1 else 0 end)`,
                completedPlans: sql<number>`sum(case when ${cuttingPlans.status} = 'COMPLETED' then 1 else 0 end)`,
                avgWastePercentage: sql<number>`coalesce(avg(${cuttingPlans.wastePercentage}), 0)`
            })
            .from(cuttingPlans);

        return {
            totalPlans: Number(planStats?.totalPlans ?? 0),
            activePlans: Number(planStats?.activePlans ?? 0),
            completedPlans: Number(planStats?.completedPlans ?? 0),
            avgWastePercentage: Number(planStats?.avgWastePercentage ?? 0)
        };
    }

    async getRecentOrders(limit = 10): Promise<IRecentOrder[]> {
        const result = await this.db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                status: orders.status,
                updatedAt: orders.updatedAt
            })
            .from(orders)
            .orderBy(desc(orders.updatedAt))
            .limit(limit);

        return result.map((r) => ({
            id: r.id,
            orderNumber: r.orderNumber,
            status: r.status,
            updatedAt: r.updatedAt
        }));
    }

    async getRecentJobs(limit = 10): Promise<IRecentJob[]> {
        const result = await this.db
            .select({
                id: cuttingJobs.id,
                jobNumber: cuttingJobs.jobNumber,
                status: cuttingJobs.status,
                updatedAt: cuttingJobs.updatedAt
            })
            .from(cuttingJobs)
            .orderBy(desc(cuttingJobs.updatedAt))
            .limit(limit);

        return result.map((r) => ({
            id: r.id,
            jobNumber: String(r.jobNumber),
            status: r.status,
            updatedAt: r.updatedAt
        }));
    }

    async getCompletedPlansInPeriod(startDate: Date): Promise<ICompletedPlan[]> {
        const result = await this.db
            .select({
                id: cuttingPlans.id,
                totalWaste: cuttingPlans.totalWaste,
                wastePercentage: cuttingPlans.wastePercentage,
                createdAt: cuttingPlans.createdAt
            })
            .from(cuttingPlans)
            .where(and(eq(cuttingPlans.status, 'COMPLETED'), gte(cuttingPlans.createdAt, startDate)))
            .orderBy(desc(cuttingPlans.createdAt));

        return result;
    }

    async getCompletedJobsWithMaterials(): Promise<IJobWithMaterials[]> {
        const jobs = await this.db.query.cuttingJobs.findMany({
            where: eq(cuttingJobs.status, 'COMPLETED'),
            with: {
                items: true
            }
        });

        // Scenarios relation not on cuttingJobs - return simplified data
        return jobs.map((job) => ({
            materialTypeId: job.materialTypeId,
            scenarios: []
        }));
    }

    async getAllMaterialTypes(): Promise<Array<{ id: string; name: string }>> {
        return this.db
            .select({
                id: materialTypes.id,
                name: materialTypes.name
            })
            .from(materialTypes);
    }
}
