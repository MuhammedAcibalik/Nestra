/**
 * Tenant Controller
 * HTTP endpoints for tenant management
 * Following SOLID principles
 */

import { Router, Request, Response } from 'express';
import { ITenantService, ICreateTenantInput, IUpdateTenantInput } from './tenant.service';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireRole, AuthenticatedRequest } from '../../middleware/authMiddleware';

// ==================== CONTROLLER ====================

export class TenantController {
    public readonly router: Router;

    constructor(private readonly tenantService: ITenantService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public routes (for tenant resolution during login)
        this.router.get('/slug/:slug', asyncHandler(this.getTenantBySlug.bind(this)));
        this.router.post('/validate-slug', asyncHandler(this.validateSlug.bind(this)));

        // Admin-only routes
        this.router.post('/', requireRole('ADMIN'), asyncHandler(this.createTenant.bind(this)));
        this.router.get('/', requireRole('ADMIN'), asyncHandler(this.listTenants.bind(this)));
        this.router.get('/:id', requireRole('ADMIN'), asyncHandler(this.getTenant.bind(this)));
        this.router.put('/:id', requireRole('ADMIN'), asyncHandler(this.updateTenant.bind(this)));
        this.router.delete('/:id', requireRole('ADMIN'), asyncHandler(this.deactivateTenant.bind(this)));

        // User management (tenant owner or admin)
        this.router.post('/:id/users', requireRole('ADMIN', 'OWNER'), asyncHandler(this.addUser.bind(this)));
        this.router.delete(
            '/:id/users/:userId',
            requireRole('ADMIN', 'OWNER'),
            asyncHandler(this.removeUser.bind(this))
        );
        this.router.get('/:id/users', asyncHandler(this.getTenantUsers.bind(this)));

        // Current user's tenants
        this.router.get('/my/tenants', asyncHandler(this.getMyTenants.bind(this)));
    }

    // ==================== HANDLERS ====================

    private async createTenant(req: Request, res: Response): Promise<void> {
        const input: ICreateTenantInput = {
            name: req.body.name,
            slug: req.body.slug,
            plan: req.body.plan,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            address: req.body.address,
            settings: req.body.settings
        };

        const result = await this.tenantService.createTenant(input);

        if (!result.success) {
            res.status(400).json({ success: false, error: result.error });
            return;
        }

        res.status(201).json({ success: true, data: result.data });
    }

    private async getTenant(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.tenantService.getTenant(id);

        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, data: result.data });
    }

    private async getTenantBySlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;
        const result = await this.tenantService.getTenantBySlug(slug);

        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, data: result.data });
    }

    private async updateTenant(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const input: IUpdateTenantInput = {
            name: req.body.name,
            plan: req.body.plan,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            address: req.body.address,
            settings: req.body.settings,
            maxUsers: req.body.maxUsers,
            maxLocations: req.body.maxLocations,
            maxMachines: req.body.maxMachines
        };

        const result = await this.tenantService.updateTenant(id, input);

        if (!result.success) {
            res.status(result.error?.code === 'NOT_FOUND' ? 404 : 400).json({
                success: false,
                error: result.error
            });
            return;
        }

        res.json({ success: true, data: result.data });
    }

    private async deactivateTenant(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.tenantService.deactivateTenant(id);

        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, message: 'Tenant deactivated' });
    }

    private async listTenants(req: Request, res: Response): Promise<void> {
        const options = {
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            plan: req.query.plan as string | undefined,
            search: req.query.search as string | undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
        };

        const result = await this.tenantService.listTenants(options);

        if (!result.success) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, data: result.data });
    }

    private async validateSlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.body;

        if (!slug) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Slug is required' }
            });
            return;
        }

        const result = await this.tenantService.validateSlug(slug);

        if (!result.success) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }

        res.json({
            success: true,
            data: { available: result.data }
        });
    }

    private async addUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { userId, isOwner } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
            });
            return;
        }

        const result = await this.tenantService.addUser(id, userId, isOwner);

        if (!result.success) {
            res.status(400).json({ success: false, error: result.error });
            return;
        }

        res.status(201).json({ success: true, message: 'User added to tenant' });
    }

    private async removeUser(req: Request, res: Response): Promise<void> {
        const { id, userId } = req.params;
        const result = await this.tenantService.removeUser(id, userId);

        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, message: 'User removed from tenant' });
    }

    private async getTenantUsers(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.tenantService.getTenantUsers(id);

        if (!result.success) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, data: result.data });
    }

    private async getMyTenants(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
            return;
        }

        const result = await this.tenantService.getUserTenants(userId);

        if (!result.success) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }

        res.json({ success: true, data: result.data });
    }
}
