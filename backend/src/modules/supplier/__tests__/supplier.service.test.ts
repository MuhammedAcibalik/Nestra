/**
 * Supplier Service Unit Tests
 */

import { SupplierService, ICreateSupplierDTO, ICreatePurchaseOrderDTO } from '../supplier.service';
import { SupplierRepository } from '../supplier.repository';
import { Supplier, PurchaseOrder } from '../../../db/schema';

// Mock Repository
const mockRepository = {
    findAllSuppliers: jest.fn(),
    findSupplierById: jest.fn(),
    findSupplierByCode: jest.fn(),
    createSupplier: jest.fn(),
    updateSupplier: jest.fn(),
    deleteSupplier: jest.fn(),
    findAllPurchaseOrders: jest.fn(),
    findPurchaseOrderById: jest.fn(),
    findPurchaseOrderByNumber: jest.fn(),
    createPurchaseOrder: jest.fn(),
    updatePurchaseOrder: jest.fn(),
    deletePurchaseOrder: jest.fn(),
    findPurchaseOrderItems: jest.fn(),
    createPurchaseOrderItem: jest.fn(),
    createPurchaseOrderItems: jest.fn(),
    updatePurchaseOrderItem: jest.fn(),
    deletePurchaseOrderItem: jest.fn(),
    getSupplierCount: jest.fn(),
    getPurchaseOrderCount: jest.fn(),
    generatePoNumber: jest.fn()
} as unknown as jest.Mocked<SupplierRepository>;

