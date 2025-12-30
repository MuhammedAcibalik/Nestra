/**
 * RBAC Service Unit Tests
 */

import { RbacService } from '../rbac.service';
import { RbacRepository } from '../rbac.repository';
import { Permission, PermissionCategory, PermissionAction } from '../../../db/schema';

// Mock Repository
const mockRepository = {
    findAllPermissions: jest.fn(),
    findPermissionById: jest.fn(),
    findPermissionByCode: jest.fn(),
    findPermissionsByCodes: jest.fn(),
    createPermission: jest.fn(),
    findRolePermissions: jest.fn(),
    findRolePermissionCodes: jest.fn(),
    assignPermissionToRole: jest.fn(),
    removePermissionFromRole: jest.fn(),
    syncRolePermissions: jest.fn(),
    findTenantRoles: jest.fn(),
    findTenantRoleById: jest.fn(),
    createTenantRole: jest.fn(),
    updateTenantRole: jest.fn(),
    deleteTenantRole: jest.fn(),
    findTenantRolePermissions: jest.fn(),
    findTenantRolePermissionCodes: jest.fn(),
    syncTenantRolePermissions: jest.fn(),
    hasRolePermission: jest.fn(),
    hasAnyRolePermission: jest.fn()
} as unknown as jest.Mocked<RbacRepository>;

describe('RbacService', () => {
    let service: RbacService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new RbacService(mockRepository);
        service.clearCache(); // Clear cache before each test
    });

    describe('getAllPermissions', () => {
        it('should return all permissions', async () => {
            const mockPermissions: Permission[] = [
                {
                    id: '1',
                    code: 'orders:read',
                    name: 'Read Orders',
                    description: null,
                    category: 'orders' as PermissionCategory,
                    action: 'read' as PermissionAction,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockRepository.findAllPermissions.mockResolvedValue(mockPermissions);

            const result = await service.getAllPermissions();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].code).toBe('orders:read');
            }
        });

        it('should filter by category', async () => {
            mockRepository.findAllPermissions.mockResolvedValue([]);

            await service.getPermissionsByCategory('orders');

            expect(mockRepository.findAllPermissions).toHaveBeenCalledWith({ category: 'orders' });
        });
    });

    describe('createPermission', () => {
        it('should create a new permission', async () => {
            const newPermission: Permission = {
                id: '1',
                code: 'stock:create',
                name: 'Create Stock',
                description: 'Create new stock items',
                category: 'stock' as PermissionCategory,
                action: 'create' as PermissionAction,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRepository.findPermissionByCode.mockResolvedValue(null);
            mockRepository.createPermission.mockResolvedValue(newPermission);

            const result = await service.createPermission(
                'stock:create',
                'Create Stock',
                'stock',
                'create',
                'Create new stock items'
            );

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('stock:create');
            }
        });

        it('should fail if permission already exists', async () => {
            mockRepository.findPermissionByCode.mockResolvedValue({
                id: '1',
                code: 'stock:create',
                name: 'Create Stock'
            } as Permission);

            const result = await service.createPermission(
                'stock:create',
                'Create Stock',
                'stock',
                'create'
            );

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('already exists');
            }
        });
    });

    describe('hasPermission', () => {
        it('should return true if role has permission', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue([
                'orders:read',
                'orders:create'
            ]);

            const result = await service.hasPermission('role-1', 'orders:read');

            expect(result).toBe(true);
        });

        it('should return false if role does not have permission', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue([
                'orders:read'
            ]);

            const result = await service.hasPermission('role-1', 'admin:manage');

            expect(result).toBe(false);
        });

        it('should use cache for subsequent calls', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue(['orders:read']);

            // First call - fetches from DB
            await service.hasPermission('role-1', 'orders:read');
            // Second call - should use cache
            await service.hasPermission('role-1', 'orders:create');

            expect(mockRepository.findRolePermissionCodes).toHaveBeenCalledTimes(1);
        });
    });

    describe('hasAnyPermission', () => {
        it('should return true if role has any of the permissions', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue([
                'orders:read'
            ]);

            const result = await service.hasAnyPermission('role-1', [
                'orders:read',
                'admin:manage'
            ]);

            expect(result).toBe(true);
        });

        it('should return false if role has none of the permissions', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue([
                'stock:read'
            ]);

            const result = await service.hasAnyPermission('role-1', [
                'orders:read',
                'admin:manage'
            ]);

            expect(result).toBe(false);
        });
    });

    describe('hasAllPermissions', () => {
        it('should return true if role has all permissions', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue([
                'orders:read',
                'orders:create',
                'orders:update'
            ]);

            const result = await service.hasAllPermissions('role-1', [
                'orders:read',
                'orders:create'
            ]);

            expect(result).toBe(true);
        });

        it('should return false if role is missing any permission', async () => {
            mockRepository.findRolePermissionCodes.mockResolvedValue([
                'orders:read'
            ]);

            const result = await service.hasAllPermissions('role-1', [
                'orders:read',
                'orders:create'
            ]);

            expect(result).toBe(false);
        });
    });

    describe('cache management', () => {
        it('should clear cache', () => {
            const stats = service.getCacheStats();
            expect(stats.ttlMs).toBe(5 * 60 * 1000); // 5 minutes

            service.clearCache();
            expect(service.getCacheStats().size).toBe(0);
        });
    });
});
