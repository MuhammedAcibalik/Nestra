/**
 * WebSocket Service
 * Singleton service for managing real-time notifications
 */

import { Server as HttpServer } from 'node:http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createModuleLogger } from '../core/logger';
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

/** Decoded JWT token payload */
interface IJwtPayload {
    userId: string;
    email: string;
    roleId?: string;
    roleName?: string;
    tenantId?: string;
    tenantSlug?: string;
    iat?: number;
    exp?: number;
}

/** Socket with user data attached */
interface IAuthenticatedSocket extends Socket {
    data: {
        userId?: string;
        email?: string;
        roleName?: string;
        tenantId?: string;
        authenticated: boolean;
    };
}

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

    // Tenant-scoped events
    emitToTenant<T>(tenantId: string, event: string, payload: T): void;
    emitToUser<T>(userId: string, event: string, payload: T): void;
}

const logger = createModuleLogger('WebSocketService');

class WebSocketService implements IWebSocketService {
    private io: SocketServer | null = null;
    private readonly connectedClients: Map<string, IAuthenticatedSocket> = new Map();
    private readonly jwtSecret: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET ?? 'nestra-secret-key';
    }

    initialize(httpServer: HttpServer): void {
        this.io = new SocketServer(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN ?? '*',
                methods: ['GET', 'POST']
            },
            path: '/ws'
        });

        this.io.on(WebSocketEvents.CONNECTION, (socket: Socket) => {
            const authSocket = socket as IAuthenticatedSocket;
            authSocket.data = { authenticated: false };

            logger.info('Client connected', { socketId: socket.id });
            this.connectedClients.set(socket.id, authSocket);

            // Handle JWT authentication
            socket.on('authenticate', (token: string) => {
                try {
                    const decoded = jwt.verify(token, this.jwtSecret) as IJwtPayload;

                    // Attach user info to socket
                    authSocket.data = {
                        userId: decoded.userId,
                        email: decoded.email,
                        roleName: decoded.roleName,
                        tenantId: decoded.tenantId,
                        authenticated: true
                    };

                    // Join user-specific room for targeted events
                    socket.join(`user:${decoded.userId}`);

                    // Join tenant room for tenant-scoped broadcasts
                    if (decoded.tenantId) {
                        socket.join(`tenant:${decoded.tenantId}`);
                        // Also join dashboard room by default
                        socket.join(`dashboard:${decoded.tenantId}`);
                    }

                    logger.info('Client authenticated', {
                        socketId: socket.id,
                        email: decoded.email,
                        tenantId: decoded.tenantId ?? 'none'
                    });
                    socket.emit('authenticated', {
                        success: true,
                        userId: decoded.userId,
                        email: decoded.email,
                        tenantId: decoded.tenantId
                    });
                } catch (error) {
                    logger.warn('Authentication failed', {
                        socketId: socket.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    socket.emit('authenticated', {
                        success: false,
                        error: 'Invalid or expired token'
                    });
                }
            });

            socket.on(WebSocketEvents.DISCONNECT, () => {
                logger.info('Client disconnected', { socketId: socket.id });
                this.connectedClients.delete(socket.id);
            });

            // Send welcome message
            socket.emit('welcome', {
                message: 'Connected to Nestra WebSocket',
                timestamp: new Date().toISOString(),
                requiresAuth: true
            });
        });

        logger.info('Service initialized with JWT authentication');
    }

    private emit<T>(event: WebSocketEvents, payload: T): void {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
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

    // Tenant-scoped events
    emitToTenant<T>(tenantId: string, event: string, payload: T): void {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.to(`tenant:${tenantId}`).emit(event, payload);
    }

    emitToUser<T>(userId: string, event: string, payload: T): void {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.to(`user:${userId}`).emit(event, payload);
    }

    // Dashboard room management
    emitToDashboard<T>(tenantId: string, event: string, payload: T): void {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.to(`dashboard:${tenantId}`).emit(event, payload);
    }
}

// Singleton export
export const websocketService = new WebSocketService();
