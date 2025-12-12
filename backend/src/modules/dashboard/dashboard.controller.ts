/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics
 * Refactored to use proper service injection
 */

import { Router, Request, Response } from 'express';
import { IDashboardService } from './dashboard.service';

// ==================== INTERFACES ====================

export interface IDashboardController {
    readonly router: Router;
}

// ==================== CONTROLLER ====================

export class DashboardController implements IDashboardController {
    public readonly router: Router;

    constructor(private readonly dashboardService: IDashboardService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // GET /api/dashboard/stats - Get overall dashboard statistics
        this.router.get('/stats', this.getStats.bind(this));

        // GET /api/dashboard/activity - Get recent activity
        this.router.get('/activity', this.getRecentActivity.bind(this));

        // GET /api/dashboard/waste-analytics - Get waste analytics over time
        this.router.get('/waste-analytics', this.getWasteAnalytics.bind(this));

        // GET /api/dashboard/material-usage - Get material usage statistics
        this.router.get('/material-usage', this.getMaterialUsage.bind(this));
    }

    private async getStats(_req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.dashboardService.getStats();
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'İstatistikler getirilirken hata' }
            });
        }
    }

    private async getRecentActivity(req: Request, res: Response): Promise<void> {
        try {
            const limit = Number.parseInt(req.query.limit as string, 10) || 10;
            const activity = await this.dashboardService.getRecentActivity(limit);
            res.json({ success: true, data: activity });
        } catch (error) {
            console.error('Dashboard activity error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'Aktiviteler getirilirken hata' }
            });
        }
    }

    private async getWasteAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const days = Number.parseInt(req.query.days as string, 10) || 30;
            const analytics = await this.dashboardService.getWasteAnalytics(days);
            res.json({ success: true, data: analytics });
        } catch (error) {
            console.error('Dashboard waste analytics error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'Fire analizi getirilirken hata' }
            });
        }
    }

    private async getMaterialUsage(_req: Request, res: Response): Promise<void> {
        try {
            const usage = await this.dashboardService.getMaterialUsage();
            res.json({ success: true, data: usage });
        } catch (error) {
            console.error('Dashboard material usage error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'Malzeme kullanımı getirilirken hata' }
            });
        }
    }
}