describe('SupplierService', () => {
    let service: SupplierService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SupplierService(mockRepository);
    });

    describe('getAllSuppliers', () => {
        it('should return all suppliers for a tenant', async () => {
            const mockSuppliers: Supplier[] = [
                {
                    id: '1',
                    tenantId: 'tenant-1',
                    code: 'SUP001',
                    name: 'Test Supplier',
                    status: 'active',
                    contactName: null,
                    contactEmail: null,
                    contactPhone: null,
                    address: null,
                    city: null,
                    country: null,
                    taxId: null,
                    paymentTerms: 30,
                    currency: 'USD',
                    notes: null,
                    version: 1,
                    deletedAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockRepository.findAllSuppliers.mockResolvedValue(mockSuppliers);

            const result = await service.getAllSuppliers({ tenantId: 'tenant-1' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].code).toBe('SUP001');
            }
        });
    });

    describe('createSupplier', () => {
        it('should create a new supplier', async () => {
            const dto: ICreateSupplierDTO = {
                tenantId: 'tenant-1',
                code: 'SUP002',
                name: 'New Supplier'
            };

            const newSupplier: Supplier = {
                id: '2',
                tenantId: 'tenant-1',
                code: 'SUP002',
                name: 'New Supplier',
                status: 'active',
                contactName: null,
                contactEmail: null,
                contactPhone: null,
                address: null,
                city: null,
                country: null,
                taxId: null,
                paymentTerms: 30,
                currency: 'USD',
                notes: null,
                version: 1,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRepository.findSupplierByCode.mockResolvedValue(null);
            mockRepository.createSupplier.mockResolvedValue(newSupplier);

            const result = await service.createSupplier(dto);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('SUP002');
                expect(result.data.status).toBe('active');
            }
        });

        it('should fail if supplier code already exists', async () => {
            mockRepository.findSupplierByCode.mockResolvedValue({
                id: '1',
                code: 'SUP001'
            } as Supplier);

            const result = await service.createSupplier({
                tenantId: 'tenant-1',
                code: 'SUP001',
                name: 'Duplicate'
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('already exists');
            }
        });
    });

    describe('updateSupplier', () => {
        it('should update supplier with optimistic locking', async () => {
            const updatedSupplier: Supplier = {
                id: '1',
                tenantId: 'tenant-1',
                code: 'SUP001',
                name: 'Updated Supplier',
                status: 'active',
                contactName: null,
                contactEmail: null,
                contactPhone: null,
                address: null,
                city: null,
                country: null,
                taxId: null,
                paymentTerms: 30,
                currency: 'USD',
                notes: null,
                version: 2,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRepository.updateSupplier.mockResolvedValue(updatedSupplier);

            const result = await service.updateSupplier('1', { name: 'Updated Supplier' }, 1);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Updated Supplier');
                expect(result.data.version).toBe(2);
            }
        });

        it('should fail on concurrent modification', async () => {
            mockRepository.updateSupplier.mockResolvedValue(null);

            const result = await service.updateSupplier('1', { name: 'Updated' }, 1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('Concurrent modification');
            }
        });
    });

    describe('deleteSupplier', () => {
        it('should soft delete supplier', async () => {
            mockRepository.deleteSupplier.mockResolvedValue(true);

            const result = await service.deleteSupplier('1');

            expect(result.success).toBe(true);
            expect(mockRepository.deleteSupplier).toHaveBeenCalledWith('1', true);
        });

        it('should fail if supplier not found', async () => {
            mockRepository.deleteSupplier.mockResolvedValue(false);

            const result = await service.deleteSupplier('nonexistent');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('not found');
            }
        });
    });

    describe('createPurchaseOrder', () => {
        it('should create a purchase order with items', async () => {
            const dto: ICreatePurchaseOrderDTO = {
                tenantId: 'tenant-1',
                supplierId: 'supplier-1',
                createdById: 'user-1',
                items: [
                    {
                        materialTypeId: 'mat-1',
                        quantity: 10,
                        unitPrice: 100
                    }
                ]
            };

            const supplier: Supplier = {
                id: 'supplier-1',
                tenantId: 'tenant-1',
                code: 'SUP001',
                name: 'Test Supplier',
                status: 'active',
                paymentTerms: 30,
                currency: 'USD'
            } as Supplier;

            const mockPO: PurchaseOrder = {
                id: 'po-1',
                tenantId: 'tenant-1',
                poNumber: 'PO-202412-00001',
                supplierId: 'supplier-1',
                createdById: 'user-1',
                status: 'draft',
                orderDate: new Date(),
                totalAmount: 1000,
                currency: 'USD',
                paymentTerms: 30,
                expectedDeliveryDate: null,
                actualDeliveryDate: null,
                approvedById: null,
                shippingAddress: null,
                notes: null,
                version: 1,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRepository.findSupplierById.mockResolvedValue(supplier);
            mockRepository.generatePoNumber.mockResolvedValue('PO-202412-00001');
            mockRepository.createPurchaseOrder.mockResolvedValue(mockPO);
            mockRepository.createPurchaseOrderItems.mockResolvedValue([]);

            const result = await service.createPurchaseOrder(dto);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.poNumber).toBe('PO-202412-00001');
                expect(result.data.status).toBe('draft');
            }
        });

        it('should fail if supplier not found', async () => {
            mockRepository.findSupplierById.mockResolvedValue(null);

            const result = await service.createPurchaseOrder({
                tenantId: 'tenant-1',
                supplierId: 'nonexistent',
                createdById: 'user-1',
                items: []
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('Supplier not found');
            }
        });
    });

    describe('updatePurchaseOrderStatus', () => {
        it('should update status to approved', async () => {
            const updatedPO: PurchaseOrder = {
                id: 'po-1',
                status: 'approved',
                approvedById: 'user-1'
            } as PurchaseOrder;

            mockRepository.updatePurchaseOrder.mockResolvedValue(updatedPO);

            const result = await service.updatePurchaseOrderStatus('po-1', 'approved', 'user-1');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe('approved');
            }
        });
    });

    describe('getStats', () => {
        it('should return supplier and PO counts', async () => {
            mockRepository.getSupplierCount.mockResolvedValue(5);
            mockRepository.getPurchaseOrderCount.mockResolvedValue(10);

            const result = await service.getStats('tenant-1');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.supplierCount).toBe(5);
                expect(result.data.poCount).toBe(10);
            }
        });
    });
});
