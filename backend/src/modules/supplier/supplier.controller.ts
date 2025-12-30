/**
 * Supplier Controller
 * REST API endpoints for supplier and purchase order management
 */

import { Router, Request, Response } from 'express';
import { SupplierService, ICreateSupplierDTO, ICreatePurchaseOrderDTO, IUpdateSupplierDTO } from './supplier.service';
import { PurchaseOrderStatus } from '../../db/schema';
import { ITenantRequest } from '../../core/interfaces';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('SupplierController');

// Helper to extract tenant context from authenticated request
function getTenantContext(req: Request): ITenantRequest {
    return req as ITenantRequest;
}

export class SupplierController {
    public router: Router;

    constructor(private readonly service: SupplierService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Suppliers
        this.router.get('/suppliers', this.getAllSuppliers.bind(this));
        this.router.get('/suppliers/:id', this.getSupplierById.bind(this));
        this.router.post('/suppliers', this.createSupplier.bind(this));
        this.router.put('/suppliers/:id', this.updateSupplier.bind(this));
        this.router.delete('/suppliers/:id', this.deleteSupplier.bind(this));

        // Purchase Orders
        this.router.get('/purchase-orders', this.getAllPurchaseOrders.bind(this));
        this.router.get('/purchase-orders/:id', this.getPurchaseOrderById.bind(this));
        this.router.post('/purchase-orders', this.createPurchaseOrder.bind(this));
        this.router.patch('/purchase-orders/:id/status', this.updatePurchaseOrderStatus.bind(this));
        this.router.delete('/purchase-orders/:id', this.deletePurchaseOrder.bind(this));

        // Stats
        this.router.get('/stats', this.getStats.bind(this));
    }

    // ==================== SUPPLIERS ====================

    private async getAllSuppliers(req: Request, res: Response): Promise<void> {
        const { tenantId } = getTenantContext(req);
        const { status, search, includeDeleted } = req.query;

        const result = await this.service.getAllSuppliers({
            tenantId,
            status: status as string,
            search: search as string,
            includeDeleted: includeDeleted === 'true'
        });

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    }

    private async getSupplierById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const result = await this.service.getSupplierById(id);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    }

    private async createSupplier(req: Request, res: Response): Promise<void> {
        const { tenantId } = getTenantContext(req);
        const dto: ICreateSupplierDTO = { ...req.body, tenantId };

        const result = await this.service.createSupplier(dto);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }

    private async updateSupplier(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { version, ...dto } = req.body as IUpdateSupplierDTO & { version?: number };

        const result = await this.service.updateSupplier(id, dto, version);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error.includes('not found') ? 404 : 409;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async deleteSupplier(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const result = await this.service.deleteSupplier(id);

        if (result.success) {
            res.status(204).send();
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    }

    // ==================== PURCHASE ORDERS ====================

    private async getAllPurchaseOrders(req: Request, res: Response): Promise<void> {
        const { tenantId } = getTenantContext(req);
        const { supplierId, status, search, includeDeleted } = req.query;

        const result = await this.service.getAllPurchaseOrders({
            tenantId,
            supplierId: supplierId as string,
            status: status as string,
            search: search as string,
            includeDeleted: includeDeleted === 'true'
        });

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    }

    private async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const result = await this.service.getPurchaseOrderById(id);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    }

    private async createPurchaseOrder(req: Request, res: Response): Promise<void> {
        const { tenantId, userId } = getTenantContext(req);

        const dto: ICreatePurchaseOrderDTO = {
            ...req.body,
            tenantId,
            createdById: userId
        };

        const result = await this.service.createPurchaseOrder(dto);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }

    private async updatePurchaseOrderStatus(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { status } = req.body as { status: PurchaseOrderStatus };
        const { userId } = getTenantContext(req);

        const result = await this.service.updatePurchaseOrderStatus(id, status, userId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    }

    private async deletePurchaseOrder(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const result = await this.service.deletePurchaseOrder(id);

        if (result.success) {
            res.status(204).send();
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    }

    // ==================== STATS ====================

    private async getStats(req: Request, res: Response): Promise<void> {
        const { tenantId } = getTenantContext(req);

        const result = await this.service.getStats(tenantId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    }
}
