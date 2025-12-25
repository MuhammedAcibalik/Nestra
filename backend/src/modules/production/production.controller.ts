/**
 * Production Controller
 * Following SRP - Only handles HTTP concerns
 * @openapi
 * components:
 *   schemas:
 *     ProductionLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         planId:
 *           type: string
 *           format: uuid
 *         operatorId:
 *           type: string
 *           format: uuid
 *         operatorName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [IN_PROGRESS, COMPLETED, CANCELLED]
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         producedPieces:
 *           type: integer
 *         scrapPieces:
 *           type: integer
 *         notes:
 *           type: string
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IProductionService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class ProductionController {
    public router: Router;

    constructor(private readonly productionService: IProductionService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/plans', this.getApprovedPlans.bind(this));
        this.router.get('/logs', this.getProductionLogs.bind(this));
        this.router.get('/logs/:id', this.getLogById.bind(this));
        this.router.post('/start/:planId', this.startProduction.bind(this));
        this.router.put('/logs/:id', this.updateLog.bind(this));
        this.router.post('/logs/:id/complete', this.completeProduction.bind(this));
    }

    /**
     * @openapi
     * /production/plans:
     *   get:
     *     tags: [Production]
     *     summary: Onaylanmış planları listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: status
     *         in: query
     *         schema:
     *           type: string
     *       - name: machineId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Plan listesi
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    public async getApprovedPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                status: req.query.status as string,
                machineId: req.query.machineId as string
            };

            const result = await this.productionService.getApprovedPlans(filter);

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
     * /production/logs:
     *   get:
     *     tags: [Production]
     *     summary: Üretim kayıtlarını listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: status
     *         in: query
     *         schema:
     *           type: string
     *           enum: [IN_PROGRESS, COMPLETED, CANCELLED]
     *       - name: operatorId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
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
     *     responses:
     *       200:
     *         description: Üretim kayıtları
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
     *                     $ref: '#/components/schemas/ProductionLog'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    public async getProductionLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                status: req.query.status as string,
                operatorId: req.query.operatorId as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
            };

            const result = await this.productionService.getProductionLogs(filter);

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
     * /production/logs/{id}:
     *   get:
     *     tags: [Production]
     *     summary: Üretim kaydı detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Üretim kaydı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    public async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const logs = await this.productionService.getProductionLogs({});
            const log = logs.data?.find((l) => l.id === req.params.id);

            if (log) {
                res.json({ success: true, data: log });
            } else {
                res.status(404).json({
                    success: false,
                    error: { code: 'LOG_NOT_FOUND', message: 'Üretim kaydı bulunamadı' }
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * @openapi
     * /production/start/{planId}:
     *   post:
     *     tags: [Production]
     *     summary: Üretimi başlat
     *     description: Onaylanmış bir plan için üretimi başlatır
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: planId
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       201:
     *         description: Üretim başlatıldı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    public async startProduction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.productionService.startProduction(req.params.planId, req.user!.userId);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * @openapi
     * /production/logs/{id}:
     *   put:
     *     tags: [Production]
     *     summary: Üretim kaydını güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               producedPieces:
     *                 type: integer
     *               scrapPieces:
     *                 type: integer
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Kayıt güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    public async updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.productionService.updateProductionLog(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'LOG_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * @openapi
     * /production/logs/{id}/complete:
     *   post:
     *     tags: [Production]
     *     summary: Üretimi tamamla
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               producedPieces:
     *                 type: integer
     *               scrapPieces:
     *                 type: integer
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Üretim tamamlandı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    public async completeProduction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.productionService.completeProduction(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'LOG_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createProductionController(productionService: IProductionService): ProductionController {
    return new ProductionController(productionService);
}
