/**
 * WebSocket Service
 * Singleton service for managing real-time notifications
 */
import { Server as HttpServer } from 'node:http';
import { IOptimizationStartedPayload, IOptimizationProgressPayload, IOptimizationCompletedPayload, IOptimizationFailedPayload, IProductionStartedPayload, IProductionUpdatedPayload, IProductionCompletedPayload, IStockLowPayload, IStockUpdatedPayload, ICuttingJobCreatedPayload, ICuttingJobStatusChangedPayload } from './events';
export interface IWebSocketService {
    initialize(httpServer: HttpServer): void;
    emitOptimizationStarted(payload: IOptimizationStartedPayload): void;
    emitOptimizationProgress(payload: IOptimizationProgressPayload): void;
    emitOptimizationCompleted(payload: IOptimizationCompletedPayload): void;
    emitOptimizationFailed(payload: IOptimizationFailedPayload): void;
    emitProductionStarted(payload: IProductionStartedPayload): void;
    emitProductionUpdated(payload: IProductionUpdatedPayload): void;
    emitProductionCompleted(payload: IProductionCompletedPayload): void;
    emitStockLow(payload: IStockLowPayload): void;
    emitStockUpdated(payload: IStockUpdatedPayload): void;
    emitCuttingJobCreated(payload: ICuttingJobCreatedPayload): void;
    emitCuttingJobStatusChanged(payload: ICuttingJobStatusChangedPayload): void;
    emitToTenant<T>(tenantId: string, event: string, payload: T): void;
    emitToUser<T>(userId: string, event: string, payload: T): void;
}
declare class WebSocketService implements IWebSocketService {
    private io;
    private readonly connectedClients;
    private readonly jwtSecret;
    constructor();
    initialize(httpServer: HttpServer): void;
    /**
     * Internal emit method - checks for tenantId for security
     * All business events should be tenant-scoped to prevent data leakage
     */
    private emit;
    emitOptimizationStarted(payload: IOptimizationStartedPayload): void;
    emitOptimizationProgress(payload: IOptimizationProgressPayload): void;
    emitOptimizationCompleted(payload: IOptimizationCompletedPayload): void;
    emitOptimizationFailed(payload: IOptimizationFailedPayload): void;
    emitProductionStarted(payload: IProductionStartedPayload): void;
    emitProductionUpdated(payload: IProductionUpdatedPayload): void;
    emitProductionCompleted(payload: IProductionCompletedPayload): void;
    emitStockLow(payload: IStockLowPayload): void;
    emitStockUpdated(payload: IStockUpdatedPayload): void;
    emitCuttingJobCreated(payload: ICuttingJobCreatedPayload): void;
    emitCuttingJobStatusChanged(payload: ICuttingJobStatusChangedPayload): void;
    getConnectedCount(): number;
    isInitialized(): boolean;
    emitToTenant<T>(tenantId: string, event: string, payload: T): void;
    emitToUser<T>(userId: string, event: string, payload: T): void;
    emitToDashboard<T>(tenantId: string, event: string, payload: T): void;
}
export declare const websocketService: WebSocketService;
export {};
//# sourceMappingURL=websocket.service.d.ts.map