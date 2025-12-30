/**
 * Supplier Repository
 * Data access layer for suppliers, purchase orders, and purchase order items
 */

import { eq, and, isNull, desc, ilike, or } from 'drizzle-orm';
import { Database } from '../../db';
import {
    suppliers,
    purchaseOrders,
    purchaseOrderItems,
    Supplier,
    NewSupplier,
    PurchaseOrder,
    NewPurchaseOrder,
    PurchaseOrderItem,
    NewPurchaseOrderItem,
    SupplierStatus,
    PurchaseOrderStatus
} from '../../db/schema';

// Drizzle delete result type
interface IQueryResult {
    rowCount?: number;
}

// ==================== INTERFACES ====================

export interface ISupplierFilter {
    tenantId?: string;
    status?: string;
    search?: string;
    includeDeleted?: boolean;
}

export interface IPurchaseOrderFilter {
    tenantId?: string;
    supplierId?: string;
    status?: string;
    search?: string;
    includeDeleted?: boolean;
}

// ==================== REPOSITORY ====================

export class SupplierRepository {
    constructor(private readonly db: Database) { }

    // ==================== SUPPLIERS ====================

    async findAllSuppliers(filter: ISupplierFilter = {}): Promise<Supplier[]> {
        const conditions = [];

        if (filter.tenantId) {
            conditions.push(eq(suppliers.tenantId, filter.tenantId));
        }
        if (filter.status) {
            conditions.push(eq(suppliers.status, filter.status as SupplierStatus));
        }
        if (filter.search) {
            conditions.push(
                or(
                    ilike(suppliers.name, `%${filter.search}%`),
                    ilike(suppliers.code, `%${filter.search}%`)
                )
            );
        }
        if (!filter.includeDeleted) {
            conditions.push(isNull(suppliers.deletedAt));
        }

        const query = this.db
            .select()
            .from(suppliers)
            .orderBy(desc(suppliers.createdAt));

        return conditions.length > 0
            ? query.where(and(...conditions))
            : query;
    }

    async findSupplierById(id: string): Promise<Supplier | null> {
        const [supplier] = await this.db
            .select()
            .from(suppliers)
            .where(and(eq(suppliers.id, id), isNull(suppliers.deletedAt)))
            .limit(1);
        return supplier ?? null;
    }

    async findSupplierByCode(code: string): Promise<Supplier | null> {
        const [supplier] = await this.db
            .select()
            .from(suppliers)
            .where(and(eq(suppliers.code, code), isNull(suppliers.deletedAt)))
            .limit(1);
        return supplier ?? null;
    }

    async createSupplier(data: NewSupplier): Promise<Supplier> {
        const [supplier] = await this.db
            .insert(suppliers)
            .values(data)
            .returning();
        return supplier;
    }

    async updateSupplier(id: string, data: Partial<NewSupplier>, expectedVersion?: number): Promise<Supplier | null> {
        const conditions = [eq(suppliers.id, id), isNull(suppliers.deletedAt)];

        if (expectedVersion !== undefined) {
            conditions.push(eq(suppliers.version, expectedVersion));
        }

        const [updated] = await this.db
            .update(suppliers)
            .set({
                ...data,
                version: expectedVersion !== undefined ? expectedVersion + 1 : undefined,
                updatedAt: new Date()
            })
            .where(and(...conditions))
            .returning();
        return updated ?? null;
    }

    async deleteSupplier(id: string, soft = true): Promise<boolean> {
        if (soft) {
            const [deleted] = await this.db
                .update(suppliers)
                .set({ deletedAt: new Date(), updatedAt: new Date() })
                .where(and(eq(suppliers.id, id), isNull(suppliers.deletedAt)))
                .returning();
            return deleted !== undefined;
        } else {
            const result = await this.db
                .delete(suppliers)
                .where(eq(suppliers.id, id)) as unknown as IQueryResult;
            return (result.rowCount ?? 0) > 0;
        }
    }

    // ==================== PURCHASE ORDERS ====================

