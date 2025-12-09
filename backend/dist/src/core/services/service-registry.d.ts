/**
 * Service Registry
 * Service discovery and registration for microservice architecture
 * Following Singleton Pattern
 */
import { IServiceClient, IServiceRequest, IServiceResponse, IOptimizationServiceClient, IStockServiceClient, IOrderServiceClient } from './service-client.interface';
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
    private constructor();
    static getInstance(): ServiceRegistry;
    register(serviceName: string, handler: IServiceHandler): void;
    unregister(serviceName: string): void;
    getService(serviceName: string): IServiceHandler | undefined;
    getAllServices(): string[];
    /**
     * IServiceClient implementation - routes requests to registered handlers
     */
    request<TReq, TRes>(serviceName: string, request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    /**
     * Reset for testing
     */
    static reset(): void;
}
/**
 * Factory to create type-safe service clients
 */
export declare function createOptimizationClient(registry: IServiceClient): IOptimizationServiceClient;
export declare function createStockClient(registry: IServiceClient): IStockServiceClient;
export declare function createOrderClient(registry: IServiceClient): IOrderServiceClient;
//# sourceMappingURL=service-registry.d.ts.map