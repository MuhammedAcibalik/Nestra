/**
 * Order Commands
 * Following CQRS pattern - Commands modify state
 */
import { ICommand, ICommandResult } from '../../../core/cqrs';
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
export declare class CreateOrderCommand implements ICommand<ICommandResult<{
    orderId: string;
}>> {
    readonly data: ICreateOrderData;
    readonly tenantId: string;
    readonly userId: string;
    constructor(data: ICreateOrderData, tenantId: string, userId: string);
}
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';
export declare class UpdateOrderStatusCommand implements ICommand<ICommandResult> {
    readonly orderId: string;
    readonly status: OrderStatus;
    readonly tenantId: string;
    readonly userId: string;
    readonly reason?: string | undefined;
    constructor(orderId: string, status: OrderStatus, tenantId: string, userId: string, reason?: string | undefined);
}
export declare class DeleteOrderCommand implements ICommand<ICommandResult> {
    readonly orderId: string;
    readonly tenantId: string;
    readonly userId: string;
    constructor(orderId: string, tenantId: string, userId: string);
}
export declare class AddOrderItemCommand implements ICommand<ICommandResult<{
    itemId: string;
}>> {
    readonly orderId: string;
    readonly item: IOrderItemData;
    readonly tenantId: string;
    readonly userId: string;
    constructor(orderId: string, item: IOrderItemData, tenantId: string, userId: string);
}
//# sourceMappingURL=commands.d.ts.map