"use strict";
/**
 * WebSocket Service
 * Singleton service for managing real-time notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = void 0;
const socket_io_1 = require("socket.io");
const events_1 = require("./events");
class WebSocketService {
    io = null;
    connectedClients = new Map();
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN ?? '*',
                methods: ['GET', 'POST']
            },
            path: '/ws'
        });
        this.io.on(events_1.WebSocketEvents.CONNECTION, (socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`);
            this.connectedClients.set(socket.id, socket);
            // Handle authentication (if needed in future)
            socket.on('authenticate', (token) => {
                // TODO: Validate JWT token and associate with user
                console.log(`[WebSocket] Client ${socket.id} attempting auth with token`);
                socket.emit('authenticated', { success: true });
            });
            socket.on(events_1.WebSocketEvents.DISCONNECT, () => {
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