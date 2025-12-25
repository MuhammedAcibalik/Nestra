/**
 * Order Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */
import { IOrderDto, IOrderItemDto } from '../../core/interfaces';
import { OrderWithRelations, OrderItem } from './order.repository';
/**
 * Maps Order entity to DTO
 */
export declare function toOrderDto(order: OrderWithRelations): IOrderDto;
/**
 * Maps OrderItem entity to DTO
 */
export declare function toOrderItemDto(item: OrderItem): IOrderItemDto;
/**
 * Extracts error message from unknown error type
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=order.mapper.d.ts.map