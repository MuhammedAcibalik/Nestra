"use strict";
/**
 * Tenant Controller
 * HTTP endpoints for tenant management
 * Following SOLID principles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../../middleware/errorHandler");
const authMiddleware_1 = require("../../middleware/authMiddleware");
// ==================== CONTROLLER ====================
class TenantController {
    tenantService;
    router;
    constructor(tenantService) {
        this.tenantService = tenantService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Public routes (for tenant resolution during login)
        this.router.get('/slug/:slug', (0, errorHandler_1.asyncHandler)(this.getTenantBySlug.bind(this)));
        this.router.post('/validate-slug', (0, errorHandler_1.asyncHandler)(this.validateSlug.bind(this)));
        // Admin-only routes
        this.router.post('/', (0, authMiddleware_1.requireRole)('ADMIN'), (0, errorHandler_1.asyncHandler)(this.createTenant.bind(this)));
        this.router.get('/', (0, authMiddleware_1.requireRole)('ADMIN'), (0, errorHandler_1.asyncHandler)(this.listTenants.bind(this)));
        this.router.get('/:id', (0, authMiddleware_1.requireRole)('ADMIN'), (0, errorHandler_1.asyncHandler)(this.getTenant.bind(this)));
        this.router.put('/:id', (0, authMiddleware_1.requireRole)('ADMIN'), (0, errorHandler_1.asyncHandler)(this.updateTenant.bind(this)));
        this.router.delete('/:id', (0, authMiddleware_1.requireRole)('ADMIN'), (0, errorHandler_1.asyncHandler)(this.deactivateTenant.bind(this)));
        // User management (tenant owner or admin)
        this.router.post('/:id/users', (0, authMiddleware_1.requireRole)('ADMIN', 'OWNER'), (0, errorHandler_1.asyncHandler)(this.addUser.bind(this)));
        this.router.delete('/:id/users/:userId', (0, authMiddleware_1.requireRole)('ADMIN', 'OWNER'), (0, errorHandler_1.asyncHandler)(this.removeUser.bind(this)));
        this.router.get('/:id/users', (0, errorHandler_1.asyncHandler)(this.getTenantUsers.bind(this)));
        // Current user's tenants
        this.router.get('/my/tenants', (0, errorHandler_1.asyncHandler)(this.getMyTenants.bind(this)));
    }
    // ==================== HANDLERS ====================
    async createTenant(req, res) {
        const input = {
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
    async getTenant(req, res) {
        const { id } = req.params;
        const result = await this.tenantService.getTenant(id);
        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, data: result.data });
    }
    async getTenantBySlug(req, res) {
        const { slug } = req.params;
        const result = await this.tenantService.getTenantBySlug(slug);
        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, data: result.data });
    }
    async updateTenant(req, res) {
        const { id } = req.params;
        const input = {
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
    async deactivateTenant(req, res) {
        const { id } = req.params;
        const result = await this.tenantService.deactivateTenant(id);
        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, message: 'Tenant deactivated' });
    }
    async listTenants(req, res) {
        const options = {
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            plan: req.query.plan,
            search: req.query.search,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
        };
        const result = await this.tenantService.listTenants(options);
        if (!result.success) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, data: result.data });
    }
    async validateSlug(req, res) {
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
    async addUser(req, res) {
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
    async removeUser(req, res) {
        const { id, userId } = req.params;
        const result = await this.tenantService.removeUser(id, userId);
        if (!result.success) {
            res.status(404).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, message: 'User removed from tenant' });
    }
    async getTenantUsers(req, res) {
        const { id } = req.params;
        const result = await this.tenantService.getTenantUsers(id);
        if (!result.success) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }
        res.json({ success: true, data: result.data });
    }
    async getMyTenants(req, res) {
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
exports.TenantController = TenantController;
//# sourceMappingURL=tenant.controller.js.map