/**
 * Import Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { stockItems, materialTypes, customers, orders, orderItems } from '../../db/schema';
import { sql } from 'drizzle-orm';

// ==================== TYPE DEFINITIONS ====================

export interface IStockItemImport {
    code: string;
    name: string;
    materialTypeId: string;
    stockType: 'BAR_1D' | 'SHEET_2D';
    thickness: number;
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
    unitPrice?: number;
    locationId?: string;
}

export interface IMaterialImport {
    name: string;
    description?: string;
    defaultDensity?: number;
}

export interface ICustomerImport {
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
}

export interface IOrderWithItemsInput {
    orderNumber: string;
    customerId?: string;
    createdById: string;
    priority?: number;
    dueDate?: Date;
    notes?: string;
    items: Array<{
        itemCode?: string;
        itemName?: string;
        geometryType: string;
        length?: number;
        width?: number;
        height?: number;
        diameter?: number;
        materialTypeId: string;
        thickness: number;
        quantity: number;
        canRotate?: boolean;
    }>;
}

export interface IImportRepository {
    importStockItems(data: IStockItemImport[]): Promise<number>;
    importMaterials(data: IMaterialImport[]): Promise<number>;
    importCustomers(data: ICustomerImport[]): Promise<number>;
    getOrderCount(): Promise<number>;
    createOrderWithItems(data: IOrderWithItemsInput): Promise<{ id: string; orderNumber: string }>;
}

// ==================== REPOSITORY ====================

export class ImportRepository implements IImportRepository {
    constructor(private readonly db: Database) { }

    async importStockItems(data: IStockItemImport[]): Promise<number> {
        if (data.length === 0) return 0;

        const result = await this.db.insert(stockItems)
            .values(data.map(item => ({
                code: item.code,
                name: item.name,
                materialTypeId: item.materialTypeId,
                stockType: item.stockType,
                thickness: item.thickness,
                length: item.length,
                width: item.width,
                height: item.height,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                locationId: item.locationId
            })))
            .onConflictDoNothing()
            .returning();
        return result.length;
    }

    async importMaterials(data: IMaterialImport[]): Promise<number> {
        if (data.length === 0) return 0;

        const result = await this.db.insert(materialTypes)
            .values(data.map(item => ({
                name: item.name,
                description: item.description,
                defaultDensity: item.defaultDensity
            })))
            .onConflictDoNothing()
            .returning();
        return result.length;
    }

    async importCustomers(data: ICustomerImport[]): Promise<number> {
        if (data.length === 0) return 0;

        const result = await this.db.insert(customers)
            .values(data.map(item => ({
                code: item.code,
                name: item.name,
                email: item.email,
                phone: item.phone,
                address: item.address,
                taxId: item.taxId
            })))
            .onConflictDoNothing()
            .returning();
        return result.length;
    }

    async getOrderCount(): Promise<number> {
        const result = await this.db.select({
            count: sql<number>`count(*)`
        }).from(orders);
        return Number(result[0]?.count ?? 0);
    }

    async createOrderWithItems(data: IOrderWithItemsInput): Promise<{ id: string; orderNumber: string }> {
        // Create order
        const [order] = await this.db.insert(orders).values({
            orderNumber: data.orderNumber,
            customerId: data.customerId,
            createdById: data.createdById,
            priority: data.priority ?? 5,
            dueDate: data.dueDate,
            notes: data.notes
        }).returning();

        // Create order items
        if (data.items.length > 0) {
            await this.db.insert(orderItems).values(
                data.items.map(item => ({
                    orderId: order.id,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    geometryType: item.geometryType as 'BAR_1D' | 'RECTANGLE' | 'CIRCLE' | 'SQUARE' | 'POLYGON' | 'FREEFORM',
                    length: item.length,
                    width: item.width,
                    height: item.height,
                    diameter: item.diameter,
                    materialTypeId: item.materialTypeId,
                    thickness: item.thickness,
                    quantity: item.quantity,
                    canRotate: item.canRotate ?? true
                }))
            );
        }

        return { id: order.id, orderNumber: order.orderNumber };
    }
}
