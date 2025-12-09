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
}
declare class WebSocketService implements IWebSocketService {
    private io;
    private readonly connectedClients;
    initialize(httpServer: HttpServer): void;
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
}
export declare const websocketService: WebSocketService;
export {};
//# sourceMappingURL=websocket.service.d.ts.map