"use strict";
/**
 * Order Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOrderDto = toOrderDto;
exports.toOrderItemDto = toOrderItemDto;
exports.getErrorMessage = getErrorMessage;
/**
 * Maps Order entity to DTO
 */
function toOrderDto(order) {
    // Map customer if exists - only include properties that exist in customer type
    const customer = order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            code: order.customer.code ?? undefined
        }
        : undefined;
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate ?? undefined,
        items: order.items?.map(toOrderItemDto) ?? [],
        itemCount: order.items?.length ?? 0,
        createdAt: order.createdAt
    };
}
/**
 * Maps OrderItem entity to DTO
 */
function toOrderItemDto(item) {
    return {
        id: item.id,
        itemCode: item.itemCode ?? undefined,
        itemName: item.itemName ?? undefined,
        geometryType: item.geometryType,
        length: item.length ?? undefined,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
        diameter: item.diameter ?? undefined,
        thickness: item.thickness,
        quantity: item.quantity,
        producedQty: item.producedQty,
        canRotate: item.canRotate
    };
}
/**
 * Extracts error message from unknown error type
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
//# sourceMappingURL=order.mapper.js.map