    async findAllPurchaseOrders(filter: IPurchaseOrderFilter = {}): Promise<PurchaseOrder[]> {
        const conditions = [];

        if (filter.tenantId) {
            conditions.push(eq(purchaseOrders.tenantId, filter.tenantId));
        }
        if (filter.supplierId) {
            conditions.push(eq(purchaseOrders.supplierId, filter.supplierId));
        }
        if (filter.status) {
            conditions.push(eq(purchaseOrders.status, filter.status as PurchaseOrderStatus));
        }
        if (filter.search) {
            conditions.push(ilike(purchaseOrders.poNumber, `%${filter.search}%`));
        }
        if (!filter.includeDeleted) {
            conditions.push(isNull(purchaseOrders.deletedAt));
        }

        const query = this.db
            .select()
            .from(purchaseOrders)
            .orderBy(desc(purchaseOrders.createdAt));

        return conditions.length > 0
            ? query.where(and(...conditions))
            : query;
    }

    async findPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
        const [po] = await this.db
            .select()
            .from(purchaseOrders)
            .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt)))
            .limit(1);
        return po ?? null;
    }

    async findPurchaseOrderByNumber(poNumber: string): Promise<PurchaseOrder | null> {
        const [po] = await this.db
            .select()
            .from(purchaseOrders)
            .where(and(eq(purchaseOrders.poNumber, poNumber), isNull(purchaseOrders.deletedAt)))
            .limit(1);
        return po ?? null;
    }

    async createPurchaseOrder(data: NewPurchaseOrder): Promise<PurchaseOrder> {
        const [po] = await this.db
            .insert(purchaseOrders)
            .values(data)
            .returning();
        return po;
    }

    async updatePurchaseOrder(id: string, data: Partial<NewPurchaseOrder>, expectedVersion?: number): Promise<PurchaseOrder | null> {
        const conditions = [eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt)];

        if (expectedVersion !== undefined) {
            conditions.push(eq(purchaseOrders.version, expectedVersion));
        }

        const [updated] = await this.db
            .update(purchaseOrders)
            .set({
                ...data,
                version: expectedVersion !== undefined ? expectedVersion + 1 : undefined,
                updatedAt: new Date()
            })
            .where(and(...conditions))
            .returning();
        return updated ?? null;
    }

    async deletePurchaseOrder(id: string, soft = true): Promise<boolean> {
        if (soft) {
            const [deleted] = await this.db
                .update(purchaseOrders)
                .set({ deletedAt: new Date(), updatedAt: new Date() })
                .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt)))
                .returning();
            return deleted !== undefined;
        } else {
            const result = await this.db
                .delete(purchaseOrders)
                .where(eq(purchaseOrders.id, id)) as unknown as IQueryResult;
            return (result.rowCount ?? 0) > 0;
        }
    }

    // ==================== PURCHASE ORDER ITEMS ====================

    async findPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
        return this.db
            .select()
            .from(purchaseOrderItems)
            .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
    }

    async createPurchaseOrderItem(data: NewPurchaseOrderItem): Promise<PurchaseOrderItem> {
        const [item] = await this.db
            .insert(purchaseOrderItems)
            .values(data)
            .returning();
        return item;
    }

    async createPurchaseOrderItems(items: NewPurchaseOrderItem[]): Promise<PurchaseOrderItem[]> {
        if (items.length === 0) return [];
        return this.db
            .insert(purchaseOrderItems)
            .values(items)
            .returning();
    }

    async updatePurchaseOrderItem(id: string, data: Partial<NewPurchaseOrderItem>): Promise<PurchaseOrderItem | null> {
        const [updated] = await this.db
            .update(purchaseOrderItems)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(purchaseOrderItems.id, id))
            .returning();
        return updated ?? null;
    }

    async deletePurchaseOrderItem(id: string): Promise<boolean> {
        const result = await this.db
            .delete(purchaseOrderItems)
            .where(eq(purchaseOrderItems.id, id)) as unknown as IQueryResult;
        return (result.rowCount ?? 0) > 0;
    }

    // ==================== STATISTICS ====================

    async getSupplierCount(tenantId: string): Promise<number> {
        const result = await this.db
            .select()
            .from(suppliers)
            .where(and(
                eq(suppliers.tenantId, tenantId),
                isNull(suppliers.deletedAt)
            ));
        return result.length;
    }

    async getPurchaseOrderCount(tenantId: string): Promise<number> {
        const result = await this.db
            .select()
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.tenantId, tenantId),
                isNull(purchaseOrders.deletedAt)
            ));
        return result.length;
    }

    // ==================== PO NUMBER GENERATION ====================

    async generatePoNumber(tenantId: string): Promise<string> {
        const count = await this.getPurchaseOrderCount(tenantId);
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `PO-${year}${month}-${String(count + 1).padStart(5, '0')}`;
    }
}
