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
    private getStats;
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
    private getRecentActivity;
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
    private getWasteAnalytics;
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
    private getMaterialUsage;
}
//# sourceMappingURL=dashboard.controller.d.ts.map