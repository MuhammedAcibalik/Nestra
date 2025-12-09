"use strict";
/**
 * Stock Controller
 * Following SRP - Only handles HTTP concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
exports.createStockController = createStockController;
const express_1 = require("express");
class StockController {
    stockService;
    router;
    constructor(stockService) {
        this.stockService = stockService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/movements', this.getMovements.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/movements', this.createMovement.bind(this));
    }
    async getAll(req, res, next) {
        try {
            const filter = {
                materialTypeId: req.query.materialTypeId,
                stockType: req.query.stockType,
                locationId: req.query.locationId,
                minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined
            };
            const result = await this.stockService.getStockItems(filter);
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
            const result = await this.stockService.getStockItemById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const result = await this.stockService.createStockItem(req.body);
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
            const result = await this.stockService.updateStockItem(req.params.id, req.body);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await this.stockService.deleteStockItem(req.params.id);
            if (result.success) {
                res.json({ success: true, message: 'Stok kalemi silindi' });
            }
            else {
                const status = result.error?.code === 'STOCK_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async createMovement(req, res, next) {
        try {
            const result = await this.stockService.createMovement(req.body);
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
    async getMovements(req, res, next) {
        try {
            const filter = {
                stockItemId: req.query.stockItemId,
                movementType: req.query.movementType,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const result = await this.stockService.getMovements(filter);
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
exports.StockController = StockController;
function createStockController(stockService) {
    return new StockController(stockService);
}
//# sourceMappingURL=stock.controller.js.map