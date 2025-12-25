"use strict";
/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics
 * @openapi
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: integer
 *         pendingOrders:
 *           type: integer
 *         completedJobs:
 *           type: integer
 *         activeJobs:
 *           type: integer
 *         averageEfficiency:
 *           type: number
 *         totalWaste:
 *           type: number
 *     Activity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ORDER, JOB, PRODUCTION, STOCK]
 *         message:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *     WasteAnalytics:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               waste:
 *                 type: number
 *               efficiency:
 *                 type: number
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
        this.router.get('/stats', this.getStats.bind(this));
        this.router.get('/activity', this.getRecentActivity.bind(this));
        this.router.get('/waste-analytics', this.getWasteAnalytics.bind(this));
        this.router.get('/material-usage', this.getMaterialUsage.bind(this));
    }
    /**
     * @openapi
     * /dashboard/stats:
     *   get:
     *     tags: [Dashboard]
     *     summary: Genel istatistikleri getir
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Dashboard istatistikleri
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/DashboardStats'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /dashboard/activity:
     *   get:
     *     tags: [Dashboard]
     *     summary: Son aktiviteleri getir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: limit
     *         in: query
     *         schema:
     *           type: integer
     *           default: 10
     *           maximum: 50
     *     responses:
     *       200:
     *         description: Son aktiviteler
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Activity'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /dashboard/waste-analytics:
     *   get:
     *     tags: [Dashboard]
     *     summary: Fire analizi getir
     *     description: Belirli gün sayısı için fire ve verimlilik trend verilerini döner
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: days
     *         in: query
     *         schema:
     *           type: integer
     *           default: 30
     *           maximum: 365
     *     responses:
     *       200:
     *         description: Fire analizi
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/WasteAnalytics'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /dashboard/material-usage:
     *   get:
     *     tags: [Dashboard]
     *     summary: Malzeme kullanım istatistikleri
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Malzeme kullanım verileri
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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