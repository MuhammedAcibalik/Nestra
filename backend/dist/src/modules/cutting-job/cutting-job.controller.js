"use strict";
/**
 * CuttingJob Controller
 * Following SRP - Only handles HTTP request/response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobController = void 0;
const express_1 = require("express");
const validation_1 = require("../../core/validation");
const schemas_1 = require("../../core/validation/schemas");
class CuttingJobController {
    service;
    router;
    constructor(service) {
        this.service = service;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /api/cutting-jobs - List all jobs
        this.router.get('/', this.getJobs.bind(this));
        // GET /api/cutting-jobs/:id - Get single job
        this.router.get('/:id', (0, validation_1.validateId)(), this.getJobById.bind(this));
        // POST /api/cutting-jobs - Create new job
        this.router.post('/', (0, validation_1.validate)(schemas_1.createCuttingJobSchema), this.createJob.bind(this));
        // POST /api/cutting-jobs/auto-generate - Auto-generate jobs from confirmed orders
        this.router.post('/auto-generate', this.autoGenerate.bind(this));
        // PATCH /api/cutting-jobs/:id/status - Update job status
        this.router.patch('/:id/status', (0, validation_1.validateId)(), (0, validation_1.validate)(schemas_1.updateCuttingJobStatusSchema), this.updateStatus.bind(this));
        // POST /api/cutting-jobs/:id/items - Add item to job
        this.router.post('/:id/items', (0, validation_1.validateId)(), (0, validation_1.validate)(schemas_1.addJobItemSchema), this.addItem.bind(this));
        // DELETE /api/cutting-jobs/:id/items/:orderItemId - Remove item from job
        this.router.delete('/:id/items/:orderItemId', (0, validation_1.validateId)(), this.removeItem.bind(this));
        // DELETE /api/cutting-jobs/:id - Delete job
        this.router.delete('/:id', (0, validation_1.validateId)(), this.deleteJob.bind(this));
    }
    async getJobs(req, res) {
        const filter = {
            status: req.query.status,
            materialTypeId: req.query.materialTypeId,
            thickness: req.query.thickness ? Number.parseFloat(req.query.thickness) : undefined
        };
        const result = await this.service.getJobs(filter);
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }
    async getJobById(req, res) {
        const { id } = req.params;
        const result = await this.service.getJobById(id);
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 500;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
    async createJob(req, res) {
        // Body is already validated by middleware
        const data = req.body;
        const result = await this.service.createJob(data);
        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }
    async autoGenerate(req, res) {
        const confirmedOnly = req.body.confirmedOnly !== false;
        const result = await this.service.autoGenerateFromOrders(confirmedOnly);
        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }
    async updateStatus(req, res) {
        const { id } = req.params;
        // Body is already validated by middleware
        const { status } = req.body;
        const result = await this.service.updateJobStatus(id, status);
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
    async addItem(req, res) {
        const { id } = req.params;
        // Body is already validated by middleware
        const { orderItemId, quantity } = req.body;
        const result = await this.service.addItemToJob(id, orderItemId, quantity);
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
    async removeItem(req, res) {
        const { id, orderItemId } = req.params;
        const result = await this.service.removeItemFromJob(id, orderItemId);
        if (result.success) {
            res.status(204).send();
        }
        else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
    async deleteJob(req, res) {
        const { id } = req.params;
        const result = await this.service.deleteJob(id);
        if (result.success) {
            res.status(204).send();
        }
        else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
}
exports.CuttingJobController = CuttingJobController;
//# sourceMappingURL=cutting-job.controller.js.map