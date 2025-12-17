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
const events_1 = require("./events");
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
            console.log(`[WebSocket] Client connected: ${socket.id}`);
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
                        authenticated: true
                    };
                    // Join user-specific room for targeted events
                    socket.join(`user:${decoded.userId}`);
                    console.log(`[WebSocket] Client ${socket.id} authenticated as ${decoded.email}`);
                    socket.emit('authenticated', {
                        success: true,
                        userId: decoded.userId,
                        email: decoded.email
                    });
                }
                catch (error) {
                    console.warn(`[WebSocket] Authentication failed for ${socket.id}:`, error instanceof Error ? error.message : 'Unknown error');
                    socket.emit('authenticated', {
                        success: false,
                        error: 'Invalid or expired token'
                    });
                }
            });
            socket.on(events_1.WebSocketEvents.DISCONNECT, () => {
                console.log(`[WebSocket] Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });
            // Send welcome message
            socket.emit('welcome', {
                message: 'Connected to Nestra WebSocket',
                timestamp: new Date().toISOString(),
                requiresAuth: true
            });
        });
        console.log('[WebSocket] Service initialized with JWT authentication');
    }
    emit(event, payload) {
        if (!this.io) {
            console.warn('[WebSocket] Attempted to emit before initialization');
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
}
// Singleton export
exports.websocketService = new WebSocketService();
//# sourceMappingURL=websocket.service.js.map