/**
 * Order Module - Barrel Export
 * Following standard module structure with CQRS
 */

// ==================== INTERFACES ====================
export type {
    IOrderDto,
    IOrderItemDto,
    IOrderWithItemsDto,
    IOrderFilterDto,
    ICreateOrderInputDto,
    IUpdateOrderInputDto,
    ICreateOrderItemInputDto
} from './interfaces/dto';
export { GeometryType } from './interfaces/dto';

export type {
    Order,
    OrderItem,
    OrderWithRelations,
    IOrderRepository,
    IOrderService,
    ICreateOrderInput,
    ICreateOrderItemInput,
    IUpdateOrderInput,
    IOrderFilter
} from './interfaces/types';

// ==================== CQRS ====================
export * from './cqrs';

// ==================== REPOSITORY ====================
export { OrderRepository } from './order.repository';

// ==================== SERVICE ====================
export { OrderService } from './order.service';

// ==================== CONTROLLER ====================
export { OrderController, createOrderController } from './order.controller';

// ==================== MAPPER ====================
export { toOrderDto, toOrderItemDto, getErrorMessage } from './order.mapper';

// ==================== SPECIALIZED SERVICES ====================
export { OrderImportService, IOrderImportService } from './order-import.service';
export { OrderTemplateService, IOrderTemplateService } from './order-template.service';

// ==================== MICROSERVICE ====================
export { OrderEventHandler } from './order.event-handler';
export { OrderServiceHandler } from './order.service-handler';
