/**
 * Supplier Service
 * Business logic for supplier and purchase order management
 */

import { SupplierRepository, ISupplierFilter, IPurchaseOrderFilter } from './supplier.repository';
import {
    Supplier,
    NewSupplier,
    PurchaseOrder,
    NewPurchaseOrder,
    PurchaseOrderItem,
    NewPurchaseOrderItem,
    SupplierStatus,
    PurchaseOrderStatus
} from '../../db/schema';
import { createModuleLogger } from '../../core/logger';
import { EventBus } from '../../core/events';

const logger = createModuleLogger('SupplierService');
const eventBus = EventBus.getInstance();

// ==================== SERVICE RESULT ====================

type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// ==================== DTOs ====================

export interface ICreateSupplierDTO {
    tenantId: string;
    code: string;
    name: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    paymentTerms?: number;
    currency?: string;
    notes?: string;
}

export interface IUpdateSupplierDTO {
    name?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    status?: SupplierStatus;
    paymentTerms?: number;
    currency?: string;
    notes?: string;
}

export interface ICreatePurchaseOrderDTO {
    tenantId: string;
    supplierId: string;
    createdById: string;
    expectedDeliveryDate?: Date;
    paymentTerms?: number;
    shippingAddress?: string;
    notes?: string;
    items: ICreatePurchaseOrderItemDTO[];
}

export interface ICreatePurchaseOrderItemDTO {
    materialTypeId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    thickness?: number;
    width?: number;
    height?: number;
    length?: number;
    notes?: string;
}

// ==================== SERVICE ====================

export class SupplierService {
    constructor(private readonly repository: SupplierRepository) { }

    // ==================== SUPPLIERS ====================

    async getAllSuppliers(filter: ISupplierFilter): Promise<IServiceResult<Supplier[]>> {
        try {
            const suppliers = await this.repository.findAllSuppliers(filter);
            return { success: true, data: suppliers };
        } catch (error) {
            logger.error('Failed to get suppliers', { error });
            return { success: false, error: 'Failed to retrieve suppliers' };
        }
    }

    async getSupplierById(id: string): Promise<IServiceResult<Supplier>> {
        try {
            const supplier = await this.repository.findSupplierById(id);
            if (!supplier) {
                return { success: false, error: 'Supplier not found' };
            }
            return { success: true, data: supplier };
        } catch (error) {
            logger.error('Failed to get supplier', { id, error });
            return { success: false, error: 'Failed to retrieve supplier' };
        }
    }

    async createSupplier(dto: ICreateSupplierDTO): Promise<IServiceResult<Supplier>> {
        try {
            // Check for duplicate code
            const existing = await this.repository.findSupplierByCode(dto.code);
            if (existing) {
                return { success: false, error: `Supplier with code ${dto.code} already exists` };
            }

            const supplier = await this.repository.createSupplier({
                ...dto,
                status: 'active'
            });

            logger.info('Supplier created', { supplierId: supplier.id, code: supplier.code });
            void eventBus.publishTyped('supplier.created', 'supplier', supplier.id, { supplier });

            return { success: true, data: supplier };
        } catch (error) {
            logger.error('Failed to create supplier', { error });
            return { success: false, error: 'Failed to create supplier' };
        }
    }

    async updateSupplier(id: string, dto: IUpdateSupplierDTO, expectedVersion?: number): Promise<IServiceResult<Supplier>> {
        try {
            const updated = await this.repository.updateSupplier(id, dto, expectedVersion);

            if (!updated) {
                if (expectedVersion !== undefined) {
                    return { success: false, error: 'Concurrent modification detected' };
                }
                return { success: false, error: 'Supplier not found' };
            }

            logger.info('Supplier updated', { supplierId: updated.id });
            void eventBus.publishTyped('supplier.updated', 'supplier', updated.id, { supplier: updated });

            return { success: true, data: updated };
        } catch (error) {
            logger.error('Failed to update supplier', { id, error });
            return { success: false, error: 'Failed to update supplier' };
        }
    }

    async deleteSupplier(id: string): Promise<IServiceResult<void>> {
        try {
            const deleted = await this.repository.deleteSupplier(id, true);

            if (!deleted) {
                return { success: false, error: 'Supplier not found' };
            }

            logger.info('Supplier deleted', { supplierId: id });
            void eventBus.publishTyped('supplier.deleted', 'supplier', id, { supplierId: id });

            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to delete supplier', { id, error });
            return { success: false, error: 'Failed to delete supplier' };
        }
    }

    // ==================== PURCHASE ORDERS ====================

