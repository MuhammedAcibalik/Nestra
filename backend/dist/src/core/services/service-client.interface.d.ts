/**
 * Service Client Interfaces
 * Inter-service communication for microservice architecture
 * Following Interface Segregation Principle
 */
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
export interface IServiceClient {
    request<TReq, TRes>(serviceName: string, request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
}
/**
 * Optimization Service API
 * Used by Production module
 */
export interface IOptimizationServiceClient {
    getPlanById(planId: string): Promise<IServiceResponse<IPlanSummary>>;
    getPlanStockItems(planId: string): Promise<IServiceResponse<IPlanStockItem[]>>;
    updatePlanStatus(planId: string, status: string): Promise<IServiceResponse<void>>;
    getApprovedPlans(filter?: IApprovedPlansFilter): Promise<IServiceResponse<IPlanSummary[]>>;
}
export interface IApprovedPlansFilter {
    scenarioId?: string;
    fromDate?: Date;
    toDate?: Date;
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
    createMovement(data: ICreateMovementData): Promise<IServiceResponse<{
        id: string;
    }>>;
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
/**
 * CuttingJob Service API
 * Used by Optimization module
 */
export interface ICuttingJobServiceClient {
    getJobWithItems(jobId: string): Promise<IServiceResponse<ICuttingJobWithItems>>;
}
export interface ICuttingJobWithItems {
    id: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    status: string;
    items: ICuttingJobItemDetail[];
}
export interface ICuttingJobItemDetail {
    id: string;
    orderItemId: string;
    quantity: number;
    orderItem: {
        geometryType: string;
        length: number | null;
        width: number | null;
        height: number | null;
    } | null;
}
/**
 * Extended Stock Service API
 * Used by Optimization module for stock queries
 */
export interface IStockQueryClient {
    getAvailableStock(params: IStockQueryParams): Promise<IServiceResponse<IStockItemForOptimization[]>>;
}
export interface IStockQueryParams {
    materialTypeId: string;
    thickness: number;
    stockType: 'BAR_1D' | 'SHEET_2D';
    selectedStockIds?: string[];
}
export interface IStockItemForOptimization {
    id: string;
    code: string;
    name: string;
    stockType: string;
    length: number | null;
    width: number | null;
    height: number | null;
    quantity: number;
    unitPrice: number | null;
}
//# sourceMappingURL=service-client.interface.d.ts.map