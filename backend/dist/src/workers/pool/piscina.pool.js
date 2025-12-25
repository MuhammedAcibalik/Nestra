"use strict";
/**
 * Piscina Pool Wrapper
 * Production-grade thread pool for CPU-intensive optimization tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 * Optimized for AMD Ryzen 9 9950X (16 cores, 32 threads)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationPool = exports.defaultPiscinaConfig = void 0;
exports.getOptimizationPool = getOptimizationPool;
exports.initializeOptimizationPool = initializeOptimizationPool;
exports.shutdownOptimizationPool = shutdownOptimizationPool;
const piscina_1 = __importDefault(require("piscina"));
const node_path_1 = __importDefault(require("node:path"));
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('Piscina');
// ==================== AMD RYZEN 9 9950X OPTIMIZED CONFIG ====================
// Specs: 16 Cores, 32 Threads, 80MB Cache (L2+L3), 170W TDP, Zen 5
/**
 * Optimized defaults for AMD Ryzen 9 9950X:
 * - minThreads: 4 (always ready for quick tasks)
 * - maxThreads: 12 (leaving 4 cores for Node.js main thread, OS, I/O)
 * - idleTimeout: 60s (longer idle for heavy workloads)
 * - maxQueue: 256 (large queue for burst optimization requests)
 *
 * Why 12 workers instead of 16?
 * - Node.js main thread needs headroom for I/O, RabbitMQ, WebSocket
 * - Workers are CPU-bound, leaving cores free improves overall responsiveness
 * - Hyper-threading (SMT) can cause cache contention for pure compute tasks
 */
