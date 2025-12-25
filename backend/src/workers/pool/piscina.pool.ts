/**
 * Piscina Pool Wrapper
 * Production-grade thread pool for CPU-intensive optimization tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 * Optimized for AMD Ryzen 9 9950X (16 cores, 32 threads)
 */

import Piscina from 'piscina';
import path from 'node:path';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('Piscina');

// ==================== INTERFACES ====================

export interface IPiscinaConfig {
    minThreads?: number;
    maxThreads?: number;
    idleTimeout?: number;
    maxQueue?: number | 'auto';
    concurrentTasksPerWorker?: number;
}

export interface IOptimizationPoolStats {
    completed: number;
    runTime: { average: number; mean: number };
    waitTime: { average: number; mean: number };
    utilization: number;
    queueSize: number;
}

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
export const defaultPiscinaConfig: Required<IPiscinaConfig> = {
    minThreads: 4,
    maxThreads: 12,
    idleTimeout: 60000, // 60 seconds (longer for production workloads)
    maxQueue: 256, // Large queue for burst requests
    concurrentTasksPerWorker: 1 // One task per worker for CPU-intensive work
};

// ==================== TASK TRACKING ====================

export type TaskPhase = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export interface IOptimizationTask {
    readonly id: string;
    readonly type: '1D' | '2D';
    readonly payload: unknown;
    readonly timeout: number;
    readonly createdAt: Date;
}

export interface ITaskProgress {
    readonly taskId: string;
    readonly phase: TaskPhase;
    readonly progress: number; // 0-100
    readonly message?: string;
    readonly startedAt?: Date;
    readonly completedAt?: Date;
}

export type TaskProgressCallback = (progress: ITaskProgress) => void;

// ==================== POOL MANAGER ====================

export class OptimizationPool {
    private static instance: OptimizationPool | null = null;
    private pool: Piscina | null = null;
    private readonly config: Required<IPiscinaConfig>;
    private initialized = false;

    // Task tracking for cancellation and progress
    private readonly activeTasks: Map<string, AbortController> = new Map();
    private readonly taskProgress: Map<string, ITaskProgress> = new Map();
    private progressCallback: TaskProgressCallback | null = null;

    private constructor(config: IPiscinaConfig = {}) {
        this.config = {
            ...defaultPiscinaConfig,
            ...config
        };
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: IPiscinaConfig): OptimizationPool {
        OptimizationPool.instance ??= new OptimizationPool(config);
        return OptimizationPool.instance;
    }

    /**
     * Initialize the pool
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        const workerPath = path.resolve(__dirname, '../optimization/optimization.worker.js');

        this.pool = new Piscina({
            filename: workerPath,
            minThreads: this.config.minThreads,
            maxThreads: this.config.maxThreads,
            idleTimeout: this.config.idleTimeout,
            maxQueue:
                this.config.maxQueue === 'auto' ? this.config.maxThreads * this.config.maxThreads : this.config.maxQueue
        });

        this.initialized = true;
        logger.info('Pool initialized', { minThreads: this.config.minThreads, maxThreads: this.config.maxThreads });
    }

    /**
     * Run 1D optimization in worker thread
     */
    async run1D<T>(payload: T, signal?: AbortSignal): Promise<unknown> {
        this.ensureInitialized();
        return this.pool!.run(payload, { name: 'optimize1D', signal });
    }

    /**
     * Run 2D optimization in worker thread
     */
    async run2D<T>(payload: T, signal?: AbortSignal): Promise<unknown> {
        this.ensureInitialized();
        return this.pool!.run(payload, { name: 'optimize2D', signal });
    }

    /**
     * Run optimization with full task tracking, timeout, and cancellation support
     */
    async runWithTracking(task: IOptimizationTask): Promise<unknown> {
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

            const result =
                task.type === '1D'
                    ? await this.run1D(task.payload, controller.signal)
                    : await this.run2D(task.payload, controller.signal);

            this.updateProgress(task.id, {
                phase: 'completed',
                progress: 100,
                completedAt: new Date()
            });

            return result;
        } catch (error) {
            const phase: TaskPhase = controller.signal.aborted ? 'cancelled' : 'failed';
            this.updateProgress(task.id, {
                phase,
                progress: 0,
                message: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date()
            });
            throw error;
        } finally {
            clearTimeout(timeoutId);
            this.activeTasks.delete(task.id);
        }
    }

    /**
     * Cancel a running task by ID
     * @returns true if task was found and cancelled
     */
    cancelTask(taskId: string): boolean {
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
    getTaskProgress(taskId: string): ITaskProgress | undefined {
        return this.taskProgress.get(taskId);
    }

    /**
     * Get all active task IDs
     */
    getActiveTasks(): string[] {
        return Array.from(this.activeTasks.keys());
    }

    /**
     * Set callback for progress updates (for WebSocket broadcasting)
     */
    setProgressCallback(callback: TaskProgressCallback | null): void {
        this.progressCallback = callback;
    }

    /**
     * Update and broadcast task progress
     */
    private updateProgress(taskId: string, update: Partial<ITaskProgress>): void {
        const current = this.taskProgress.get(taskId) ?? {
            taskId,
            phase: 'queued' as TaskPhase,
            progress: 0
        };

        const updated: ITaskProgress = { ...current, ...update };
        this.taskProgress.set(taskId, updated);

        // Notify callback if set (for WebSocket updates)
        if (this.progressCallback) {
            this.progressCallback(updated);
        }
    }

    /**
     * Get pool statistics
     */
    getStats(): IOptimizationPoolStats {
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
    async healthCheck(): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
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
    async shutdown(): Promise<void> {
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
    isReady(): boolean {
        return this.initialized && this.pool !== null;
    }

    /**
     * Ensure pool is initialized
     */
    private ensureInitialized(): void {
        if (!this.initialized || !this.pool) {
            throw new Error('Piscina pool not initialized. Call initialize() first.');
        }
    }

    /**
     * Reset singleton (for testing)
     */
    static async reset(): Promise<void> {
        if (OptimizationPool.instance) {
            await OptimizationPool.instance.shutdown();
        }
        OptimizationPool.instance = null;
    }
}

// ==================== HELPER FUNCTIONS ====================

export function getOptimizationPool(config?: IPiscinaConfig): OptimizationPool {
    return OptimizationPool.getInstance(config);
}

export async function initializeOptimizationPool(config?: IPiscinaConfig): Promise<OptimizationPool> {
    const pool = OptimizationPool.getInstance(config);
    await pool.initialize();
    return pool;
}

export async function shutdownOptimizationPool(): Promise<void> {
    await OptimizationPool.reset();
}
