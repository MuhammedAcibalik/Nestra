"use strict";
/**
 * Health Controller
 * Provides liveness and readiness probes for Kubernetes/Docker
 * Following Microservice Pattern: Health Checks
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
exports.getHealthController = getHealthController;
const express_1 = require("express");
const db_1 = require("../db");
// ==================== HEALTH CHECK FUNCTIONS ====================
async function checkDatabase() {
    const start = Date.now();
    try {
        const db = (0, db_1.getDb)();
        // Simple query to check connection
        await db.execute(new (await Promise.resolve().then(() => __importStar(require('drizzle-orm')))).SQL(['SELECT 1']));
        return {
            name: 'database',
            status: 'pass',
            latency: Date.now() - start
        };
    }
    catch (error) {
        return {
            name: 'database',
            status: 'fail',
            latency: Date.now() - start,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function checkRabbitMQ() {
    try {
        const { getMessageBus } = await Promise.resolve().then(() => __importStar(require('../core/messaging')));
        const bus = getMessageBus();
        const isConnected = bus.isConnected();
        return {
            name: 'rabbitmq',
            status: isConnected ? 'pass' : 'warn',
            message: isConnected ? 'Connected' : 'Not connected (using in-memory)'
        };
    }
    catch {
        return {
            name: 'rabbitmq',
            status: 'warn',
            message: 'RabbitMQ not configured'
        };
    }
}
function checkMemory() {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);
    let status = 'pass';
    if (percentage > 90)
        status = 'fail';
    else if (percentage > 75)
        status = 'warn';
    return {
        name: 'memory',
        status,
        message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentage}%)`
    };
}
// ==================== CONTROLLER ====================
class HealthController {
    router;
    startTime;
    version;
    constructor() {
        this.router = (0, express_1.Router)();
        this.startTime = Date.now();
        this.version = process.env.npm_package_version ?? '1.0.0';
        this.setupRoutes();
    }
    setupRoutes() {
        // Liveness probe - is the service running?
        this.router.get('/health', this.getLiveness.bind(this));
        this.router.get('/health/live', this.getLiveness.bind(this));
        // Readiness probe - is the service ready to accept traffic?
        this.router.get('/health/ready', this.getReadiness.bind(this));
        // Detailed health status
        this.router.get('/health/detailed', this.getDetailedHealth.bind(this));
    }
    getLiveness(_req, res) {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    }
    async getReadiness(_req, res) {
        try {
            const dbCheck = await checkDatabase();
            if (dbCheck.status === 'fail') {
                res.status(503).json({
                    status: 'not_ready',
                    reason: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'not_ready',
                reason: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getDetailedHealth(_req, res) {
        try {
            const checks = await Promise.all([
                checkDatabase(),
                checkRabbitMQ(),
                Promise.resolve(checkMemory())
            ]);
            const hasFailure = checks.some(c => c.status === 'fail');
            const hasWarning = checks.some(c => c.status === 'warn');
            let overallStatus = 'healthy';
            if (hasFailure)
                overallStatus = 'unhealthy';
            else if (hasWarning)
                overallStatus = 'degraded';
            const health = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                version: this.version,
                uptime: Math.round((Date.now() - this.startTime) / 1000),
                checks
            };
            const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
            res.status(statusCode).json(health);
        }
        catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.HealthController = HealthController;
// ==================== SINGLETON INSTANCE ====================
let healthControllerInstance = null;
function getHealthController() {
    healthControllerInstance ??= new HealthController();
    return healthControllerInstance;
}
//# sourceMappingURL=health.controller.js.map