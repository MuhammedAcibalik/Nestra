/**
 * WebSocket Service
 * Singleton service for managing real-time notifications
 */

import { Server as HttpServer } from 'node:http';
import { Server as SocketServer, Socket } from 'socket.io';
import {
    WebSocketEvents,
    IOptimizationStartedPayload,
    IOptimizationProgressPayload,
    IOptimizationCompletedPayload,
    IOptimizationFailedPayload,
    IProductionStartedPayload,
    IProductionUpdatedPayload,
    IProductionCompletedPayload,
    IStockLowPayload,
    IStockUpdatedPayload,
    ICuttingJobCreatedPayload,
    ICuttingJobStatusChangedPayload
} from './events';

export interface IWebSocketService {
    initialize(httpServer: HttpServer): void;

    // Optimization events
    emitOptimizationStarted(payload: IOptimizationStartedPayload): void;
    emitOptimizationProgress(payload: IOptimizationProgressPayload): void;
    emitOptimizationCompleted(payload: IOptimizationCompletedPayload): void;
    emitOptimizationFailed(payload: IOptimizationFailedPayload): void;

    // Production events
    emitProductionStarted(payload: IProductionStartedPayload): void;
    emitProductionUpdated(payload: IProductionUpdatedPayload): void;
    emitProductionCompleted(payload: IProductionCompletedPayload): void;

    // Stock events
    emitStockLow(payload: IStockLowPayload): void;
    emitStockUpdated(payload: IStockUpdatedPayload): void;

    // Job events
    emitCuttingJobCreated(payload: ICuttingJobCreatedPayload): void;
    emitCuttingJobStatusChanged(payload: ICuttingJobStatusChangedPayload): void;
}

class WebSocketService implements IWebSocketService {
    private io: SocketServer | null = null;
    private readonly connectedClients: Map<string, Socket> = new Map();

    initialize(httpServer: HttpServer): void {
        this.io = new SocketServer(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN ?? '*',
                methods: ['GET', 'POST']
            },
            path: '/ws'
        });

        this.io.on(WebSocketEvents.CONNECTION, (socket: Socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`);
            this.connectedClients.set(socket.id, socket);

            // Handle authentication (if needed in future)
            socket.on('authenticate', (token: string) => {
                // TODO: Validate JWT token and associate with user
                console.log(`[WebSocket] Client ${socket.id} attempting auth with token`);
                socket.emit('authenticated', { success: true });
            });

            socket.on(WebSocketEvents.DISCONNECT, () => {
                console.log(`[WebSocket] Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });

            // Send welcome message
            socket.emit('welcome', {
                message: 'Connected to Nestra WebSocket',
                timestamp: new Date().toISOString()
            });
        });

        console.log('[WebSocket] Service initialized');
    }

    private emit<T>(event: WebSocketEvents, payload: T): void {
        if (!this.io) {
            console.warn('[WebSocket] Attempted to emit before initialization');
            return;
        }
        this.io.emit(event, payload);
    }

    // Optimization events
    emitOptimizationStarted(payload: IOptimizationStartedPayload): void {
        this.emit(WebSocketEvents.OPTIMIZATION_STARTED, payload);
    }

    emitOptimizationProgress(payload: IOptimizationProgressPayload): void {
        this.emit(WebSocketEvents.OPTIMIZATION_PROGRESS, payload);
    }

    emitOptimizationCompleted(payload: IOptimizationCompletedPayload): void {
        this.emit(WebSocketEvents.OPTIMIZATION_COMPLETED, payload);
    }

    emitOptimizationFailed(payload: IOptimizationFailedPayload): void {
        this.emit(WebSocketEvents.OPTIMIZATION_FAILED, payload);
    }

    // Production events
    emitProductionStarted(payload: IProductionStartedPayload): void {
        this.emit(WebSocketEvents.PRODUCTION_STARTED, payload);
    }

    emitProductionUpdated(payload: IProductionUpdatedPayload): void {
        this.emit(WebSocketEvents.PRODUCTION_UPDATED, payload);
    }

    emitProductionCompleted(payload: IProductionCompletedPayload): void {
        this.emit(WebSocketEvents.PRODUCTION_COMPLETED, payload);
    }

    // Stock events
    emitStockLow(payload: IStockLowPayload): void {
        this.emit(WebSocketEvents.STOCK_LOW, payload);
    }

    emitStockUpdated(payload: IStockUpdatedPayload): void {
        this.emit(WebSocketEvents.STOCK_UPDATED, payload);
    }

    // Job events
    emitCuttingJobCreated(payload: ICuttingJobCreatedPayload): void {
        this.emit(WebSocketEvents.CUTTING_JOB_CREATED, payload);
    }

    emitCuttingJobStatusChanged(payload: ICuttingJobStatusChangedPayload): void {
        this.emit(WebSocketEvents.CUTTING_JOB_STATUS_CHANGED, payload);
    }

    // Utility methods
    getConnectedCount(): number {
        return this.connectedClients.size;
    }

    isInitialized(): boolean {
        return this.io !== null;
    }
}

// Singleton export
export const websocketService = new WebSocketService();
