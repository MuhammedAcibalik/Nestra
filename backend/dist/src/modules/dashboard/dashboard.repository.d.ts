/**
 * Dashboard Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
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
    getAllMaterialTypes(): Promise<Array<{
        id: string;
        name: string;
    }>>;
}
export declare class DashboardRepository implements IDashboardRepository {
    private readonly db;
    constructor(db: Database);
    getOrderStats(): Promise<IOrderStats>;
    getJobStats(): Promise<IJobStats>;
    getStockStats(): Promise<IStockStats>;
    getProductionStats(): Promise<IProductionStats>;
    getRecentOrders(limit?: number): Promise<IRecentOrder[]>;
    getRecentJobs(limit?: number): Promise<IRecentJob[]>;
    getCompletedPlansInPeriod(startDate: Date): Promise<ICompletedPlan[]>;
    getCompletedJobsWithMaterials(): Promise<IJobWithMaterials[]>;
    getAllMaterialTypes(): Promise<Array<{
        id: string;
        name: string;
    }>>;
}
//# sourceMappingURL=dashboard.repository.d.ts.map