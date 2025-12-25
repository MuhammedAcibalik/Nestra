/**
 * Report Controller
 * Following SRP - Only handles HTTP concerns
 * @openapi
 * components:
 *   schemas:
 *     WasteReport:
 *       type: object
 *       properties:
 *         totalWaste:
 *           type: number
 *         wastePercentage:
 *           type: number
 *         byMaterial:
 *           type: array
 *           items:
 *             type: object
 *         trend:
 *           type: array
 *           items:
 *             type: object
 *     EfficiencyReport:
 *       type: object
 *       properties:
 *         averageEfficiency:
 *           type: number
 *         byMachine:
 *           type: array
 *           items:
 *             type: object
 *         trend:
 *           type: array
 *           items:
 *             type: object
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IReportService } from '../../core/interfaces';
export declare class ReportController {
    private readonly reportService;
    router: Router;
    constructor(reportService: IReportService);
    private initializeRoutes;
    private parseFilter;
    /**
     * @openapi
     * /reports/waste:
     *   get:
     *     tags: [Reports]
     *     summary: Fire raporu
     *     description: Malzeme fire istatistiklerini getirir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: startDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: endDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: materialTypeId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: groupBy
     *         in: query
     *         schema:
     *           type: string
     *           enum: [day, week, month]
     *           default: month
     *     responses:
     *       200:
     *         description: Fire raporu
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/WasteReport'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getWasteReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /reports/efficiency:
     *   get:
     *     tags: [Reports]
     *     summary: Verimlilik raporu
     *     description: Kesim verimlilik istatistiklerini getirir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: startDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: endDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: machineId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: groupBy
     *         in: query
     *         schema:
     *           type: string
     *           enum: [day, week, month]
     *           default: month
     *     responses:
     *       200:
     *         description: Verimlilik raporu
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/EfficiencyReport'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getEfficiencyReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /reports/customers:
     *   get:
     *     tags: [Reports]
     *     summary: Müşteri raporu
     *     description: Müşteri bazlı sipariş ve üretim istatistiklerini getirir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: startDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: endDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: customerId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Müşteri raporu
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getCustomerReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /reports/machines:
     *   get:
     *     tags: [Reports]
     *     summary: Makine raporu
     *     description: Makine bazlı üretim ve verimlilik istatistiklerini getirir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: startDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: endDate
     *         in: query
     *         schema:
     *           type: string
     *           format: date
     *       - name: machineId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Makine raporu
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getMachineReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createReportController(reportService: IReportService): ReportController;
//# sourceMappingURL=report.controller.d.ts.map