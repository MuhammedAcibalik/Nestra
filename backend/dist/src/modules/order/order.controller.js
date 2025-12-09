"use strict";
/**
 * Order Controller
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
exports.createOrderController = createOrderController;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
class OrderController {
    orderService;
    router;
    constructor(orderService) {
        this.orderService = orderService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/:id/items', this.addItem.bind(this));
        this.router.post('/import', upload.single('file'), this.importFromFile.bind(this));
    }
    async getAll(req, res, next) {
        try {
            const filter = {
                status: req.query.status,
                customerId: req.query.customerId,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
            };
            const result = await this.orderService.getOrders(filter);
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
            const result = await this.orderService.getOrderById(req.params.id);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'ORDER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const result = await this.orderService.createOrder(req.body, req.user.userId);
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
            const result = await this.orderService.updateOrder(req.params.id, req.body);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'ORDER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const result = await this.orderService.deleteOrder(req.params.id);
            if (result.success) {
                res.json({ success: true, message: 'Sipariş silindi' });
            }
            else {
                const status = result.error?.code === 'ORDER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async addItem(req, res, next) {
        try {
            const result = await this.orderService.addOrderItem(req.params.id, req.body);
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
    async importFromFile(req, res, next) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: { code: 'NO_FILE', message: 'Dosya yüklenmedi' }
                });
                return;
            }
            const mapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : {};
            const result = await this.orderService.importFromFile(req.file.buffer, mapping, req.user.userId);
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
}
exports.OrderController = OrderController;
function createOrderController(orderService) {
    return new OrderController(orderService);
}
//# sourceMappingURL=order.controller.js.map