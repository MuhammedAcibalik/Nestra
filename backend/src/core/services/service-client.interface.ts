/**
 * Service Client Interfaces
 * Inter-service communication for microservice architecture
 * Following Interface Segregation Principle
 */

// ==================== BASE INTERFACES ====================

export interface IServiceRequest<T = unknown> {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    data?: T;
    headers?: Record<string, string>;
}

export interface IServiceResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

// ==================== SERVICE CLIENT INTERFACE ====================

export interface IServiceClient {
    request<TReq, TRes>(serviceName: string, request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
}

// ==================== MODULE-SPECIFIC INTERFACES ====================

/**
 * Optimization Service API
 * Used by Production module
 */
export interface IOptimizationServiceClient {
    getPlanById(planId: string): Promise<IServiceResponse<IPlanSummary>>;
    getPlanStockItems(planId: string): Promise<IServiceResponse<IPlanStockItem[]>>;
    updatePlanStatus(planId: string, status: string): Promise<IServiceResponse<void>>;
}

export interface IPlanSummary {
    id: string;
    planNumber: string;
    scenarioId: string;
    status: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
}

export interface IPlanStockItem {
    stockItemId: string;
    sequence: number;
    waste: number;
}

/**
 * Stock Service API
 * Used by Production module
 */
export interface IStockServiceClient {
    getStockById(stockId: string): Promise<IServiceResponse<IStockSummary>>;
    createMovement(data: ICreateMovementData): Promise<IServiceResponse<{ id: string }>>;
    updateQuantity(stockId: string, delta: number): Promise<IServiceResponse<void>>;
}

export interface IStockSummary {
    id: string;
    code: string;
    name: string;
    quantity: number;
    reservedQty: number;
}

export interface ICreateMovementData {
    stockItemId: string;
    movementType: string;
    quantity: number;
    notes?: string;
    productionLogId?: string;
}

/**
 * Order Service API
 * Used by CuttingJob module
 */
export interface IOrderServiceClient {
    getOrderById(orderId: string): Promise<IServiceResponse<IOrderSummary>>;
    updateOrderStatus(orderId: string, status: string): Promise<IServiceResponse<void>>;
}

export interface IOrderSummary {
    id: string;
    orderNumber: string;
    status: string;
    customerId?: string;
    itemCount: number;
}
