/**
 * Order Types
 * Core domain types for Order module
 */

import { orders, orderItems } from '../../../db/schema';
import { IResult } from '../../../core/interfaces';
import { ICreateOrderInput, ICreateOrderItemInput, IUpdateOrderInput, IOrderFilter } from '../../../core/interfaces';
import type { IOrderDto, IOrderWithItemsDto, IOrderItemDto } from './dto';

// Re-export from core interfaces for compatibility
export type { ICreateOrderInput, ICreateOrderItemInput, IUpdateOrderInput, IOrderFilter } from '../../../core/interfaces';

/**
 * Order entity type inferred from Drizzle schema
 */
export type Order = typeof orders.$inferSelect;

/**
 * Order item entity type
 */
export type OrderItem = typeof orderItems.$inferSelect;

/**
 * Order with related data
 */
export type OrderWithRelations = Order & {
    items?: OrderItem[];
    customer?: { id: string; code: string; name: string } | null;
    createdBy?: { id: string; firstName: string; lastName: string };
    _count?: { items: number };
};

/**
 * Order repository interface
 */
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

/**
 * Order service interface
 */
export interface IOrderService {
    getOrders(filter?: IOrderFilter): Promise<IResult<IOrderDto[]>>;
    getOrderById(id: string): Promise<IResult<IOrderWithItemsDto>>;
    createOrder(data: ICreateOrderInput, userId: string): Promise<IResult<IOrderDto>>;
    updateOrder(id: string, data: IUpdateOrderInput): Promise<IResult<IOrderDto>>;
    deleteOrder(id: string): Promise<IResult<void>>;
    addOrderItem(orderId: string, data: ICreateOrderItemInput): Promise<IResult<IOrderItemDto>>;
    updateOrderStatus(id: string, status: string): Promise<IResult<IOrderDto>>;
}
