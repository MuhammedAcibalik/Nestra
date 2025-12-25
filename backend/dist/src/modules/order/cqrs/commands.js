"use strict";
/**
 * Order Commands
 * Following CQRS pattern - Commands modify state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrderItemCommand = exports.DeleteOrderCommand = exports.UpdateOrderStatusCommand = exports.CreateOrderCommand = void 0;
class CreateOrderCommand {
    data;
    tenantId;
    userId;
    constructor(data, tenantId, userId) {
        this.data = data;
        this.tenantId = tenantId;
        this.userId = userId;
    }
}
exports.CreateOrderCommand = CreateOrderCommand;
class UpdateOrderStatusCommand {
    orderId;
    status;
    tenantId;
    userId;
    reason;
    constructor(orderId, status, tenantId, userId, reason) {
        this.orderId = orderId;
        this.status = status;
        this.tenantId = tenantId;
        this.userId = userId;
        this.reason = reason;
    }
}
exports.UpdateOrderStatusCommand = UpdateOrderStatusCommand;
// ==================== DELETE ORDER ====================
class DeleteOrderCommand {
    orderId;
    tenantId;
    userId;
    constructor(orderId, tenantId, userId) {
        this.orderId = orderId;
        this.tenantId = tenantId;
        this.userId = userId;
    }
}
exports.DeleteOrderCommand = DeleteOrderCommand;
// ==================== ADD ORDER ITEM ====================
class AddOrderItemCommand {
    orderId;
    item;
    tenantId;
    userId;
    constructor(orderId, item, tenantId, userId) {
        this.orderId = orderId;
        this.item = item;
        this.tenantId = tenantId;
        this.userId = userId;
    }
}
exports.AddOrderItemCommand = AddOrderItemCommand;
//# sourceMappingURL=commands.js.map