/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics
 */
import { Router } from 'express';
export declare class DashboardController {
    private readonly prisma;
    readonly router: Router;
    private readonly dashboardService;
    constructor(prisma: import('@prisma/client').PrismaClient);
    private initializeRoutes;
    private getStats;
    private getRecentActivity;
    private getWasteAnalytics;
    private getMaterialUsage;
}
//# sourceMappingURL=dashboard.controller.d.ts.map