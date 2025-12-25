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

import { Router, Request, Response } from 'express';
import { ICustomerService } from './customer.service';

export class CustomerController {
    public readonly router: Router;

    constructor(private readonly customerService: ICustomerService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getCustomers.bind(this));
        this.router.get('/:id', this.getCustomerById.bind(this));
        this.router.post('/', this.createCustomer.bind(this));
        this.router.put('/:id', this.updateCustomer.bind(this));
        this.router.delete('/:id', this.deleteCustomer.bind(this));
    }

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
    private async getCustomers(req: Request, res: Response): Promise<void> {
        const filter = {
            search: req.query.search as string | undefined
        };

        const result = await this.customerService.getCustomers(filter);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }

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
    private async getCustomerById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.customerService.getCustomerById(id);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'CUSTOMER_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

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
    private async createCustomer(req: Request, res: Response): Promise<void> {
        const result = await this.customerService.createCustomer(req.body);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'DUPLICATE_CODE' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

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
    private async updateCustomer(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.customerService.updateCustomer(id, req.body);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'CUSTOMER_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

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
    private async deleteCustomer(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.customerService.deleteCustomer(id);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'CUSTOMER_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
}
