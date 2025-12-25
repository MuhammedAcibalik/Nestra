/**
 * Service Registry
 * Service discovery and registration for microservice architecture
 * Following Singleton Pattern
 */

import {
    IServiceClient,
    IServiceRequest,
    IServiceResponse,
    IOptimizationServiceClient,
    IStockServiceClient,
    IOrderServiceClient,
    ICuttingJobServiceClient,
    IStockQueryClient
} from './service-client.interface';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('ServiceRegistry');

// ==================== SERVICE REGISTRY ====================

export interface IServiceRegistry {
    register(serviceName: string, handler: IServiceHandler): void;
    unregister(serviceName: string): void;
    getService(serviceName: string): IServiceHandler | undefined;
    getAllServices(): string[];
}

export interface IServiceHandler {
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
}

/**
 * In-Memory Service Registry
 * For monolith: direct function calls
 * For microservices: replace with HTTP/gRPC calls
 */
export class ServiceRegistry implements IServiceRegistry, IServiceClient {
    private static instance: ServiceRegistry | null = null;
    private readonly services: Map<string, IServiceHandler> = new Map();

    /**
     * Constructor is public to allow explicit instance creation for testing
     * For production, use getInstance() for singleton behavior
     */
    constructor() { }

    /**
     * Get singleton instance (production use)
     */
    public static getInstance(): ServiceRegistry {
        ServiceRegistry.instance ??= new ServiceRegistry();
        return ServiceRegistry.instance;
    }

    /**
     * Create a new isolated instance (testing use)
     * Does not affect the singleton instance
     */
    public static createTestInstance(): ServiceRegistry {
        return new ServiceRegistry();
    }

    /**
     * Reset singleton instance (test cleanup)
     */
    public static resetInstance(): void {
        if (ServiceRegistry.instance) {
            ServiceRegistry.instance.services.clear();
        }
        ServiceRegistry.instance = null;
    }

    register(serviceName: string, handler: IServiceHandler): void {
        this.services.set(serviceName, handler);
        logger.debug('Service registered', { serviceName });
    }

    unregister(serviceName: string): void {
        this.services.delete(serviceName);
        logger.debug('Service unregistered', { serviceName });
    }

    getService(serviceName: string): IServiceHandler | undefined {
        return this.services.get(serviceName);
    }

    getAllServices(): string[] {
        return Array.from(this.services.keys());
    }

    /**
     * IServiceClient implementation - routes requests to registered handlers
     */
    async request<TReq, TRes>(
        serviceName: string,
        request: IServiceRequest<TReq>
    ): Promise<IServiceResponse<TRes>> {
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
            return await handler.handle<TReq, TRes>(request);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'SERVICE_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    // NOTE: reset() functionality moved to resetInstance() static method
}

// ==================== SERVICE CLIENTS ====================

/**
 * Factory to create type-safe service clients
 */
export function createOptimizationClient(registry: IServiceClient): IOptimizationServiceClient {
    return {
        async getPlanById(planId: string) {
            return registry.request('optimization', {
                method: 'GET',
                path: `/plans/${planId}`
            });
        },
        async getPlanStockItems(planId: string) {
            return registry.request('optimization', {
                method: 'GET',
                path: `/plans/${planId}/stock-items`
            });
        },
        async updatePlanStatus(planId: string, status: string) {
            return registry.request('optimization', {
                method: 'PUT',
                path: `/plans/${planId}/status`,
                data: { status }
            });
        },
        async getApprovedPlans(filter) {
            return registry.request('optimization', {
                method: 'POST',
                path: '/plans/approved',
                data: filter ?? {}
            });
        }
    };
}

export function createStockClient(registry: IServiceClient): IStockServiceClient {
    return {
        async getStockById(stockId: string) {
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
        async updateQuantity(stockId: string, delta: number) {
            return registry.request('stock', {
                method: 'PUT',
                path: `/stock/${stockId}/quantity`,
                data: { delta }
            });
        }
    };
}

export function createOrderClient(registry: IServiceClient): IOrderServiceClient {
    return {
        async getOrderById(orderId: string) {
            return registry.request('order', {
                method: 'GET',
                path: `/orders/${orderId}`
            });
        },
        async updateOrderStatus(orderId: string, status: string) {
            return registry.request('order', {
                method: 'PUT',
                path: `/orders/${orderId}/status`,
                data: { status }
            });
        }
    };
}

/**
 * CuttingJob Service Client
 * Used by Optimization module
 */
export function createCuttingJobClient(registry: IServiceClient): ICuttingJobServiceClient {
    return {
        async getJobWithItems(jobId: string) {
            return registry.request('cutting-job', {
                method: 'GET',
                path: `/cutting-jobs/${jobId}/with-items`
            });
        }
    };
}

/**
 * Stock Query Client
 * Used by Optimization module for stock queries
 */
export function createStockQueryClient(registry: IServiceClient): IStockQueryClient {
    return {
        async getAvailableStock(params) {
            return registry.request('stock', {
                method: 'POST',
                path: '/stock/query/available',
                data: params
            });
        }
    };
}
