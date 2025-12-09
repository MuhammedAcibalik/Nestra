"use strict";
/**
 * Production Controller
 * Following SRP - Only handles HTTP concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionController = void 0;
exports.createProductionController = createProductionController;
const express_1 = require("express");
class ProductionController {
    productionService;
    router;
    constructor(productionService) {
        this.productionService = productionService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/plans', this.getApprovedPlans.bind(this));
        this.router.get('/logs', this.getProductionLogs.bind(this));
        this.router.get('/logs/:id', this.getLogById.bind(this));
        this.router.post('/start/:planId', this.startProduction.bind(this));
        this.router.put('/logs/:id', this.updateLog.bind(this));
        this.router.post('/logs/:id/complete', this.completeProduction.bind(this));
    }
    async getApprovedPlans(req, res, next) {
        try {
            const filter = {
                status: req.query.status,
                machineId: req.query.machineId
            };
            const result = await this.productionService.getApprovedPlans(filter);
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
    async getProductionLogs(req, res, next) {
        try {
            const filter = {
                status: req.query.status,
                operatorId: req.query.operatorId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const result = await this.productionService.getProductionLogs(filter);
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
    async getLogById(req, res, next) {
        try {
            const logs = await this.productionService.getProductionLogs({});
            const log = logs.data?.find((l) => l.id === req.params.id);
            if (log) {
                res.json({ success: true, data: log });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: { code: 'LOG_NOT_FOUND', message: 'Üretim kaydı bulunamadı' }
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async startProduction(req, res, next) {
        try {
            const result = await this.productionService.startProduction(req.params.planId, req.user.userId);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
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
    async updateLog(req, res, next) {
        try {
            const result = await this.productionService.updateProductionLog(req.params.id, req.body);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'LOG_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async completeProduction(req, res, next) {
        try {
            const result = await this.productionService.completeProduction(req.params.id, req.body);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'LOG_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductionController = ProductionController;
function createProductionController(productionService) {
    return new ProductionController(productionService);
}
//# sourceMappingURL=production.controller.js.map