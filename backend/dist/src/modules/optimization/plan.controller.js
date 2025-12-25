"use strict";
/**
 * Plan Controller
 * Following SRP - Handles only cutting plan-related HTTP endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
exports.createPlanController = createPlanController;
const express_1 = require("express");
class PlanController {
    optimizationService;
    router;
    constructor(optimizationService) {
        this.optimizationService = optimizationService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getPlans.bind(this));
        this.router.get('/:id', this.getPlanById.bind(this));
        this.router.post('/:id/approve', this.approvePlan.bind(this));
        this.router.post('/compare', this.comparePlans.bind(this));
    }
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
    async getPlans(req, res, next) {
        try {
            const filter = {
                scenarioId: req.query.scenarioId,
                status: req.query.status
            };
            const result = await this.optimizationService.getPlans(filter);
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
    async getPlanById(req, res, next) {
        try {
            const result = await this.optimizationService.getPlanById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
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
    async approvePlan(req, res, next) {
        try {
            const { machineId } = req.body;
            const result = await this.optimizationService.approvePlan(req.params.id, req.user.userId, machineId);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'PLAN_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
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
    async comparePlans(req, res, next) {
        try {
            const { planIds } = req.body;
            const result = await this.optimizationService.comparePlans(planIds);
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
}
exports.PlanController = PlanController;
function createPlanController(optimizationService) {
    return new PlanController(optimizationService);
}
//# sourceMappingURL=plan.controller.js.map