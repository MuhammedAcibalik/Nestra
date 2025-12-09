"use strict";
/**
 * Customer Controller
 * Following SRP - Only handles HTTP request/response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const express_1 = require("express");
class CustomerController {
    customerService;
    router;
    constructor(customerService) {
        this.customerService = customerService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getCustomers.bind(this));
        this.router.get('/:id', this.getCustomerById.bind(this));
        this.router.post('/', this.createCustomer.bind(this));
        this.router.put('/:id', this.updateCustomer.bind(this));
        this.router.delete('/:id', this.deleteCustomer.bind(this));
    }
    async getCustomers(req, res) {
        const filter = {
            search: req.query.search
        };
        const result = await this.customerService.getCustomers(filter);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
    async getCustomerById(req, res) {
        const { id } = req.params;
        const result = await this.customerService.getCustomerById(id);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'CUSTOMER_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async createCustomer(req, res) {
        const result = await this.customerService.createCustomer(req.body);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'DUPLICATE_CODE' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async updateCustomer(req, res) {
        const { id } = req.params;
        const result = await this.customerService.updateCustomer(id, req.body);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'CUSTOMER_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async deleteCustomer(req, res) {
        const { id } = req.params;
        const result = await this.customerService.deleteCustomer(id);
        if (result.success) {
            res.status(204).send();
        }
        else {
            const status = result.error?.code === 'CUSTOMER_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map