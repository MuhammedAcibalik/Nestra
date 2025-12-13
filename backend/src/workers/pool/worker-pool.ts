/**
 * Worker Pool Manager
 * Generic thread pool for CPU-intensive tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 */

import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { EventEmitter } from 'node:events';
import path from 'node:path';

import { IWorkerTask, IWorkerResult } from './worker-task';

// ==================== INTERFACES ====================

export interface IWorkerPoolConfig {
    minWorkers?: number;
    maxWorkers?: number;
    taskTimeout?: number; // ms
    idleTimeout?: number; // ms before terminating idle workers
    workerScript: string;
}

interface IPooledWorker {
    worker: Worker;
    busy: boolean;
    currentTaskId?: string;
    taskStartTime?: number;
}

interface IPendingTask<T> {
    task: IWorkerTask<T>;
    resolve: (result: IWorkerResult) => void;
    reject: (error: Error) => void;
    timeout?: NodeJS.Timeout;
}

// ==================== WORKER POOL CLASS ====================

export class WorkerPool extends EventEmitter {
    private readonly config: Required<IWorkerPoolConfig>;
    private workers: IPooledWorker[] = [];
    private taskQueue: IPendingTask<unknown>[] = [];
    private readonly pendingTasks: Map<string, IPendingTask<unknown>> = new Map();
    private isShuttingDown = false;

    constructor(config: IWorkerPoolConfig) {
        super();
        this.config = {
            minWorkers: config.minWorkers ?? 1,
            maxWorkers: config.maxWorkers ?? Math.max(1, Math.floor(cpus().length / 2)),
            taskTimeout: config.taskTimeout ?? 60000, // 60 seconds
            idleTimeout: config.idleTimeout ?? 30000, // 30 seconds
            workerScript: config.workerScript
        };
    }

    // ==================== PUBLIC API ====================

    async initialize(): Promise<void> {
        console.log(`[WORKER POOL] Initializing with ${this.config.minWorkers}-${this.config.maxWorkers} workers`);

        // Start minimum number of workers
        for (let i = 0; i < this.config.minWorkers; i++) {
            await this.spawnWorker();
        }
    }

    async execute<TPayload, TResult>(task: IWorkerTask<TPayload>): Promise<IWorkerResult<TResult>> {
        if (this.isShuttingDown) {
            throw new Error('Worker pool is shutting down');
        }

        return new Promise((resolve, reject) => {
            const pendingTask: IPendingTask<TPayload> = {
                task,
                resolve: resolve as (result: IWorkerResult) => void,
                reject,
                timeout: undefined
            };

            // Set timeout
            if (this.config.taskTimeout > 0) {
                pendingTask.timeout = setTimeout(() => {
                    this.handleTaskTimeout(task.id);
                }, this.config.taskTimeout);
            }

            this.pendingTasks.set(task.id, pendingTask as IPendingTask<unknown>);
            this.taskQueue.push(pendingTask as IPendingTask<unknown>);
            this.processQueue();
        });
    }

    async shutdown(): Promise<void> {
        console.log('[WORKER POOL] Shutting down...');
        this.isShuttingDown = true;

        // Clear pending tasks
        for (const [taskId, pending] of this.pendingTasks) {
            if (pending.timeout) clearTimeout(pending.timeout);
            pending.reject(new Error('Worker pool shutting down'));
        }
        this.pendingTasks.clear();
        this.taskQueue = [];

        // Terminate all workers
        const terminations = this.workers.map(pw => {
            return new Promise<void>((resolve) => {
                pw.worker.once('exit', () => resolve());
                pw.worker.terminate();
            });
        });

        await Promise.all(terminations);
        this.workers = [];
        console.log('[WORKER POOL] Shutdown complete');
    }

    getStats(): { total: number; busy: number; idle: number; queued: number } {
        const busy = this.workers.filter(w => w.busy).length;
        return {
            total: this.workers.length,
            busy,
            idle: this.workers.length - busy,
            queued: this.taskQueue.length
        };
    }

    // ==================== PRIVATE METHODS ====================

