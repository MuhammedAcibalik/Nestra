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
import { Router } from 'express';
import { ILocationService } from './location.service';
export declare class LocationController {
    private readonly locationService;
    readonly router: Router;
    constructor(locationService: ILocationService);
    private initializeRoutes;
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
    private getLocations;
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
    private getLocationById;
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
    private createLocation;
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
    private updateLocation;
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
    private deleteLocation;
}
//# sourceMappingURL=location.controller.d.ts.map