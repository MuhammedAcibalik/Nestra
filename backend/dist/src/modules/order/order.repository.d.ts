/**
 * Order Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { orders, orderItems } from '../../db/schema';
import { ICreateOrderInput, ICreateOrderItemInput, IUpdateOrderInput, IOrderFilter } from '../../core/interfaces';
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderWithRelations = Order & {
    items?: OrderItem[];
    customer?: {
        id: string;
        code: string;
        name: string;
    } | null;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    _count?: {
        items: number;
    };
};
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
export declare class OrderRepository implements IOrderRepository {
    private readonly db;
    private orderCounter;
    constructor(db: Database);
    findById(id: string): Promise<OrderWithRelations | null>;
    findAll(filter?: IOrderFilter): Promise<OrderWithRelations[]>;
    findByOrderNumber(orderNumber: string): Promise<Order | null>;
    create(data: ICreateOrderInput, userId: string): Promise<Order>;
    update(id: string, data: IUpdateOrderInput): Promise<Order>;
    updateStatus(id: string, status: string): Promise<Order>;
    delete(id: string): Promise<void>;
    addItem(orderId: string, data: ICreateOrderItemInput): Promise<OrderItem>;
}
//# sourceMappingURL=order.repository.d.ts.map