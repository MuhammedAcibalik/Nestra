/**
 * Scenario Controller
 * Following SRP - Handles only scenario-related HTTP endpoints
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IOptimizationService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
export declare class ScenarioController {
    private readonly optimizationService;
    router: Router;
    constructor(optimizationService: IOptimizationService);
    private initializeRoutes;
    /**
     * @openapi
     * /optimization/scenarios:
     *   get:
     *     tags: [Optimization]
     *     summary: Optimizasyon senaryolarını listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: cuttingJobId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: status
     *         in: query
     *         schema:
     *           type: string
     *           enum: [DRAFT, RUNNING, COMPLETED, FAILED]
     *     responses:
     *       200:
     *         description: Senaryo listesi
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    getScenarios(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /optimization/scenarios/{id}:
     *   get:
     *     tags: [Optimization]
     *     summary: Senaryo detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Senaryo detayı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    getScenarioById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /optimization/scenarios:
     *   post:
     *     tags: [Optimization]
     *     summary: Yeni optimizasyon senaryosu oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateScenarioRequest'
     *     responses:
     *       201:
     *         description: Senaryo oluşturuldu
     *       400:
     *         description: Geçersiz istek
     */
    createScenario(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * @openapi
     * /optimization/scenarios/{id}/run:
     *   post:
     *     tags: [Optimization]
     *     summary: Optimizasyonu çalıştır
     *     description: Senaryoyu çalıştırarak kesim planları üretir
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Optimizasyon tamamlandı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    runOptimization(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createScenarioController(optimizationService: IOptimizationService): ScenarioController;
//# sourceMappingURL=scenario.controller.d.ts.map