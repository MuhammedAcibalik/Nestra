/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics
 * Refactored to use proper service injection
 */
import { Router } from 'express';
import { IDashboardService } from './dashboard.service';
export interface IDashboardController {
    readonly router: Router;
}
export declare class DashboardController implements IDashboardController {
    private readonly dashboardService;
    readonly router: Router;
    constructor(dashboardService: IDashboardService);
    private initializeRoutes;
    private getStats;
    private getRecentActivity;
    private getWasteAnalytics;
    private getMaterialUsage;
}
//# sourceMappingURL=dashboard.controller.d.ts.map