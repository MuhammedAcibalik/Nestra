"use strict";
/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics
 * Refactored to use proper service injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const express_1 = require("express");
// ==================== CONTROLLER ====================
class DashboardController {
    dashboardService;
    router;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /api/dashboard/stats - Get overall dashboard statistics
        this.router.get('/stats', this.getStats.bind(this));
        // GET /api/dashboard/activity - Get recent activity
        this.router.get('/activity', this.getRecentActivity.bind(this));
        // GET /api/dashboard/waste-analytics - Get waste analytics over time
        this.router.get('/waste-analytics', this.getWasteAnalytics.bind(this));
        // GET /api/dashboard/material-usage - Get material usage statistics
        this.router.get('/material-usage', this.getMaterialUsage.bind(this));
    }
    async getStats(_req, res) {
        try {
            const stats = await this.dashboardService.getStats();
            res.json({ success: true, data: stats });
        }
        catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'İstatistikler getirilirken hata' }
            });
        }
    }
    async getRecentActivity(req, res) {
        try {
            const limit = Number.parseInt(req.query.limit, 10) || 10;
            const activity = await this.dashboardService.getRecentActivity(limit);
            res.json({ success: true, data: activity });
        }
        catch (error) {
            console.error('Dashboard activity error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'Aktiviteler getirilirken hata' }
            });
        }
    }
    async getWasteAnalytics(req, res) {
        try {
            const days = Number.parseInt(req.query.days, 10) || 30;
            const analytics = await this.dashboardService.getWasteAnalytics(days);
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            console.error('Dashboard waste analytics error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'Fire analizi getirilirken hata' }
            });
        }
    }
    async getMaterialUsage(_req, res) {
        try {
            const usage = await this.dashboardService.getMaterialUsage();
            res.json({ success: true, data: usage });
        }
        catch (error) {
            console.error('Dashboard material usage error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'DASHBOARD_ERROR', message: 'Malzeme kullanımı getirilirken hata' }
            });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map