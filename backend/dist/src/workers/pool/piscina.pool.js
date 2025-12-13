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
        console.log(`[PISCINA] Pool initialized: ${this.config.minThreads}-${this.config.maxThreads} threads`);
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
            console.log('[PISCINA] Waiting for pending tasks...');
            await this.pool.destroy();
            this.pool = null;
            this.initialized = false;
            console.log('[PISCINA] Pool destroyed');
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