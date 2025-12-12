/**
 * Import Repository
 * Handles data access for import operations
 * Following SRP - Only handles import-related data queries
 */

import { PrismaClient, GeometryType } from '@prisma/client';
import { ICreateOrderItemInput } from '../../core/interfaces';

// ==================== INTERFACES ====================

export interface ICreatedOrder {
    id: string;
    orderNumber: string;
}

export interface IImportRepository {
    getOrderCount(): Promise<number>;
    createOrderWithItems(
        orderNumber: string,
        userId: string,
        notes: string,
        items: ICreateOrderItemInput[]
    ): Promise<ICreatedOrder>;
}

// ==================== REPOSITORY ====================

export class ImportRepository implements IImportRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async getOrderCount(): Promise<number> {
        return this.prisma.order.count();
    }

    async createOrderWithItems(
        orderNumber: string,
        userId: string,
        notes: string,
        items: ICreateOrderItemInput[]
    ): Promise<ICreatedOrder> {
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                createdById: userId,
                notes,
                items: {
                    create: items.map(item => ({
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        geometryType: (item.geometryType || 'RECTANGLE') as GeometryType,
                        length: item.length,
                        width: item.width,
                        height: item.height,
                        diameter: item.diameter,
                        materialTypeId: item.materialTypeId,
                        thickness: item.thickness,
                        quantity: item.quantity,
                        canRotate: item.canRotate ?? true
                    }))
                }
            }
        });

        return {
            id: order.id,
            orderNumber: order.orderNumber
        };
    }
}
