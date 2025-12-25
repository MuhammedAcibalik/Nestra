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
import { Router } from 'express';
import { IMachineService } from './machine.service';
export declare class MachineController {
    private readonly machineService;
    readonly router: Router;
    constructor(machineService: IMachineService);
    private initializeRoutes;
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
    private getMachines;
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
    private getMachineById;
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
    private createMachine;
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
    private updateMachine;
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
    private deleteMachine;
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
    private addCompatibility;
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
    private removeCompatibility;
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
    private getCompatibleMachines;
}
//# sourceMappingURL=machine.controller.d.ts.map