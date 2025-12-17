/**
 * Service Registry
 * Service discovery and registration for microservice architecture
 * Following Singleton Pattern
 */
import { IServiceClient, IServiceRequest, IServiceResponse, IOptimizationServiceClient, IStockServiceClient, IOrderServiceClient, ICuttingJobServiceClient, IStockQueryClient } from './service-client.interface';
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
export declare class ServiceRegistry implements IServiceRegistry, IServiceClient {
    private static instance;
    private readonly services;
    /**
     * Constructor is public to allow explicit instance creation for testing
     * For production, use getInstance() for singleton behavior
     */
    constructor();
    /**
     * Get singleton instance (production use)
     */
    static getInstance(): ServiceRegistry;
    /**
     * Create a new isolated instance (testing use)
     * Does not affect the singleton instance
     */
    static createTestInstance(): ServiceRegistry;
    /**
     * Reset singleton instance (test cleanup)
     */
    static resetInstance(): void;
    register(serviceName: string, handler: IServiceHandler): void;
    unregister(serviceName: string): void;
    getService(serviceName: string): IServiceHandler | undefined;
    getAllServices(): string[];
    /**
     * IServiceClient implementation - routes requests to registered handlers
     */
    request<TReq, TRes>(serviceName: string, request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
}
/**
 * Factory to create type-safe service clients
 */
export declare function createOptimizationClient(registry: IServiceClient): IOptimizationServiceClient;
export declare function createStockClient(registry: IServiceClient): IStockServiceClient;
export declare function createOrderClient(registry: IServiceClient): IOrderServiceClient;
/**
 * CuttingJob Service Client
 * Used by Optimization module
 */
export declare function createCuttingJobClient(registry: IServiceClient): ICuttingJobServiceClient;
/**
 * Stock Query Client
 * Used by Optimization module for stock queries
 */
export declare function createStockQueryClient(registry: IServiceClient): IStockQueryClient;
//# sourceMappingURL=service-registry.d.ts.map