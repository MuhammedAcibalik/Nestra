"use strict";
/**
 * Machine Controller
 * Following SRP - Only handles HTTP request/response
 * @openapi
 * components:
 *   schemas:
 *     Machine:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: CNC-001
 *         name:
 *           type: string
 *         machineType:
 *           type: string
 *           enum: [CNC_ROUTER, LASER, PANEL_SAW, WATERJET, PLASMA]
 *         locationId:
 *           type: string
 *           format: uuid
 *         isActive:
 *           type: boolean
 *         specifications:
 *           type: object
 *         compatibilities:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateMachineRequest:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - machineType
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         machineType:
 *           type: string
 *           enum: [CNC_ROUTER, LASER, PANEL_SAW, WATERJET, PLASMA]
 *         locationId:
 *           type: string
 *           format: uuid
 *         isActive:
 *           type: boolean
 *           default: true
 *         specifications:
 *           type: object
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
        this.router.get('/', this.getMachines.bind(this));
        this.router.get('/compatible', this.getCompatibleMachines.bind(this));
        this.router.get('/:id', this.getMachineById.bind(this));
        this.router.post('/', this.createMachine.bind(this));
        this.router.put('/:id', this.updateMachine.bind(this));
        this.router.delete('/:id', this.deleteMachine.bind(this));
        this.router.post('/:id/compatibility', this.addCompatibility.bind(this));
        this.router.delete('/:id/compatibility/:compatibilityId', this.removeCompatibility.bind(this));
    }
    /**
     * @openapi
     * /machines:
     *   get:
     *     tags: [Machines]
     *     summary: Makineleri listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: machineType
     *         in: query
     *         schema:
     *           type: string
     *           enum: [CNC_ROUTER, LASER, PANEL_SAW, WATERJET, PLASMA]
     *       - name: isActive
     *         in: query
     *         schema:
     *           type: boolean
     *       - name: locationId
     *         in: query
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Makine listesi
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
     *                     $ref: '#/components/schemas/Machine'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines/{id}:
     *   get:
     *     tags: [Machines]
     *     summary: Makine detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Makine detayı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines:
     *   post:
     *     tags: [Machines]
     *     summary: Yeni makine oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateMachineRequest'
     *     responses:
     *       201:
     *         description: Makine oluşturuldu
     *       409:
     *         description: Kod zaten kullanımda
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines/{id}:
     *   put:
     *     tags: [Machines]
     *     summary: Makine güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateMachineRequest'
     *     responses:
     *       200:
     *         description: Makine güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines/{id}:
     *   delete:
     *     tags: [Machines]
     *     summary: Makine sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       204:
     *         description: Makine silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines/{id}/compatibility:
     *   post:
     *     tags: [Machines]
     *     summary: Malzeme uyumluluğu ekle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - materialTypeId
     *             properties:
     *               materialTypeId:
     *                 type: string
     *                 format: uuid
     *               minThickness:
     *                 type: number
     *               maxThickness:
     *                 type: number
     *     responses:
     *       201:
     *         description: Uyumluluk eklendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines/{id}/compatibility/{compatibilityId}:
     *   delete:
     *     tags: [Machines]
     *     summary: Malzeme uyumluluğunu kaldır
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: compatibilityId
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Uyumluluk kaldırıldı
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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
    /**
     * @openapi
     * /machines/compatible:
     *   get:
     *     tags: [Machines]
     *     summary: Uyumlu makineleri getir
     *     description: Belirli malzeme ve kalınlık için uyumlu makineleri listeler
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: materialTypeId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - name: thickness
     *         in: query
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Uyumlu makine listesi
     *       400:
     *         description: Eksik parametre
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
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