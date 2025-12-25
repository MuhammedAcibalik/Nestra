/**
 * Order Commands
 * Following CQRS pattern - Commands modify state
 */

import { ICommand, ICommandResult } from '../../../core/cqrs';

// ==================== CREATE ORDER ====================

export interface ICreateOrderData {
    customerId: string;
    description?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    dueDate?: Date;
    items: IOrderItemData[];
}

export interface IOrderItemData {
    materialTypeId: string;
    thickness: number;
    width: number;
    length: number;
    quantity: number;
    notes?: string;
}

export class CreateOrderCommand implements ICommand<ICommandResult<{ orderId: string }>> {
    constructor(
        public readonly data: ICreateOrderData,
        public readonly tenantId: string,
        public readonly userId: string
    ) {}
}

// ==================== UPDATE ORDER STATUS ====================

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';

export class UpdateOrderStatusCommand implements ICommand<ICommandResult> {
    constructor(
        public readonly orderId: string,
        public readonly status: OrderStatus,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly reason?: string
    ) {}
}

// ==================== DELETE ORDER ====================

export class DeleteOrderCommand implements ICommand<ICommandResult> {
    constructor(
        public readonly orderId: string,
        public readonly tenantId: string,
        public readonly userId: string
    ) {}
}

// ==================== ADD ORDER ITEM ====================

export class AddOrderItemCommand implements ICommand<ICommandResult<{ itemId: string }>> {
    constructor(
        public readonly orderId: string,
        public readonly item: IOrderItemData,
        public readonly tenantId: string,
        public readonly userId: string
    ) {}
}