    private async spawnWorker(): Promise<IPooledWorker> {
        const workerPath = path.resolve(this.config.workerScript);

        const worker = new Worker(workerPath);
        const pooledWorker: IPooledWorker = {
            worker,
            busy: false
        };

        worker.on('message', (result: IWorkerResult) => {
            this.handleWorkerMessage(pooledWorker, result);
        });

        worker.on('error', (error) => {
            console.error('[WORKER POOL] Worker error:', error);
            this.handleWorkerError(pooledWorker, error);
        });

        worker.on('exit', (code) => {
            this.handleWorkerExit(pooledWorker, code);
        });

        this.workers.push(pooledWorker);
        console.log(`[WORKER POOL] Worker spawned (total: ${this.workers.length})`);

        return pooledWorker;
    }

    private processQueue(): void {
        if (this.taskQueue.length === 0) return;

        // Find an idle worker
        let idleWorker = this.workers.find(w => !w.busy);

        // Scale up if needed and allowed
        if (!idleWorker && this.workers.length < this.config.maxWorkers) {
            this.spawnWorker().then(newWorker => {
                this.assignTaskToWorker(newWorker);
            });
            return;
        }

        if (idleWorker) {
            this.assignTaskToWorker(idleWorker);
        }
    }

    private assignTaskToWorker(pooledWorker: IPooledWorker): void {
        const pending = this.taskQueue.shift();
        if (!pending) return;

        pooledWorker.busy = true;
        pooledWorker.currentTaskId = pending.task.id;
        pooledWorker.taskStartTime = Date.now();

        pooledWorker.worker.postMessage(pending.task);
    }

    private handleWorkerMessage(pooledWorker: IPooledWorker, result: IWorkerResult): void {
        const pending = this.pendingTasks.get(result.id);

        if (pending) {
            if (pending.timeout) clearTimeout(pending.timeout);
            this.pendingTasks.delete(result.id);
            pending.resolve(result);
        }

        // Mark worker as idle
        pooledWorker.busy = false;
        pooledWorker.currentTaskId = undefined;
        pooledWorker.taskStartTime = undefined;

        // Process next task
        this.processQueue();
    }

    private handleWorkerError(pooledWorker: IPooledWorker, error: Error): void {
        if (pooledWorker.currentTaskId) {
            const pending = this.pendingTasks.get(pooledWorker.currentTaskId);
            if (pending) {
                if (pending.timeout) clearTimeout(pending.timeout);
                this.pendingTasks.delete(pooledWorker.currentTaskId);
                pending.reject(error);
            }
        }

        // Remove and replace worker
        this.removeWorker(pooledWorker);
        if (!this.isShuttingDown && this.workers.length < this.config.minWorkers) {
            this.spawnWorker();
        }
    }

    private handleWorkerExit(pooledWorker: IPooledWorker, code: number): void {
        console.log(`[WORKER POOL] Worker exited with code ${code}`);
        this.removeWorker(pooledWorker);

        // Replace worker if below minimum
        if (!this.isShuttingDown && this.workers.length < this.config.minWorkers) {
            this.spawnWorker().then(() => this.processQueue());
        }
    }

    private handleTaskTimeout(taskId: string): void {
        const pending = this.pendingTasks.get(taskId);
        if (pending) {
            this.pendingTasks.delete(taskId);
            pending.reject(new Error(`Task ${taskId} timed out`));
        }

        // Find and terminate the worker handling this task
        const worker = this.workers.find(w => w.currentTaskId === taskId);
        if (worker) {
            console.warn(`[WORKER POOL] Terminating worker due to timeout on task ${taskId}`);
            worker.worker.terminate();
        }
    }

    private removeWorker(pooledWorker: IPooledWorker): void {
        const index = this.workers.indexOf(pooledWorker);
        if (index !== -1) {
            this.workers.splice(index, 1);
        }
    }
}

// ==================== SINGLETON INSTANCE ====================

let poolInstance: WorkerPool | null = null;

export function getOptimizationWorkerPool(config?: Partial<IWorkerPoolConfig>): WorkerPool {
    if (!poolInstance) {
        poolInstance = new WorkerPool({
            minWorkers: config?.minWorkers ?? 1,
            maxWorkers: config?.maxWorkers ?? Math.max(1, Math.floor(cpus().length / 2)),
            taskTimeout: config?.taskTimeout ?? 60000,
            workerScript: path.join(__dirname, '../optimization/optimization.worker.js')
        });
    }
    return poolInstance;
}

export async function shutdownOptimizationPool(): Promise<void> {
    if (poolInstance) {
        await poolInstance.shutdown();
        poolInstance = null;
    }
}
