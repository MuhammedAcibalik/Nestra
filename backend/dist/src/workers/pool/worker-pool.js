"use strict";
/**
 * Worker Pool Manager
 * Generic thread pool for CPU-intensive tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
exports.getOptimizationWorkerPool = getOptimizationWorkerPool;
exports.shutdownOptimizationPool = shutdownOptimizationPool;
const node_worker_threads_1 = require("node:worker_threads");
const node_os_1 = require("node:os");
const node_events_1 = require("node:events");
const node_path_1 = __importDefault(require("node:path"));
// ==================== WORKER POOL CLASS ====================
class WorkerPool extends node_events_1.EventEmitter {
    config;
    workers = [];
    taskQueue = [];
    pendingTasks = new Map();
    isShuttingDown = false;
    constructor(config) {
        super();
        this.config = {
            minWorkers: config.minWorkers ?? 1,
            maxWorkers: config.maxWorkers ?? Math.max(1, Math.floor((0, node_os_1.cpus)().length / 2)),
            taskTimeout: config.taskTimeout ?? 60000, // 60 seconds
            idleTimeout: config.idleTimeout ?? 30000, // 30 seconds
            workerScript: config.workerScript
        };
    }
    // ==================== PUBLIC API ====================
    async initialize() {
        console.log(`[WORKER POOL] Initializing with ${this.config.minWorkers}-${this.config.maxWorkers} workers`);
        // Start minimum number of workers
        for (let i = 0; i < this.config.minWorkers; i++) {
            await this.spawnWorker();
        }
    }
    async execute(task) {
        if (this.isShuttingDown) {
            throw new Error('Worker pool is shutting down');
        }
        return new Promise((resolve, reject) => {
            const pendingTask = {
                task,
                resolve: resolve,
                reject,
                timeout: undefined
            };
            // Set timeout
            if (this.config.taskTimeout > 0) {
                pendingTask.timeout = setTimeout(() => {
                    this.handleTaskTimeout(task.id);
                }, this.config.taskTimeout);
            }
            this.pendingTasks.set(task.id, pendingTask);
            this.taskQueue.push(pendingTask);
            this.processQueue();
        });
    }
    async shutdown() {
        console.log('[WORKER POOL] Shutting down...');
        this.isShuttingDown = true;
        // Clear pending tasks
        for (const [taskId, pending] of this.pendingTasks) {
            if (pending.timeout)
                clearTimeout(pending.timeout);
            pending.reject(new Error('Worker pool shutting down'));
        }
        this.pendingTasks.clear();
        this.taskQueue = [];
        // Terminate all workers
        const terminations = this.workers.map(pw => {
            return new Promise((resolve) => {
                pw.worker.once('exit', () => resolve());
                pw.worker.terminate();
            });
        });
        await Promise.all(terminations);
        this.workers = [];
        console.log('[WORKER POOL] Shutdown complete');
    }
    getStats() {
        const busy = this.workers.filter(w => w.busy).length;
        return {
            total: this.workers.length,
            busy,
            idle: this.workers.length - busy,
            queued: this.taskQueue.length
        };
    }
    // ==================== PRIVATE METHODS ====================
    async spawnWorker() {
        const workerPath = node_path_1.default.resolve(this.config.workerScript);
        const worker = new node_worker_threads_1.Worker(workerPath);
        const pooledWorker = {
            worker,
            busy: false
        };
        worker.on('message', (result) => {
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
    processQueue() {
        if (this.taskQueue.length === 0)
            return;
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
    assignTaskToWorker(pooledWorker) {
        const pending = this.taskQueue.shift();
        if (!pending)
            return;
        pooledWorker.busy = true;
        pooledWorker.currentTaskId = pending.task.id;
        pooledWorker.taskStartTime = Date.now();
        pooledWorker.worker.postMessage(pending.task);
    }
    handleWorkerMessage(pooledWorker, result) {
        const pending = this.pendingTasks.get(result.id);
        if (pending) {
            if (pending.timeout)
                clearTimeout(pending.timeout);
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
    handleWorkerError(pooledWorker, error) {
        if (pooledWorker.currentTaskId) {
            const pending = this.pendingTasks.get(pooledWorker.currentTaskId);
            if (pending) {
                if (pending.timeout)
                    clearTimeout(pending.timeout);
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
    handleWorkerExit(pooledWorker, code) {
        console.log(`[WORKER POOL] Worker exited with code ${code}`);
        this.removeWorker(pooledWorker);
        // Replace worker if below minimum
        if (!this.isShuttingDown && this.workers.length < this.config.minWorkers) {
            this.spawnWorker().then(() => this.processQueue());
        }
    }
    handleTaskTimeout(taskId) {
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
    removeWorker(pooledWorker) {
        const index = this.workers.indexOf(pooledWorker);
        if (index !== -1) {
            this.workers.splice(index, 1);
        }
    }
}
exports.WorkerPool = WorkerPool;
// ==================== SINGLETON INSTANCE ====================
let poolInstance = null;
function getOptimizationWorkerPool(config) {
    if (!poolInstance) {
        poolInstance = new WorkerPool({
            minWorkers: config?.minWorkers ?? 1,
            maxWorkers: config?.maxWorkers ?? Math.max(1, Math.floor((0, node_os_1.cpus)().length / 2)),
            taskTimeout: config?.taskTimeout ?? 60000,
            workerScript: node_path_1.default.join(__dirname, '../optimization/optimization.worker.js')
        });
    }
    return poolInstance;
}
async function shutdownOptimizationPool() {
    if (poolInstance) {
        await poolInstance.shutdown();
        poolInstance = null;
    }
}
//# sourceMappingURL=worker-pool.js.map