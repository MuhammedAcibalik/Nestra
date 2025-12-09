"use strict";
/**
 * Machine Controller
 * Following SRP - Only handles HTTP request/response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineController = void 0;
const express_1 = require("express");
class MachineController {
    machineService;
    router;
    constructor(machineService) {
        this.machineService = machineService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /api/machines - Get all machines
        this.router.get('/', this.getMachines.bind(this));
        // GET /api/machines/compatible - Get compatible machines for material
        this.router.get('/compatible', this.getCompatibleMachines.bind(this));
        // GET /api/machines/:id - Get machine by ID
        this.router.get('/:id', this.getMachineById.bind(this));
        // POST /api/machines - Create new machine
        this.router.post('/', this.createMachine.bind(this));
        // PUT /api/machines/:id - Update machine
        this.router.put('/:id', this.updateMachine.bind(this));
        // DELETE /api/machines/:id - Delete machine
        this.router.delete('/:id', this.deleteMachine.bind(this));
        // POST /api/machines/:id/compatibility - Add compatibility
        this.router.post('/:id/compatibility', this.addCompatibility.bind(this));
        // DELETE /api/machines/:id/compatibility/:compatibilityId - Remove compatibility
        this.router.delete('/:id/compatibility/:compatibilityId', this.removeCompatibility.bind(this));
    }
    async getMachines(req, res) {
        let isActive;
        if (req.query.isActive === 'true') {
            isActive = true;
        }
        else if (req.query.isActive === 'false') {
            isActive = false;
        }
        const filter = {
            machineType: req.query.machineType,
            isActive,
            locationId: req.query.locationId
        };
        const result = await this.machineService.getMachines(filter);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
    async getMachineById(req, res) {
        const { id } = req.params;
        const result = await this.machineService.getMachineById(id);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async createMachine(req, res) {
        const result = await this.machineService.createMachine(req.body);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'DUPLICATE_CODE' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async updateMachine(req, res) {
        const { id } = req.params;
        const result = await this.machineService.updateMachine(id, req.body);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async deleteMachine(req, res) {
        const { id } = req.params;
        const result = await this.machineService.deleteMachine(id);
        if (result.success) {
            res.status(204).send();
        }
        else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async addCompatibility(req, res) {
        const { id } = req.params;
        const result = await this.machineService.addCompatibility(id, req.body);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async removeCompatibility(req, res) {
        const { compatibilityId } = req.params;
        const result = await this.machineService.removeCompatibility(compatibilityId);
        if (result.success) {
            res.status(204).send();
        }
        else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
    async getCompatibleMachines(req, res) {
        const { materialTypeId, thickness } = req.query;
        if (!materialTypeId || !thickness) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'materialTypeId ve thickness parametreleri zorunludur'
                }
            });
            return;
        }
        const result = await this.machineService.getCompatibleMachines(materialTypeId, Number.parseFloat(thickness));
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
}
exports.MachineController = MachineController;
//# sourceMappingURL=machine.controller.js.map