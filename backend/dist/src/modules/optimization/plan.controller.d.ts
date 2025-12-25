/**
 * Plan Controller
 * Following SRP - Handles only cutting plan-related HTTP endpoints
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IOptimizationService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
export declare class PlanController {
    private readonly optimizationService;
    router: Router;
    constructor(optimizationService: IOptimizationService);
    private initializeRoutes;
    /**
     * @openapi
     * /optimization/plans:
     *   get:
     *     tags: [Optimization]
     *     summary: Kesim planlarını listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: scenarioId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: status
     *         in: query
     *         schema:
     *           type: string
     *           enum: [DRAFT, APPROVED, IN_PRODUCTION, COMPLETED]
     *     responses:
     *       200:
     *         description: Plan listesi
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /optimization/plans/{id}:
     *   get:
     *     tags: [Optimization]
     *     summary: Plan detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Plan detayı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    getPlanById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /optimization/plans/{id}/approve:
     *   post:
     *     tags: [Optimization]
     *     summary: Planı onayla
     *     description: Kesim planını onaylayarak üretime gönderir
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
     *               machineId:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       200:
     *         description: Plan onaylandı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    approvePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /optimization/plans/compare:
     *   post:
     *     tags: [Optimization]
     *     summary: Planları karşılaştır
     *     description: Birden fazla kesim planını verimlilik, fire vb. açısından karşılaştırır
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - planIds
     *             properties:
     *               planIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: uuid
     *                 minItems: 2
     *     responses:
     *       200:
     *         description: Karşılaştırma sonucu
     */
    comparePlans(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createPlanController(optimizationService: IOptimizationService): PlanController;
//# sourceMappingURL=plan.controller.d.ts.map