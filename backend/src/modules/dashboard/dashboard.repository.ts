/**
 * Dashboard Repository
 * Handles data access for dashboard analytics
 * Following SRP - Only handles dashboard-related data queries
 */

import { PrismaClient } from '@prisma/client';

// ==================== INTERFACES ====================

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

// ==================== REPOSITORY ====================

export class DashboardRepository implements IDashboardRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async getOrderStats(): Promise<IOrderStats> {
        const [total, pending, inProduction, completed] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'DRAFT' } }),
            this.prisma.order.count({ where: { status: 'IN_PRODUCTION' } }),
            this.prisma.order.count({ where: { status: 'COMPLETED' } })
        ]);

        return { total, pending, inProduction, completed };
    }

    async getJobStats(): Promise<IJobStats> {
        const [total, pending, optimizing, inProduction] = await Promise.all([
            this.prisma.cuttingJob.count(),
            this.prisma.cuttingJob.count({ where: { status: 'PENDING' } }),
            this.prisma.cuttingJob.count({ where: { status: 'OPTIMIZING' } }),
            this.prisma.cuttingJob.count({ where: { status: 'IN_PRODUCTION' } })
        ]);

        return { total, pending, optimizing, inProduction };
    }

    async getStockStats(): Promise<IStockStats> {
        const stockItems = await this.prisma.stockItem.findMany({
            select: { quantity: true, unitPrice: true }
        });

        const totalItems = stockItems.length;
        const lowStockCount = stockItems.filter(s => s.quantity < 5).length;
        const totalValue = stockItems.reduce(
            (sum, s) => sum + (s.quantity * (s.unitPrice ?? 0)),
            0
        );

        return { totalItems, lowStockCount, totalValue };
    }

    async getProductionStats(): Promise<IProductionStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [activePlans, completedToday, averageWaste] = await Promise.all([
            this.prisma.cuttingPlan.count({ where: { status: 'IN_PRODUCTION' } }),
            this.prisma.cuttingPlan.count({
                where: {
                    status: 'COMPLETED',
                    updatedAt: { gte: today }
                }
            }),
            this.prisma.cuttingPlan.aggregate({
                _avg: { wastePercentage: true },
                where: { status: 'COMPLETED' }
            })
        ]);

        return {
            activePlans,
            completedToday,
            averageWastePercentage: averageWaste._avg.wastePercentage ?? 0
        };
    }

    async getRecentOrders(limit: number): Promise<IRecentOrder[]> {
        return this.prisma.order.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, orderNumber: true, status: true, updatedAt: true }
        });
    }

    async getRecentJobs(limit: number): Promise<IRecentJob[]> {
        return this.prisma.cuttingJob.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, jobNumber: true, status: true, updatedAt: true }
        });
    }

    async getCompletedPlansInPeriod(startDate: Date): Promise<IPlanWasteData[]> {
        return this.prisma.cuttingPlan.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                totalWaste: true,
                wastePercentage: true
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async getCompletedJobsWithMaterials(): Promise<IJobMaterialData[]> {
        const jobs = await this.prisma.cuttingJob.findMany({
            where: { status: 'COMPLETED' },
            include: {
                scenarios: {
                    include: {
                        results: {
                            select: { wastePercentage: true }
                        }
                    }
                }
            }
        });

        return jobs.map(job => ({
            materialTypeId: job.materialTypeId,
            scenarios: job.scenarios.map(s => ({
                results: s.results.map(r => ({ wastePercentage: r.wastePercentage }))
            }))
        }));
    }

    async getAllMaterialTypes(): Promise<IMaterialTypeData[]> {
        return this.prisma.materialType.findMany({
            select: { id: true, name: true }
        });
    }
}
