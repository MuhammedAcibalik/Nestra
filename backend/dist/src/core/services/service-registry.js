"use strict";
/**
 * Service Registry
 * Service discovery and registration for microservice architecture
 * Following Singleton Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
exports.createOptimizationClient = createOptimizationClient;
exports.createStockClient = createStockClient;
exports.createOrderClient = createOrderClient;
/**
 * In-Memory Service Registry
 * For monolith: direct function calls
 * For microservices: replace with HTTP/gRPC calls
 */
class ServiceRegistry {
    static instance;
    services = new Map();
    constructor() { }
    static getInstance() {
        ServiceRegistry.instance ??= new ServiceRegistry();
        return ServiceRegistry.instance;
    }
    register(serviceName, handler) {
        this.services.set(serviceName, handler);
        console.log(`[SERVICE] Registered: ${serviceName}`);
    }
    unregister(serviceName) {
        this.services.delete(serviceName);
        console.log(`[SERVICE] Unregistered: ${serviceName}`);
    }
    getService(serviceName) {
        return this.services.get(serviceName);
    }
    getAllServices() {
        return Array.from(this.services.keys());
    }
    /**
     * IServiceClient implementation - routes requests to registered handlers
     */
    async request(serviceName, request) {
        const handler = this.services.get(serviceName);
        if (!handler) {
            return {
                success: false,
                error: {
                    code: 'SERVICE_NOT_FOUND',
                    message: `Service '${serviceName}' is not registered`
                }
            };
        }
        try {
            return await handler.handle(request);
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'SERVICE_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    /**
     * Reset for testing
     */
    static reset() {
        if (ServiceRegistry.instance) {
            ServiceRegistry.instance.services.clear();
        }
    }
}
exports.ServiceRegistry = ServiceRegistry;
// ==================== SERVICE CLIENTS ====================
/**
 * Factory to create type-safe service clients
 */
function createOptimizationClient(registry) {
    return {
        async getPlanById(planId) {
            return registry.request('optimization', {
                method: 'GET',
                path: `/plans/${planId}`
            });
        },
        async getPlanStockItems(planId) {
            return registry.request('optimization', {
                method: 'GET',
                path: `/plans/${planId}/stock-items`
            });
        },
        async updatePlanStatus(planId, status) {
            return registry.request('optimization', {
                method: 'PUT',
                path: `/plans/${planId}/status`,
                data: { status }
            });
        }
    };
}
function createStockClient(registry) {
    return {
        async getStockById(stockId) {
            return registry.request('stock', {
                method: 'GET',
                path: `/stock/${stockId}`
            });
        },
        async createMovement(data) {
            return registry.request('stock', {
                method: 'POST',
                path: '/movements',
                data
            });
        },
        async updateQuantity(stockId, delta) {
            return registry.request('stock', {
                method: 'PUT',
                path: `/stock/${stockId}/quantity`,
                data: { delta }
            });
        }
    };
}
function createOrderClient(registry) {
    return {
        async getOrderById(orderId) {
            return registry.request('order', {
                method: 'GET',
                path: `/orders/${orderId}`
            });
        },
        async updateOrderStatus(orderId, status) {
            return registry.request('order', {
                method: 'PUT',
                path: `/orders/${orderId}/status`,
                data: { status }
            });
        }
    };
}
//# sourceMappingURL=service-registry.js.map