/**
 * Scenario Controller
 * Following SRP - Handles only scenario-related HTTP endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IOptimizationService } from '../../core/interfaces';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class ScenarioController {
    public router: Router;

    constructor(private readonly optimizationService: IOptimizationService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getScenarios.bind(this));
        this.router.get('/:id', this.getScenarioById.bind(this));
        this.router.post('/', this.createScenario.bind(this));
        this.router.post('/:id/run', this.runOptimization.bind(this));
    }

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
    public async getScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = {
                cuttingJobId: req.query.cuttingJobId as string,
                status: req.query.status as string
            };

            const result = await this.optimizationService.getScenarios(filter);

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
    public async getScenarioById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.getScenarioById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

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
    public async createScenario(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.createScenario(req.body, req.user!.userId);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

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
    public async runOptimization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.optimizationService.runOptimization(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createScenarioController(optimizationService: IOptimizationService): ScenarioController {
    return new ScenarioController(optimizationService);
}
