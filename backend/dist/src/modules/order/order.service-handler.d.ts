/**
 * Order Service Handler
 * Exposes order module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IOrderRepository } from './order.repository';
export interface IOrderSummary {
    id: string;
    orderNumber: string;
    status: string;
    itemCount: number;
    createdAt: Date;
}
export interface IOrderItemSummary {
    id: string;
    itemCode: string | null;
    itemName: string | null;
    materialTypeId: string;
    thickness: number;
    quantity: number;
    geometryType: string;
}
export declare class OrderServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: IOrderRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getOrderById;
    private getOrderItems;
    private getConfirmedOrders;
}
//# sourceMappingURL=order.service-handler.d.ts.map