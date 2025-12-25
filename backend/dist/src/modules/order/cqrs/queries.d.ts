/**
 * Order Queries
 * Following CQRS pattern - Queries read state
 */
import { IQuery, IPaginatedResult } from '../../../core/cqrs';
export interface IOrderDto {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    status: string;
    priority: string;
    description?: string;
    dueDate?: Date;
    totalItems: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IOrderDetailDto extends IOrderDto {
    items: IOrderItemDto[];
}
export interface IOrderItemDto {
    id: string;
    materialTypeName: string;
    thickness: number;
    width: number;
    length: number;
    quantity: number;
    notes?: string;
}
export declare class GetOrderByIdQuery implements IQuery<IOrderDetailDto | null> {
    readonly orderId: string;
    readonly tenantId: string;
    constructor(orderId: string, tenantId: string);
}
export interface IListOrdersFilter {
    status?: string;
    customerId?: string;
    priority?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
}
export interface IListOrdersOptions {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'dueDate' | 'orderNumber';
    sortOrder?: 'asc' | 'desc';
}
export declare class ListOrdersQuery implements IQuery<IPaginatedResult<IOrderDto>> {
    readonly tenantId: string;
    readonly filter?: IListOrdersFilter | undefined;
    readonly options?: IListOrdersOptions | undefined;
    constructor(tenantId: string, filter?: IListOrdersFilter | undefined, options?: IListOrdersOptions | undefined);
}
export interface IOrderStatistics {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    completedThisMonth: number;
    pendingCount: number;
}
export declare class GetOrderStatisticsQuery implements IQuery<IOrderStatistics> {
    readonly tenantId: string;
    readonly fromDate?: Date | undefined;
    readonly toDate?: Date | undefined;
    constructor(tenantId: string, fromDate?: Date | undefined, toDate?: Date | undefined);
}
//# sourceMappingURL=queries.d.ts.map