/**
 * Worker Pool Manager
 * Generic thread pool for CPU-intensive tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 */
import { EventEmitter } from 'node:events';
import { IWorkerTask, IWorkerResult } from './worker-task';
export interface IWorkerPoolConfig {
    minWorkers?: number;
    maxWorkers?: number;
    taskTimeout?: number;
    idleTimeout?: number;
    workerScript: string;
}
export declare class WorkerPool extends EventEmitter {
    private readonly config;
    private workers;
    private taskQueue;
    private readonly pendingTasks;
    private isShuttingDown;
    constructor(config: IWorkerPoolConfig);
    initialize(): Promise<void>;
    execute<TPayload, TResult>(task: IWorkerTask<TPayload>): Promise<IWorkerResult<TResult>>;
    shutdown(): Promise<void>;
    getStats(): {
        total: number;
        busy: number;
        idle: number;
        queued: number;
    };
    private spawnWorker;
    private processQueue;
    private assignTaskToWorker;
    private handleWorkerMessage;
    private handleWorkerError;
    private handleWorkerExit;
    private handleTaskTimeout;
    private removeWorker;
}
export declare function getOptimizationWorkerPool(config?: Partial<IWorkerPoolConfig>): WorkerPool;
export declare function shutdownOptimizationPool(): Promise<void>;
//# sourceMappingURL=worker-pool.d.ts.map