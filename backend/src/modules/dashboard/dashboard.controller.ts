/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics
 */

import { Router, Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
    public readonly router: Router;
    private readonly dashboardService: DashboardService;

    constructor(private readonly prisma: import('@prisma/client').PrismaClient) {
        this.router = Router();
        this.dashboardService = new DashboardService(prisma);
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
