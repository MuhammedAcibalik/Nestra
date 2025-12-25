/**
 * Order Service
 * Following Single Responsibility Principle (SRP)
 * Core order CRUD operations only
 * Import and Template operations are delegated to specialized services
 */
import { IOrderService, IOrderDto, IOrderItemDto, IOrderFilter, ICreateOrderInput, IUpdateOrderInput, ICreateOrderItemInput, IColumnMapping, IResult, IOrderTemplateDto, ICreateTemplateInput, IUpdateTemplateInput } from '../../core/interfaces';
import { IOrderRepository } from './order.repository';
import { IOrderImportService } from './order-import.service';
import { IOrderTemplateService } from './order-template.service';
/**
 * Order Service Implementation
 * Composes import and template services following Composition over Inheritance
 */
export declare class OrderService implements IOrderService {
    private readonly orderRepository;
    private readonly importService;
    private readonly templateService;
    constructor(orderRepository: IOrderRepository, importService?: IOrderImportService, templateService?: IOrderTemplateService);
    getOrders(filter?: IOrderFilter): Promise<IResult<IOrderDto[]>>;
    getOrderById(id: string): Promise<IResult<IOrderDto>>;
    createOrder(data: ICreateOrderInput, userId: string): Promise<IResult<IOrderDto>>;
    updateOrder(id: string, data: IUpdateOrderInput): Promise<IResult<IOrderDto>>;
    deleteOrder(id: string): Promise<IResult<void>>;
    addOrderItem(orderId: string, data: ICreateOrderItemInput): Promise<IResult<IOrderItemDto>>;
    /**
     * Import orders from Excel/CSV file
     * Delegates parsing to OrderImportService
     */
    importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<IOrderDto>>;
    getTemplates(): Promise<IResult<IOrderTemplateDto[]>>;
    getTemplateById(id: string): Promise<IResult<IOrderTemplateDto>>;
    createTemplate(data: ICreateTemplateInput): Promise<IResult<IOrderTemplateDto>>;
    updateTemplate(id: string, data: IUpdateTemplateInput): Promise<IResult<IOrderTemplateDto>>;
    deleteTemplate(id: string): Promise<IResult<void>>;
    createOrderFromTemplate(templateId: string, overrides: Partial<ICreateOrderInput>, userId: string): Promise<IResult<IOrderDto>>;
}
//# sourceMappingURL=order.service.d.ts.map