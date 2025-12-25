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
import { IReportService, IReportFilter } from '../../core/interfaces';

export class ReportController {
    public router: Router;

    constructor(private readonly reportService: IReportService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/waste', this.getWasteReport.bind(this));
        this.router.get('/efficiency', this.getEfficiencyReport.bind(this));
        this.router.get('/customers', this.getCustomerReport.bind(this));
        this.router.get('/machines', this.getMachineReport.bind(this));
    }

    private parseFilter(req: Request): IReportFilter {
        return {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            materialTypeId: req.query.materialTypeId as string,
            customerId: req.query.customerId as string,
            machineId: req.query.machineId as string,
            groupBy: (req.query.groupBy as 'day' | 'week' | 'month') ?? 'month'
        };
    }

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
    public async getWasteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getWasteReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

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
    public async getEfficiencyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getEfficiencyReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

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
    public async getCustomerReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getCustomerReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

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
    public async getMachineReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getMachineReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createReportController(reportService: IReportService): ReportController {
    return new ReportController(reportService);
}
