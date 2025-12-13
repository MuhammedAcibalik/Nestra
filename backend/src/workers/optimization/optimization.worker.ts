/**
 * Optimization Worker Entry Point
 * Runs in separate thread, receives tasks via parentPort
 * Following Microservice Pattern: Message Passing, Shared-Nothing
 */

import { parentPort, isMainThread } from 'node:worker_threads';
import { IWorkerTask, IOptimization1DPayload, IOptimization2DPayload } from '../pool/worker-task';
import { OptimizationWorkerHandler } from './worker-handler';

// ==================== WORKER INITIALIZATION ====================

if (isMainThread) {
    throw new Error('This file should be run as a worker thread, not in main thread');
}

if (!parentPort) {
    throw new Error('parentPort is not available');
}

const handler = new OptimizationWorkerHandler();

console.log('[OPTIMIZATION WORKER] Started');

// ==================== MESSAGE LISTENER ====================

parentPort.on('message', (task: IWorkerTask<IOptimization1DPayload | IOptimization2DPayload>) => {
    console.log(`[OPTIMIZATION WORKER] Received task: ${task.id} (${task.type})`);

    const result = handler.handleTask(task);

    console.log(`[OPTIMIZATION WORKER] Completed task: ${task.id} (${result.success ? 'success' : 'failed'}) in ${result.executionTime}ms`);

    parentPort!.postMessage(result);
});

// ==================== ERROR HANDLING ====================

process.on('uncaughtException', (error) => {
    console.error('[OPTIMIZATION WORKER] Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('[OPTIMIZATION WORKER] Unhandled rejection:', reason);
    process.exit(1);
});
