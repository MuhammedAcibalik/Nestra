/**
 * Order Repository
 * Following SRP - Only handles order data access
 */

import { PrismaClient, Prisma, Order, OrderItem } from '@prisma/client';
import { IOrderFilter, ICreateOrderInput, IUpdateOrderInput, ICreateOrderItemInput } from '../../core/interfaces';

export type OrderWithRelations = Order & {
    customer?: { id: string; code: string; name: string } | null;
    createdBy?: { firstName: string; lastName: string };
    items?: OrderItem[];
    _count?: { items: number };
};

interface OrderWhereInput {
    status?: string;
    customerId?: string;
    createdAt?: { gte?: Date; lte?: Date };
}

export interface IOrderRepository {
    findById(id: string): Promise<OrderWithRelations | null>;
    findAll(filter?: IOrderFilter): Promise<OrderWithRelations[]>;
    findByNumber(orderNumber: string): Promise<Order | null>;
    create(data: ICreateOrderInput, userId: string): Promise<Order>;
    update(id: string, data: IUpdateOrderInput): Promise<Order>;
    updateStatus(id: string, status: string): Promise<Order>;
    delete(id: string): Promise<void>;
    addItem(orderId: string, data: ICreateOrderItemInput): Promise<OrderItem>;
    getItems(orderId: string): Promise<OrderItem[]>;
    generateOrderNumber(): Promise<string>;
}

export class OrderRepository implements IOrderRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<OrderWithRelations | null> {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, code: true, name: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                items: true
            }
        });
    }

    async findAll(filter?: IOrderFilter): Promise<OrderWithRelations[]> {
        const where: OrderWhereInput = {};

        if (filter?.status) where.status = filter.status;
        if (filter?.customerId) where.customerId = filter.customerId;
        if (filter?.startDate || filter?.endDate) {
            where.createdAt = {};
            if (filter.startDate) where.createdAt.gte = filter.startDate;
            if (filter.endDate) where.createdAt.lte = filter.endDate;
        }

        return this.prisma.order.findMany({
            where: where as Prisma.OrderWhereInput,
            include: {
                customer: { select: { id: true, code: true, name: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByNumber(orderNumber: string): Promise<Order | null> {
        return this.prisma.order.findUnique({ where: { orderNumber } });
    }

    async create(data: ICreateOrderInput, userId: string): Promise<Order> {
        const orderNumber = await this.generateOrderNumber();

        return this.prisma.order.create({
            data: {
                orderNumber,
                customerId: data.customerId,
                createdById: userId,
                priority: data.priority ?? 5,
                dueDate: data.dueDate,
                notes: data.notes,
                items: data.items ? {
                    create: data.items.map((item) => ({
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
                } : undefined
            }
        });
    }

    async update(id: string, data: IUpdateOrderInput): Promise<Order> {
        return this.prisma.order.update({
            where: { id },
            data: {
                customerId: data.customerId,
                priority: data.priority,
                dueDate: data.dueDate,
                notes: data.notes,
                status: data.status as 'DRAFT' | 'CONFIRMED' | 'IN_PLANNING' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED' | undefined
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.order.delete({ where: { id } });
    }

    async updateStatus(id: string, status: string): Promise<Order> {
        return this.prisma.order.update({
            where: { id },
            data: {
                status: status as 'DRAFT' | 'CONFIRMED' | 'IN_PLANNING' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED'
            }
        });
    }

    async addItem(orderId: string, data: ICreateOrderItemInput): Promise<OrderItem> {
        return this.prisma.orderItem.create({
            data: {
                orderId,
                itemCode: data.itemCode,
                itemName: data.itemName,
                geometryType: data.geometryType as 'BAR_1D' | 'RECTANGLE' | 'CIRCLE' | 'SQUARE' | 'POLYGON' | 'FREEFORM',
                length: data.length,
                width: data.width,
                height: data.height,
                diameter: data.diameter,
                materialTypeId: data.materialTypeId,
                thickness: data.thickness,
                quantity: data.quantity,
                canRotate: data.canRotate ?? true
            }
        });
    }

    async getItems(orderId: string): Promise<OrderItem[]> {
        return this.prisma.orderItem.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async generateOrderNumber(): Promise<string> {
        const count = await this.prisma.order.count();
        return `ORD-${String(count + 1).padStart(6, '0')}`;
    }
}
