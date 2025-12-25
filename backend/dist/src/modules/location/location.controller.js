"use strict";
/**
 * Location Controller
 * Following SRP - Only handles HTTP request/response
 * @openapi
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Ana Depo
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateLocationRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         isActive:
 *           type: boolean
 *           default: true
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
    /**
     * @openapi
     * /locations:
     *   get:
     *     tags: [Locations]
     *     summary: Lokasyonları listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: search
     *         in: query
     *         schema:
     *           type: string
     *         description: İsim ile arama
     *     responses:
     *       200:
     *         description: Lokasyon listesi
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Location'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /locations/{id}:
     *   get:
     *     tags: [Locations]
     *     summary: Lokasyon detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Lokasyon detayı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /locations:
     *   post:
     *     tags: [Locations]
     *     summary: Yeni lokasyon oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateLocationRequest'
     *     responses:
     *       201:
     *         description: Lokasyon oluşturuldu
     *       409:
     *         description: İsim zaten kullanımda
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /locations/{id}:
     *   put:
     *     tags: [Locations]
     *     summary: Lokasyon güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateLocationRequest'
     *     responses:
     *       200:
     *         description: Lokasyon güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /locations/{id}:
     *   delete:
     *     tags: [Locations]
     *     summary: Lokasyon sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       204:
     *         description: Lokasyon silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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