/**
 * Dashboard Repository
 * Handles data access for dashboard analytics
 * Following SRP - Only handles dashboard-related data queries
 */
import { PrismaClient } from '@prisma/client';
export interface IOrderStats {
    total: number;
    pending: number;
    inProduction: number;
    completed: number;
}
export interface IJobStats {
    total: number;
    pending: number;
    optimizing: number;
    inProduction: number;
}
export interface IStockStats {
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
}
export interface IProductionStats {
    activePlans: number;
    completedToday: number;
    averageWastePercentage: number;
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
export interface IPlanWasteData {
    createdAt: Date;
    totalWaste: number;
    wastePercentage: number;
}
export interface IJobMaterialData {
    materialTypeId: string;
    scenarios: Array<{
        results: Array<{
            wastePercentage: number;
        }>;
    }>;
}
export interface IMaterialTypeData {
    id: string;
    name: string;
}
export interface IDashboardRepository {
    getOrderStats(): Promise<IOrderStats>;
    getJobStats(): Promise<IJobStats>;
    getStockStats(): Promise<IStockStats>;
    getProductionStats(): Promise<IProductionStats>;
    getRecentOrders(limit: number): Promise<IRecentOrder[]>;
    getRecentJobs(limit: number): Promise<IRecentJob[]>;
    getCompletedPlansInPeriod(startDate: Date): Promise<IPlanWasteData[]>;
    getCompletedJobsWithMaterials(): Promise<IJobMaterialData[]>;
    getAllMaterialTypes(): Promise<IMaterialTypeData[]>;
}
export declare class DashboardRepository implements IDashboardRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    getOrderStats(): Promise<IOrderStats>;
    getJobStats(): Promise<IJobStats>;
    getStockStats(): Promise<IStockStats>;
    getProductionStats(): Promise<IProductionStats>;
    getRecentOrders(limit: number): Promise<IRecentOrder[]>;
    getRecentJobs(limit: number): Promise<IRecentJob[]>;
    getCompletedPlansInPeriod(startDate: Date): Promise<IPlanWasteData[]>;
    getCompletedJobsWithMaterials(): Promise<IJobMaterialData[]>;
    getAllMaterialTypes(): Promise<IMaterialTypeData[]>;
}
//# sourceMappingURL=dashboard.repository.d.ts.map