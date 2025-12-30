"use strict";
/**
 * Tenant Service
 * Business logic for tenant management
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const interfaces_1 = require("../../core/interfaces");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('TenantService');
// ==================== SERVICE ====================
class TenantService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    // ==================== TENANT MANAGEMENT ====================
    async createTenant(data) {
        try {
            // Validate slug format
            if (!this.isValidSlug(data.slug)) {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_SLUG',
                    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
                });
            }
            // Check if slug already exists
            const existing = await this.repository.findBySlug(data.slug);
            if (existing) {
                return (0, interfaces_1.failure)({
                    code: 'SLUG_EXISTS',
                    message: 'A tenant with this slug already exists'
                });
            }
            const tenant = await this.repository.create({
                name: data.name,
                slug: data.slug,
                plan: data.plan ?? 'basic',
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                address: data.address,
                settings: data.settings,
                maxUsers: this.getDefaultMaxUsers(data.plan ?? 'basic'),
                maxLocations: this.getDefaultMaxLocations(data.plan ?? 'basic'),
                maxMachines: this.getDefaultMaxMachines(data.plan ?? 'basic')
            });
            logger.info('Tenant created', { id: tenant.id, slug: tenant.slug });
            return (0, interfaces_1.success)(this.toTenantInfo(tenant));
        }
        catch (error) {
            logger.error('Failed to create tenant', { error });
            return (0, interfaces_1.failure)({
                code: 'CREATE_FAILED',
                message: 'Failed to create tenant'
            });
        }
    }
    async getTenant(id) {
        const tenant = await this.repository.findById(id);
        if (!tenant) {
            return (0, interfaces_1.failure)({
                code: 'NOT_FOUND',
                message: 'Tenant not found'
            });
        }
        return (0, interfaces_1.success)(this.toTenantInfo(tenant));
    }
    async getTenantBySlug(slug) {
        const tenant = await this.repository.findBySlug(slug);
        if (!tenant) {
            return (0, interfaces_1.failure)({
                code: 'NOT_FOUND',
                message: 'Tenant not found'
            });
        }
        return (0, interfaces_1.success)(this.toTenantInfo(tenant));
    }
    async updateTenant(id, data) {
        try {
            const tenant = await this.repository.update(id, data);
            if (!tenant) {
                return (0, interfaces_1.failure)({
                    code: 'NOT_FOUND',
                    message: 'Tenant not found'
                });
            }
            logger.info('Tenant updated', { id: tenant.id });
            return (0, interfaces_1.success)(this.toTenantInfo(tenant));
        }
        catch (error) {
            logger.error('Failed to update tenant', { error, id });
            return (0, interfaces_1.failure)({
                code: 'UPDATE_FAILED',
                message: 'Failed to update tenant'
            });
        }
    }
    async deactivateTenant(id) {
        try {
            const tenant = await this.repository.update(id, { isActive: false });
            if (!tenant) {
                return (0, interfaces_1.failure)({
                    code: 'NOT_FOUND',
                    message: 'Tenant not found'
                });
            }
            logger.info('Tenant deactivated', { id });
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            logger.error('Failed to deactivate tenant', { error, id });
            return (0, interfaces_1.failure)({
                code: 'DEACTIVATE_FAILED',
                message: 'Failed to deactivate tenant'
            });
        }
    }
    async listTenants(options) {
        try {
            const tenants = await this.repository.findAll(options);
            return (0, interfaces_1.success)(tenants.map((t) => this.toTenantInfo(t)));
        }
        catch (error) {
            logger.error('Failed to list tenants', { error });
            return (0, interfaces_1.failure)({
                code: 'LIST_FAILED',
                message: 'Failed to list tenants'
            });
        }
    }
    // ==================== USER MANAGEMENT ====================
    async addUser(tenantId, userId, isOwner = false) {
        try {
            // Check if user is already in tenant
            const isInTenant = await this.repository.isUserInTenant(userId, tenantId);
            if (isInTenant) {
                return (0, interfaces_1.failure)({
                    code: 'USER_ALREADY_IN_TENANT',
                    message: 'User is already a member of this tenant'
                });
            }
            // Check user limit
            const limitCheck = await this.checkLimit(tenantId, 'users');
            if (limitCheck.success && limitCheck.data && !limitCheck.data.allowed) {
                return (0, interfaces_1.failure)({
                    code: 'USER_LIMIT_REACHED',
                    message: `Maximum user limit (${limitCheck.data.max}) reached for this tenant`
                });
            }
            await this.repository.addUserToTenant({
                tenantId,
                userId,
                isOwner
            });
            logger.info('User added to tenant', { userId, tenantId, isOwner });
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            logger.error('Failed to add user to tenant', { error, userId, tenantId });
            return (0, interfaces_1.failure)({
                code: 'ADD_USER_FAILED',
                message: 'Failed to add user to tenant'
            });
        }
    }
    async removeUser(tenantId, userId) {
        try {
            const removed = await this.repository.removeUserFromTenant(tenantId, userId);
            if (!removed) {
                return (0, interfaces_1.failure)({
                    code: 'NOT_FOUND',
                    message: 'User is not a member of this tenant'
                });
            }
            logger.info('User removed from tenant', { userId, tenantId });
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            logger.error('Failed to remove user from tenant', { error, userId, tenantId });
            return (0, interfaces_1.failure)({
                code: 'REMOVE_USER_FAILED',
                message: 'Failed to remove user from tenant'
            });
        }
    }
    async getUserTenants(userId) {
        try {
            const tenantUsers = await this.repository.getUserTenants(userId);
            const result = [];
            for (const tu of tenantUsers) {
                const tenant = await this.repository.findById(tu.tenantId);
                if (tenant) {
                    result.push({
                        tenantId: tenant.id,
                        tenantName: tenant.name,
                        tenantSlug: tenant.slug,
                        plan: tenant.plan,
                        isOwner: tu.isOwner,
                        joinedAt: tu.joinedAt
                    });
                }
            }
            return (0, interfaces_1.success)(result);
        }
        catch (error) {
            logger.error('Failed to get user tenants', { error, userId });
            return (0, interfaces_1.failure)({
                code: 'GET_TENANTS_FAILED',
                message: 'Failed to get user tenants'
            });
        }
    }
    async getTenantUsers(tenantId) {
        try {
            const users = await this.repository.getTenantUsers(tenantId);
            return (0, interfaces_1.success)(users);
        }
        catch (error) {
            logger.error('Failed to get tenant users', { error, tenantId });
            return (0, interfaces_1.failure)({
                code: 'GET_USERS_FAILED',
                message: 'Failed to get tenant users'
            });
        }
    }
    // ==================== VALIDATION ====================
    async validateSlug(slug) {
        if (!this.isValidSlug(slug)) {
            return (0, interfaces_1.success)(false);
        }
        const existing = await this.repository.findBySlug(slug);
        return (0, interfaces_1.success)(existing === null);
    }
    async checkLimit(tenantId, limitType) {
        try {
            const tenant = await this.repository.findById(tenantId);
            if (!tenant) {
                return (0, interfaces_1.failure)({
                    code: 'NOT_FOUND',
                    message: 'Tenant not found'
                });
            }
            let current = 0;
            let max = 0;
            switch (limitType) {
                case 'users':
                    current = await this.repository.getUserCount(tenantId);
                    max = tenant.maxUsers;
                    break;
                case 'locations':
                    max = tenant.maxLocations;
                    // Would need location count from location repository
                    break;
                case 'machines':
                    max = tenant.maxMachines;
                    // Would need machine count from machine repository
                    break;
                default:
                    max = Number.MAX_SAFE_INTEGER;
            }
            return (0, interfaces_1.success)({
                allowed: current < max,
                current,
                max,
                remaining: Math.max(0, max - current)
            });
        }
        catch (error) {
            logger.error('Failed to check limit', { error, tenantId, limitType });
            return (0, interfaces_1.failure)({
                code: 'CHECK_LIMIT_FAILED',
                message: 'Failed to check limit'
            });
        }
    }
    // ==================== HELPERS ====================
    isValidSlug(slug) {
        return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 3 && slug.length <= 50;
    }
    toTenantInfo(tenant) {
        return {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            isActive: tenant.isActive,
            settings: tenant.settings ?? undefined
        };
    }
    getDefaultMaxUsers(plan) {
        const defaults = {
            basic: 5,
            pro: 25,
            enterprise: 1000
        };
        return defaults[plan];
    }
    getDefaultMaxLocations(plan) {
        const defaults = {
            basic: 2,
            pro: 10,
            enterprise: 100
        };
        return defaults[plan];
    }
    getDefaultMaxMachines(plan) {
        const defaults = {
            basic: 5,
            pro: 25,
            enterprise: 500
        };
        return defaults[plan];
    }
}
exports.TenantService = TenantService;
//# sourceMappingURL=tenant.service.js.map