exports.defaultPiscinaConfig = {
    minThreads: 4,
    maxThreads: 12,
    idleTimeout: 60000, // 60 seconds (longer for production workloads)
    maxQueue: 256, // Large queue for burst requests
    concurrentTasksPerWorker: 1 // One task per worker for CPU-intensive work
};
// ==================== POOL MANAGER ====================
class OptimizationPool {
    static instance = null;
    pool = null;
    config;
    initialized = false;
    // Task tracking for cancellation and progress
    activeTasks = new Map();
    taskProgress = new Map();
    progressCallback = null;
    constructor(config = {}) {
        this.config = {
            ...exports.defaultPiscinaConfig,
            ...config
        };
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        OptimizationPool.instance ??= new OptimizationPool(config);
        return OptimizationPool.instance;
    }
    /**
     * Initialize the pool
     */
    async initialize() {
        if (this.initialized)
            return;
        const workerPath = node_path_1.default.resolve(__dirname, '../optimization/optimization.worker.js');
        this.pool = new piscina_1.default({
            filename: workerPath,
            minThreads: this.config.minThreads,
            maxThreads: this.config.maxThreads,
            idleTimeout: this.config.idleTimeout,
            maxQueue: this.config.maxQueue === 'auto'
                ? this.config.maxThreads * this.config.maxThreads
                : this.config.maxQueue
        });
        this.initialized = true;
        logger.info('Pool initialized', { minThreads: this.config.minThreads, maxThreads: this.config.maxThreads });
    }
    /**
     * Run 1D optimization in worker thread
     */
    async run1D(payload, signal) {
        this.ensureInitialized();
        return this.pool.run(payload, { name: 'optimize1D', signal });
    }
    /**
     * Run 2D optimization in worker thread
     */
    async run2D(payload, signal) {
        this.ensureInitialized();
        return this.pool.run(payload, { name: 'optimize2D', signal });
    }
    /**
     * Run optimization with full task tracking, timeout, and cancellation support
     */
    async runWithTracking(task) {
        this.ensureInitialized();
        const controller = new AbortController();
        this.activeTasks.set(task.id, controller);
        // Initialize progress tracking
        this.updateProgress(task.id, {
            taskId: task.id,
            phase: 'queued',
            progress: 0,
            startedAt: new Date()
        });
        // Set timeout
        const timeoutId = setTimeout(() => {
            this.updateProgress(task.id, { phase: 'timeout', progress: 0 });
            controller.abort();
        }, task.timeout);
        try {
            this.updateProgress(task.id, { phase: 'running', progress: 10 });
            const result = task.type === '1D'
                ? await this.run1D(task.payload, controller.signal)
                : await this.run2D(task.payload, controller.signal);
            this.updateProgress(task.id, {
                phase: 'completed',
                progress: 100,
                completedAt: new Date()
            });
            return result;
        }
        catch (error) {
            const phase = controller.signal.aborted ? 'cancelled' : 'failed';
            this.updateProgress(task.id, {
                phase,
                progress: 0,
                message: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date()
            });
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
            this.activeTasks.delete(task.id);
        }
    }
    /**
     * Cancel a running task by ID
     * @returns true if task was found and cancelled
     */
    cancelTask(taskId) {
        const controller = this.activeTasks.get(taskId);
        if (controller) {
            controller.abort();
            this.updateProgress(taskId, { phase: 'cancelled', progress: 0 });
            return true;
        }
        return false;
    }
    /**
     * Get progress for a specific task
     */
    getTaskProgress(taskId) {
        return this.taskProgress.get(taskId);
    }
    /**
     * Get all active task IDs
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.keys());
    }
    /**
     * Set callback for progress updates (for WebSocket broadcasting)
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
    /**
     * Update and broadcast task progress
     */
    updateProgress(taskId, update) {
        const current = this.taskProgress.get(taskId) ?? {
            taskId,
            phase: 'queued',
            progress: 0
        };
        const updated = { ...current, ...update };
        this.taskProgress.set(taskId, updated);
        // Notify callback if set (for WebSocket updates)
        if (this.progressCallback) {
            this.progressCallback(updated);
        }
    }
    /**
     * Get pool statistics
     */
    getStats() {
        if (!this.pool) {
            return {
                completed: 0,
                runTime: { average: 0, mean: 0 },
                waitTime: { average: 0, mean: 0 },
                utilization: 0,
                queueSize: 0
            };
        }
        return {
            completed: this.pool.completed,
            runTime: { average: 0, mean: 0 },
            waitTime: { average: 0, mean: 0 },
            utilization: this.pool.utilization,
            queueSize: this.pool.queueSize
        };
    }
    /**
     * Health check for Piscina pool
     */
    async healthCheck() {
        if (!this.initialized || !this.pool) {
            return {
                healthy: false,
                details: { reason: 'Pool not initialized' }
            };
        }
        const stats = this.getStats();
        const healthy = stats.utilization < 0.95; // Less than 95% utilization
        return {
            healthy,
            details: {
                initialized: this.initialized,
                completed: stats.completed,
                utilization: Math.round(stats.utilization * 100) + '%',
                queueSize: stats.queueSize,
                maxThreads: this.config.maxThreads,
                minThreads: this.config.minThreads
            }
        };
    }
    /**
     * Shutdown the pool
     */
    async shutdown() {
        if (this.pool) {
            logger.info('Waiting for pending tasks...');
            await this.pool.destroy();
            this.pool = null;
            this.initialized = false;
            logger.info('Pool destroyed');
        }
    }
    /**
     * Check if pool is ready
     */
    isReady() {
        return this.initialized && this.pool !== null;
    }
    /**
     * Ensure pool is initialized
     */
    ensureInitialized() {
        if (!this.initialized || !this.pool) {
            throw new Error('Piscina pool not initialized. Call initialize() first.');
        }
    }
    /**
     * Reset singleton (for testing)
     */
    static async reset() {
        if (OptimizationPool.instance) {
            await OptimizationPool.instance.shutdown();
        }
        OptimizationPool.instance = null;
    }
}
exports.OptimizationPool = OptimizationPool;
// ==================== HELPER FUNCTIONS ====================
function getOptimizationPool(config) {
    return OptimizationPool.getInstance(config);
}
async function initializeOptimizationPool(config) {
    const pool = OptimizationPool.getInstance(config);
    await pool.initialize();
    return pool;
}
async function shutdownOptimizationPool() {
    await OptimizationPool.reset();
}
//# sourceMappingURL=piscina.pool.js.map