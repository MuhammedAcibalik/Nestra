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
export declare class ProductionController {
    private readonly productionService;
    router: Router;
    constructor(productionService: IProductionService);
    private initializeRoutes;
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
    getApprovedPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    getProductionLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    getLogById(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    startProduction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
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
    updateLog(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    completeProduction(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createProductionController(productionService: IProductionService): ProductionController;
//# sourceMappingURL=production.controller.d.ts.map