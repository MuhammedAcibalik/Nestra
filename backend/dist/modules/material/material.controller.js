"use strict";
/**
 * Material Controller
 * Following Single Responsibility Principle (SRP): Only handles HTTP concerns
 * Controller Layer - Thin controller, delegates to service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialController = void 0;
exports.createMaterialController = createMaterialController;
const express_1 = require("express");
class MaterialController {
    materialService;
    router;
    constructor(materialService) {
        this.materialService = materialService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/:id/thicknesses', this.addThickness.bind(this));
    }
    async getAll(_req, res, next) {
        try {
            const result = await this.materialService.getMaterials();
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
    async getById(req, res, next) {
        try {
            const result = await this.materialService.getMaterialById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const result = await this.materialService.createMaterial(req.body);
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
    async update(req, res, next) {
        try {
            const result = await this.materialService.updateMaterial(req.params.id, req.body);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await this.materialService.deleteMaterial(req.params.id);
            if (result.success) {
                res.json({ success: true, message: 'Malzeme silindi' });
            }
            else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async addThickness(req, res, next) {
        try {
            const result = await this.materialService.addThicknessRange(req.params.id, req.body);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MaterialController = MaterialController;
/**
 * Factory function to create material controller with dependencies
 */
function createMaterialController(materialService) {
    return new MaterialController(materialService);
}
//# sourceMappingURL=material.controller.js.map