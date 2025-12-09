/**
 * Order Service
 * Following SOLID principles - properly typed without any usage
 */
import { IOrderService, IOrderDto, IOrderItemDto, IOrderFilter, ICreateOrderInput, IUpdateOrderInput, ICreateOrderItemInput, IColumnMapping, IResult } from '../../core/interfaces';
import { IOrderRepository } from './order.repository';
export declare class OrderService implements IOrderService {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    getOrders(filter?: IOrderFilter): Promise<IResult<IOrderDto[]>>;
    getOrderById(id: string): Promise<IResult<IOrderDto>>;
    createOrder(data: ICreateOrderInput, userId: string): Promise<IResult<IOrderDto>>;
    updateOrder(id: string, data: IUpdateOrderInput): Promise<IResult<IOrderDto>>;
    deleteOrder(id: string): Promise<IResult<void>>;
    addOrderItem(orderId: string, data: ICreateOrderItemInput): Promise<IResult<IOrderItemDto>>;
    importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<IOrderDto>>;
    private mapRowToOrderItem;
    private parseNumber;
    private parseInt;
    private toDto;
    private toItemDto;
    private getErrorMessage;
}
//# sourceMappingURL=order.service.d.ts.map