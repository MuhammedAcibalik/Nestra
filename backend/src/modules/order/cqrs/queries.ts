/**
 * Order Queries
 * Following CQRS pattern - Queries read state
 */

import { IQuery, IPaginatedResult } from '../../../core/cqrs';

// ==================== ORDER DTO ====================

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

// ==================== GET ORDER BY ID ====================

export class GetOrderByIdQuery implements IQuery<IOrderDetailDto | null> {
    constructor(
        public readonly orderId: string,
        public readonly tenantId: string
    ) {}
}

// ==================== LIST ORDERS ====================

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

export class ListOrdersQuery implements IQuery<IPaginatedResult<IOrderDto>> {
    constructor(
        public readonly tenantId: string,
        public readonly filter?: IListOrdersFilter,
        public readonly options?: IListOrdersOptions
    ) {}
}

// ==================== GET ORDER STATISTICS ====================

export interface IOrderStatistics {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    completedThisMonth: number;
    pendingCount: number;
}

export class GetOrderStatisticsQuery implements IQuery<IOrderStatistics> {
    constructor(
        public readonly tenantId: string,
        public readonly fromDate?: Date,
        public readonly toDate?: Date
    ) {}
}