    async getAllPurchaseOrders(filter: IPurchaseOrderFilter): Promise<IServiceResult<PurchaseOrder[]>> {
        try {
            const orders = await this.repository.findAllPurchaseOrders(filter);
            return { success: true, data: orders };
        } catch (error) {
            logger.error('Failed to get purchase orders', { error });
            return { success: false, error: 'Failed to retrieve purchase orders' };
        }
    }

    async getPurchaseOrderById(id: string): Promise<IServiceResult<{ order: PurchaseOrder; items: PurchaseOrderItem[] }>> {
        try {
            const order = await this.repository.findPurchaseOrderById(id);
            if (!order) {
                return { success: false, error: 'Purchase order not found' };
            }

            const items = await this.repository.findPurchaseOrderItems(id);
            return { success: true, data: { order, items } };
        } catch (error) {
            logger.error('Failed to get purchase order', { id, error });
            return { success: false, error: 'Failed to retrieve purchase order' };
        }
    }

    async createPurchaseOrder(dto: ICreatePurchaseOrderDTO): Promise<IServiceResult<PurchaseOrder>> {
        try {
            // Validate supplier exists
            const supplier = await this.repository.findSupplierById(dto.supplierId);
            if (!supplier) {
                return { success: false, error: 'Supplier not found' };
            }

            // Generate PO number
            const poNumber = await this.repository.generatePoNumber(dto.tenantId);

            // Calculate total
            const totalAmount = dto.items.reduce(
                (sum, item) => sum + (item.quantity * item.unitPrice),
                0
            );

            // Create purchase order
            const order = await this.repository.createPurchaseOrder({
                tenantId: dto.tenantId,
                poNumber,
                supplierId: dto.supplierId,
                createdById: dto.createdById,
                status: 'draft',
                expectedDeliveryDate: dto.expectedDeliveryDate,
                paymentTerms: dto.paymentTerms ?? supplier.paymentTerms,
                shippingAddress: dto.shippingAddress,
                currency: supplier.currency,
                totalAmount,
                notes: dto.notes
            });

            // Create items
            const itemsToCreate: NewPurchaseOrderItem[] = dto.items.map(item => ({
                purchaseOrderId: order.id,
                materialTypeId: item.materialTypeId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                thickness: item.thickness,
                width: item.width,
                height: item.height,
                length: item.length,
                notes: item.notes
            }));

            await this.repository.createPurchaseOrderItems(itemsToCreate);

            logger.info('Purchase order created', { poId: order.id, poNumber: order.poNumber });
            void eventBus.publishTyped('purchaseOrder.created', 'purchaseOrder', order.id, { purchaseOrder: order });

            return { success: true, data: order };
        } catch (error) {
            logger.error('Failed to create purchase order', { error });
            return { success: false, error: 'Failed to create purchase order' };
        }
    }

    async updatePurchaseOrderStatus(
        id: string,
        status: PurchaseOrderStatus,
        approvedById?: string
    ): Promise<IServiceResult<PurchaseOrder>> {
        try {
            const updateData: Partial<NewPurchaseOrder> = { status };

            if (status === 'approved' && approvedById) {
                updateData.approvedById = approvedById;
            }
            if (status === 'received') {
                updateData.actualDeliveryDate = new Date();
            }

            const updated = await this.repository.updatePurchaseOrder(id, updateData);

            if (!updated) {
                return { success: false, error: 'Purchase order not found' };
            }

            logger.info('Purchase order status updated', { poId: id, status });
            void eventBus.publishTyped('purchaseOrder.statusChanged', 'purchaseOrder', updated.id, { purchaseOrder: updated, newStatus: status });

            return { success: true, data: updated };
        } catch (error) {
            logger.error('Failed to update purchase order status', { id, error });
            return { success: false, error: 'Failed to update status' };
        }
    }

    async deletePurchaseOrder(id: string): Promise<IServiceResult<void>> {
        try {
            const deleted = await this.repository.deletePurchaseOrder(id, true);

            if (!deleted) {
                return { success: false, error: 'Purchase order not found' };
            }

            logger.info('Purchase order deleted', { poId: id });
            void eventBus.publishTyped('purchaseOrder.deleted', 'purchaseOrder', id, { purchaseOrderId: id });

            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to delete purchase order', { id, error });
            return { success: false, error: 'Failed to delete purchase order' };
        }
    }

    // ==================== STATISTICS ====================

    async getStats(tenantId: string): Promise<IServiceResult<{ supplierCount: number; poCount: number }>> {
        try {
            const [supplierCount, poCount] = await Promise.all([
                this.repository.getSupplierCount(tenantId),
                this.repository.getPurchaseOrderCount(tenantId)
            ]);
            return { success: true, data: { supplierCount, poCount } };
        } catch (error) {
            logger.error('Failed to get stats', { error });
            return { success: false, error: 'Failed to get statistics' };
        }
    }
}
