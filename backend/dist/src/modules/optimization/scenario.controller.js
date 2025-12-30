"use strict";
/**
 * Scenario Controller
 * Following SRP - Handles only scenario-related HTTP endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioController = void 0;
exports.createScenarioController = createScenarioController;
const express_1 = require("express");
const middleware_1 = require("../../core/validation/middleware");
const schemas_1 = require("../../core/validation/schemas");
class ScenarioController {
    optimizationService;
    router;
    constructor(optimizationService) {
        this.optimizationService = optimizationService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getScenarios.bind(this));
        this.router.get('/:id', (0, middleware_1.validateId)(), this.getScenarioById.bind(this));
        this.router.post('/', (0, middleware_1.validate)(schemas_1.createScenarioSchema), this.createScenario.bind(this));
        this.router.post('/:id/run', (0, middleware_1.validateId)(), this.runOptimization.bind(this));
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
    async getScenarios(req, res, next) {
        try {
            const filter = {
                cuttingJobId: req.query.cuttingJobId,
                status: req.query.status
            };
            const result = await this.optimizationService.getScenarios(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
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
    async getScenarioById(req, res, next) {
        try {
            const result = await this.optimizationService.getScenarioById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
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
    async createScenario(req, res, next) {
        try {
            const result = await this.optimizationService.createScenario(req.body, req.user.userId);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
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
    async runOptimization(req, res, next) {
        try {
            const result = await this.optimizationService.runOptimization(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'SCENARIO_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ScenarioController = ScenarioController;
function createScenarioController(optimizationService) {
    return new ScenarioController(optimizationService);
}
//# sourceMappingURL=scenario.controller.js.map