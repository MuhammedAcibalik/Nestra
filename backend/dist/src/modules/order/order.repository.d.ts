/**
 * Order Repository
 * Following SRP - Only handles order data access
 */
import { PrismaClient, Order, OrderItem } from '@prisma/client';
import { IOrderFilter, ICreateOrderInput, IUpdateOrderInput, ICreateOrderItemInput } from '../../core/interfaces';
export type OrderWithRelations = Order & {
    customer?: {
        id: string;
        code: string;
        name: string;
    } | null;
    createdBy?: {
        firstName: string;
        lastName: string;
    };
    items?: OrderItem[];
    _count?: {
        items: number;
    };
};
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
export declare class OrderRepository implements IOrderRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<OrderWithRelations | null>;
    findAll(filter?: IOrderFilter): Promise<OrderWithRelations[]>;
    findByNumber(orderNumber: string): Promise<Order | null>;
    create(data: ICreateOrderInput, userId: string): Promise<Order>;
    update(id: string, data: IUpdateOrderInput): Promise<Order>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, status: string): Promise<Order>;
    addItem(orderId: string, data: ICreateOrderItemInput): Promise<OrderItem>;
    getItems(orderId: string): Promise<OrderItem[]>;
    generateOrderNumber(): Promise<string>;
}
//# sourceMappingURL=order.repository.d.ts.map