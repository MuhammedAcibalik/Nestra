"use strict";
/**
 * Order Service Handler
 * Exposes order module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class OrderServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path } = request;
        // Route: GET /orders/:id
        if (method === 'GET' && /^\/orders\/[\w-]+$/.exec(path)) {
            const orderId = path.split('/')[2];
            return this.getOrderById(orderId);
        }
        // Route: GET /orders/:id/items
        if (method === 'GET' && /^\/orders\/[\w-]+\/items$/.exec(path)) {
            const orderId = path.split('/')[2];
            return this.getOrderItems(orderId);
        }
        // Route: GET /orders/confirmed
        if (method === 'GET' && path === '/orders/confirmed') {
            return this.getConfirmedOrders();
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getOrderById(orderId) {
        try {
            const order = await this.repository.findById(orderId);
            if (!order) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Order not found' }
                };
            }
            return {
                success: true,
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    itemCount: order._count?.items ?? 0,
                    createdAt: order.createdAt
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getOrderItems(orderId) {
        try {
            const order = await this.repository.findById(orderId);
            if (!order || !order.items) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Order not found' }
                };
            }
            return {
                success: true,
                data: order.items.map((item) => ({
                    id: item.id,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    materialTypeId: item.materialTypeId,
                    thickness: item.thickness,
                    quantity: item.quantity,
                    geometryType: item.geometryType
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getConfirmedOrders() {
        try {
            const orders = await this.repository.findAll({ status: 'CONFIRMED' });
            return {
                success: true,
                data: orders.map((order) => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    itemCount: order._count?.items ?? 0,
                    createdAt: order.createdAt
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}
exports.OrderServiceHandler = OrderServiceHandler;
//# sourceMappingURL=order.service-handler.js.map