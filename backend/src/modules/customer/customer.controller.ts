/**
 * Customer Controller
 * Following SRP - Only handles HTTP request/response
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

    private async createCustomer(req: Request, res: Response): Promise<void> {
        const result = await this.customerService.createCustomer(req.body);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'DUPLICATE_CODE' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

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
