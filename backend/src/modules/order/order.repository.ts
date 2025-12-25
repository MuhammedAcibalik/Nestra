/**
 * Order Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */

import { Database } from '../../db';
import { orders, orderItems } from '../../db/schema';
import { OrderStatus, GeometryType } from '../../db/schema/enums';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { ICreateOrderInput, ICreateOrderItemInput, IUpdateOrderInput, IOrderFilter } from '../../core/interfaces';
import { createFilter } from '../../core/database';
import { getCurrentTenantIdOptional } from '../../core/tenant';

// Type definitions
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export type OrderWithRelations = Order & {
    items?: OrderItem[];
    customer?: { id: string; code: string; name: string } | null;
    createdBy?: { id: string; firstName: string; lastName: string };
    _count?: { items: number };
};

// Re-export from core interfaces for service compatibility
export type { ICreateOrderInput, ICreateOrderItemInput, IUpdateOrderInput, IOrderFilter } from '../../core/interfaces';

export interface IOrderRepository {
    findById(id: string): Promise<OrderWithRelations | null>;
    findAll(filter?: IOrderFilter): Promise<OrderWithRelations[]>;
    findByOrderNumber(orderNumber: string): Promise<Order | null>;
    create(data: ICreateOrderInput, userId: string): Promise<Order>;
    update(id: string, data: IUpdateOrderInput): Promise<Order>;
    delete(id: string): Promise<void>;
    addItem(orderId: string, data: ICreateOrderItemInput): Promise<OrderItem>;
    updateStatus(id: string, status: string): Promise<Order>;
}

export class OrderRepository implements IOrderRepository {
    private orderCounter = 1;

    constructor(private readonly db: Database) { }

    // ==================== TENANT FILTERING ====================

    /**
     * Get tenant filter condition if in tenant context
     */
    private getTenantFilter(): SQL | undefined {
        const tenantId = getCurrentTenantIdOptional();
        if (!tenantId) return undefined;
        return eq(orders.tenantId, tenantId);
    }

    /**
     * Combine tenant filter with additional conditions
     */
    private withTenantFilter(conditions: SQL[]): SQL | undefined {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter) conditions.push(tenantFilter);
        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    /**
     * Get current tenant ID for create operations
     */
    private getCurrentTenantId(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    // ==================== READ OPERATIONS ====================

    async findById(id: string): Promise<OrderWithRelations | null> {
        const conditions = [eq(orders.id, id)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.orders.findFirst({
            where,
            with: {
                items: true,
                customer: true,
                createdBy: true
            }
        });
        return result ?? null;
    }

    async findAll(filter?: IOrderFilter): Promise<OrderWithRelations[]> {
        const where = createFilter()
            .eq(orders.status, filter?.status as OrderStatus | undefined)
            .eq(orders.customerId, filter?.customerId)
            .eq(orders.tenantId, this.getCurrentTenantId())
            .build();

        return this.db.query.orders.findMany({
            where,
            with: {
                items: true,
                customer: true,
                createdBy: true
            },
            orderBy: [desc(orders.createdAt)]
        });
    }

    async findByOrderNumber(orderNumber: string): Promise<Order | null> {
        const conditions = [eq(orders.orderNumber, orderNumber)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.orders.findFirst({
            where
        });
        return result ?? null;
    }

    // ==================== WRITE OPERATIONS ====================

    async create(data: ICreateOrderInput, userId: string): Promise<Order> {
        // Generate order number if not provided
        const orderNumber = `ORD-${Date.now()}-${this.orderCounter++}`;

        const [result] = await this.db.insert(orders).values({
            orderNumber,
            tenantId: this.getCurrentTenantId(), // Auto-inject tenant ID
            customerId: data.customerId,
            createdById: userId,
            priority: data.priority ?? 5,
            dueDate: data.dueDate,
            notes: data.notes
        }).returning();
        return result;
    }

    async update(id: string, data: IUpdateOrderInput): Promise<Order> {
        // Verify ownership via tenant filter
        const conditions = [eq(orders.id, id)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db.update(orders)
            .set({
                status: data.status as OrderStatus,
                priority: data.priority,
                dueDate: data.dueDate,
                notes: data.notes,
                updatedAt: new Date()
            })
            .where(where ?? eq(orders.id, id))
            .returning();
        return result;
    }

    async updateStatus(id: string, status: string): Promise<Order> {
        const conditions = [eq(orders.id, id)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db.update(orders)
            .set({
                status: status as OrderStatus,
                updatedAt: new Date()
            })
            .where(where ?? eq(orders.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        const conditions = [eq(orders.id, id)];
        const where = this.withTenantFilter(conditions);

        await this.db.delete(orders).where(where ?? eq(orders.id, id));
    }

    // ==================== ORDER ITEMS ====================

    async addItem(orderId: string, data: ICreateOrderItemInput): Promise<OrderItem> {
        const [result] = await this.db.insert(orderItems).values({
            orderId: orderId,
            itemCode: data.itemCode,
            itemName: data.itemName,
            geometryType: data.geometryType as GeometryType,
            length: data.length,
            width: data.width,
            height: data.height,
            diameter: data.diameter,
            materialTypeId: data.materialTypeId,
            thickness: data.thickness,
            quantity: data.quantity,
            canRotate: data.canRotate ?? true
        }).returning();
        return result;
    }
}

