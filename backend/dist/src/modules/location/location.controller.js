"use strict";
/**
 * Location Controller
 * Following SRP - Only handles HTTP request/response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const express_1 = require("express");
class LocationController {
    locationService;
    router;
    constructor(locationService) {
        this.locationService = locationService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getLocations.bind(this));
        this.router.get('/:id', this.getLocationById.bind(this));
        this.router.post('/', this.createLocation.bind(this));
        this.router.put('/:id', this.updateLocation.bind(this));
        this.router.delete('/:id', this.deleteLocation.bind(this));
    }
    async getLocations(req, res) {
        const filter = {
            search: req.query.search
        };
        const result = await this.locationService.getLocations(filter);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
    async getLocationById(req, res) {
        const { id } = req.params;
        const result = await this.locationService.getLocationById(id);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'LOCATION_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async createLocation(req, res) {
        const result = await this.locationService.createLocation(req.body);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'DUPLICATE_NAME' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async updateLocation(req, res) {
        const { id } = req.params;
        const result = await this.locationService.updateLocation(id, req.body);
        if (result.success) {
            res.json({ success: true, data: result.data });
        }
        else {
            const status = result.error?.code === 'LOCATION_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
    async deleteLocation(req, res) {
        const { id } = req.params;
        const result = await this.locationService.deleteLocation(id);
        if (result.success) {
            res.status(204).send();
        }
        else {
            const status = result.error?.code === 'LOCATION_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
}
exports.LocationController = LocationController;
//# sourceMappingURL=location.controller.js.map