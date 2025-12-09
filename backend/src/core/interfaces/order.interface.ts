/**
 * Order Module Interfaces
 */

import { IResult } from './result.interface';

export interface IOrderService {
    getOrders(filter?: IOrderFilter): Promise<IResult<IOrderDto[]>>;
    getOrderById(id: string): Promise<IResult<IOrderDto>>;
    createOrder(data: ICreateOrderInput, userId: string): Promise<IResult<IOrderDto>>;
    updateOrder(id: string, data: IUpdateOrderInput): Promise<IResult<IOrderDto>>;
    deleteOrder(id: string): Promise<IResult<void>>;
    addOrderItem(orderId: string, data: ICreateOrderItemInput): Promise<IResult<IOrderItemDto>>;
    importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<IOrderDto>>;
}

export interface IOrderFilter {
    status?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface IOrderDto {
    id: string;
    orderNumber: string;
    customer?: ICustomerDto;
    status: string;
    priority: number;
    dueDate?: Date;
    items: IOrderItemDto[];
    itemCount: number;
    createdAt: Date;
}

export interface IOrderItemDto {
    id: string;
    itemCode?: string;
    itemName?: string;
    geometryType: string;
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    thickness: number;
    quantity: number;
    producedQty: number;
    canRotate: boolean;
}

export interface ICreateOrderInput {
    customerId?: string;
    priority?: number;
    dueDate?: Date;
    notes?: string;
    items?: ICreateOrderItemInput[];
}

export interface IUpdateOrderInput extends Partial<ICreateOrderInput> {
    status?: string;
}

export interface ICreateOrderItemInput {
    itemCode?: string;
    itemName?: string;
    geometryType: string;
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    materialTypeId: string;
    thickness: number;
    quantity: number;
    canRotate?: boolean;
}

export interface IColumnMapping {
    itemCode?: string;
    itemName?: string;
    geometryType?: string;
    length?: string;
    width?: string;
    height?: string;
    thickness?: string;
    quantity?: string;
    canRotate?: string;
    materialTypeId?: string;
}

export interface ICustomerDto {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
}
