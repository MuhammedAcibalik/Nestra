/**
 * Customer Controller
 * Following SRP - Only handles HTTP request/response
 * @openapi
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: CUST-001
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateCustomerRequest:
 *       type: object
 *       required:
 *         - code
 *         - name
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 */
import { Router } from 'express';
import { ICustomerService } from './customer.service';
export declare class CustomerController {
    private readonly customerService;
    readonly router: Router;
    constructor(customerService: ICustomerService);
    private initializeRoutes;
    /**
     * @openapi
     * /customers:
     *   get:
     *     tags: [Customers]
     *     summary: Müşterileri listele
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - name: search
     *         in: query
     *         schema:
     *           type: string
     *         description: İsim veya kod ile arama
     *     responses:
     *       200:
     *         description: Müşteri listesi
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
     *                     $ref: '#/components/schemas/Customer'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private getCustomers;
    /**
     * @openapi
     * /customers/{id}:
     *   get:
     *     tags: [Customers]
     *     summary: Müşteri detayı
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       200:
     *         description: Müşteri detayı
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private getCustomerById;
    /**
     * @openapi
     * /customers:
     *   post:
     *     tags: [Customers]
     *     summary: Yeni müşteri oluştur
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCustomerRequest'
     *     responses:
     *       201:
     *         description: Müşteri oluşturuldu
     *       409:
     *         description: Kod zaten kullanımda
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private createCustomer;
    /**
     * @openapi
     * /customers/{id}:
     *   put:
     *     tags: [Customers]
     *     summary: Müşteri güncelle
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCustomerRequest'
     *     responses:
     *       200:
     *         description: Müşteri güncellendi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private updateCustomer;
    /**
     * @openapi
     * /customers/{id}:
     *   delete:
     *     tags: [Customers]
     *     summary: Müşteri sil
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/IdPath'
     *     responses:
     *       204:
     *         description: Müşteri silindi
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    private deleteCustomer;
}
//# sourceMappingURL=customer.controller.d.ts.map