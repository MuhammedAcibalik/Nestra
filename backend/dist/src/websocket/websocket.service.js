"use strict";
/**
 * WebSocket Service
 * Singleton service for managing real-time notifications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../core/logger");
const events_1 = require("./events");
const logger = (0, logger_1.createModuleLogger)('WebSocketService');
class WebSocketService {
    io = null;
    connectedClients = new Map();
    jwtSecret;
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET ?? 'nestra-secret-key';
    }
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN ?? '*',
                methods: ['GET', 'POST']
            },
            path: '/ws'
        });
        this.io.on(events_1.WebSocketEvents.CONNECTION, (socket) => {
            const authSocket = socket;
            authSocket.data = { authenticated: false };
            logger.info('Client connected', { socketId: socket.id });
            this.connectedClients.set(socket.id, authSocket);
            // Handle JWT authentication
            socket.on('authenticate', (token) => {
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
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
                }
                catch (error) {
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
            socket.on(events_1.WebSocketEvents.DISCONNECT, () => {
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
    emit(event, payload) {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.emit(event, payload);
    }
    // Optimization events
    emitOptimizationStarted(payload) {
        this.emit(events_1.WebSocketEvents.OPTIMIZATION_STARTED, payload);
    }
    emitOptimizationProgress(payload) {
        this.emit(events_1.WebSocketEvents.OPTIMIZATION_PROGRESS, payload);
    }
    emitOptimizationCompleted(payload) {
        this.emit(events_1.WebSocketEvents.OPTIMIZATION_COMPLETED, payload);
    }
    emitOptimizationFailed(payload) {
        this.emit(events_1.WebSocketEvents.OPTIMIZATION_FAILED, payload);
    }
    // Production events
    emitProductionStarted(payload) {
        this.emit(events_1.WebSocketEvents.PRODUCTION_STARTED, payload);
    }
    emitProductionUpdated(payload) {
        this.emit(events_1.WebSocketEvents.PRODUCTION_UPDATED, payload);
    }
    emitProductionCompleted(payload) {
        this.emit(events_1.WebSocketEvents.PRODUCTION_COMPLETED, payload);
    }
    // Stock events
    emitStockLow(payload) {
        this.emit(events_1.WebSocketEvents.STOCK_LOW, payload);
    }
    emitStockUpdated(payload) {
        this.emit(events_1.WebSocketEvents.STOCK_UPDATED, payload);
    }
    // Job events
    emitCuttingJobCreated(payload) {
        this.emit(events_1.WebSocketEvents.CUTTING_JOB_CREATED, payload);
    }
    emitCuttingJobStatusChanged(payload) {
        this.emit(events_1.WebSocketEvents.CUTTING_JOB_STATUS_CHANGED, payload);
    }
    // Utility methods
    getConnectedCount() {
        return this.connectedClients.size;
    }
    isInitialized() {
        return this.io !== null;
    }
    // Tenant-scoped events
    emitToTenant(tenantId, event, payload) {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.to(`tenant:${tenantId}`).emit(event, payload);
    }
    emitToUser(userId, event, payload) {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.to(`user:${userId}`).emit(event, payload);
    }
    // Dashboard room management
    emitToDashboard(tenantId, event, payload) {
        if (!this.io) {
            logger.warn('Attempted to emit before initialization');
            return;
        }
        this.io.to(`dashboard:${tenantId}`).emit(event, payload);
    }
}
// Singleton export
exports.websocketService = new WebSocketService();
//# sourceMappingURL=websocket.service.js.map