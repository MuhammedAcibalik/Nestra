/**
 * Piscina Pool Wrapper
 * Production-grade thread pool for CPU-intensive optimization tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 * Optimized for AMD Ryzen 9 9950X (16 cores, 32 threads)
 */
export interface IPiscinaConfig {
    minThreads?: number;
    maxThreads?: number;
    idleTimeout?: number;
    maxQueue?: number | 'auto';
    concurrentTasksPerWorker?: number;
}
export interface IOptimizationPoolStats {
    completed: number;
    runTime: {
        average: number;
        mean: number;
    };
    waitTime: {
        average: number;
        mean: number;
    };
    utilization: number;
    queueSize: number;
}
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
export declare const defaultPiscinaConfig: Required<IPiscinaConfig>;
export declare class OptimizationPool {
    private static instance;
    private pool;
    private readonly config;
    private initialized;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(config?: IPiscinaConfig): OptimizationPool;
    /**
     * Initialize the pool
     */
    initialize(): Promise<void>;
    /**
     * Run 1D optimization in worker thread
     */
    run1D<T>(payload: T, signal?: AbortSignal): Promise<unknown>;
    /**
     * Run 2D optimization in worker thread
     */
    run2D<T>(payload: T, signal?: AbortSignal): Promise<unknown>;
    /**
     * Get pool statistics
     */
    getStats(): IOptimizationPoolStats;
    /**
     * Health check for Piscina pool
     */
    healthCheck(): Promise<{
        healthy: boolean;
        details: Record<string, unknown>;
    }>;
    /**
     * Shutdown the pool
     */
    shutdown(): Promise<void>;
    /**
     * Check if pool is ready
     */
    isReady(): boolean;
    /**
     * Ensure pool is initialized
     */
    private ensureInitialized;
    /**
     * Reset singleton (for testing)
     */
    static reset(): Promise<void>;
}
export declare function getOptimizationPool(config?: IPiscinaConfig): OptimizationPool;
export declare function initializeOptimizationPool(config?: IPiscinaConfig): Promise<OptimizationPool>;
export declare function shutdownOptimizationPool(): Promise<void>;
//# sourceMappingURL=piscina.pool.d.ts.map