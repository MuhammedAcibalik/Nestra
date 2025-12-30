/**
 * Order DTOs
 * Data Transfer Objects for API layer
 */

import { OrderStatus, GeometryType } from '../../../db/schema/enums';

// Re-export GeometryType for convenience (OrderStatus is defined in cqrs/commands.ts)
export { GeometryType } from '../../../db/schema/enums';

/**
 * Order DTO - Used for API responses
 */
export interface IOrderDto {
    id: string;
    orderNumber: string;
    customer?: { id: string; code: string; name: string } | null;
    status: OrderStatus;
    priority: number;
    notes?: string;
    dueDate?: Date;
    itemCount: number;
    createdBy?: { id: string; firstName: string; lastName: string };
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Order item DTO
 */
export interface IOrderItemDto {
    id: string;
    partCode: string;
    partName?: string;
    geometryType: GeometryType;
    length: number;
    width: number;
    height: number;
    quantity: number;
    cutQuantity: number;
    materialId?: string;
}

/**
 * Order with items DTO
 */
export interface IOrderWithItemsDto extends IOrderDto {
    items: IOrderItemDto[];
}

/**
 * Order filter for queries
 */
export interface IOrderFilterDto {
    status?: OrderStatus;
    customerId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
}

/**
 * Create order input
 */
export interface ICreateOrderInputDto {
    orderNumber?: string;
    customerId?: string;
    priority?: number;
    notes?: string;
    dueDate?: Date;
}

/**
 * Update order input
 */
export interface IUpdateOrderInputDto {
    customerId?: string;
    priority?: number;
    status?: OrderStatus;
    notes?: string;
    dueDate?: Date;
}

/**
 * Create order item input
 */
export interface ICreateOrderItemInputDto {
    partCode: string;
    partName?: string;
    geometryType: GeometryType;
    length: number;
    width: number;
    height?: number;
    quantity: number;
    materialId?: string;
}
