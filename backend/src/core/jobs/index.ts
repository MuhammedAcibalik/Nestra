/**
 * Jobs Module - Barrel Export
 * Factory functions for job queue management
 */

import {
    IJobData,
    JobType,
    IOptimizationJobData
} from './job-queue.interface';
import { BullMQManager, BullMQQueue, IBullMQConfig } from './bullmq.queue';
import { createOptimizationJobProcessor } from './optimization.job';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('JobsFactory');

// Re-exports
export {
    IJobQueue,
    IJobData,
    IJobOptions,
    IJobProcessor,
    IQueueManager,
    JobType,
    IOptimizationJobData,
    IReportJobData,
    IExportJobData,
    IImportJobData
} from './job-queue.interface';

export { BullMQManager, BullMQQueue, IBullMQConfig } from './bullmq.queue';
export {
    OptimizationJobProcessor,
    IOptimizationJobResult,
    createOptimizationJobProcessor
} from './optimization.job';

// ==================== SINGLETON ====================

let queueManager: BullMQManager | null = null;

/**
 * Initialize job queue manager
 */
export async function initializeJobQueue(config?: IBullMQConfig): Promise<BullMQManager> {
    if (queueManager) {
        logger.warn('Job queue already initialized');
        return queueManager;
    }

    // Check if job queue is enabled
    const useJobQueue = process.env.USE_JOB_QUEUE === 'true';
    if (!useJobQueue) {
        logger.info('Job queue disabled (USE_JOB_QUEUE != true)');
    }

    queueManager = new BullMQManager(config);
    logger.info('Job queue manager initialized');

    return queueManager;
}

/**
 * Get job queue manager
 */
export function getJobQueueManager(): BullMQManager | null {
    return queueManager;
}

/**
 * Get a specific queue
 */
export function getQueue<T extends IJobData = IJobData>(name: string): BullMQQueue<T> | null {
    if (!queueManager) {
        logger.warn('Job queue not initialized');
        return null;
    }
    return queueManager.getQueue<T>(name);
}

/**
 * Add optimization job to queue
 */
export async function addOptimizationJob(
    scenarioId: string,
    userId: string,
    options?: {
        priority?: 'low' | 'normal' | 'high';
        delay?: number;
    }
): Promise<string | null> {
    const queue = getQueue<IOptimizationJobData>('optimization');
    if (!queue) {
        logger.warn('Optimization queue not available, job not added');
        return null;
    }

    const priorityMap: Record<string, number> = {
        high: 1,
        normal: 5,
        low: 10
    };

    const job = await queue.add(
        JobType.OPTIMIZATION_RUN,
        {
            scenarioId,
            userId,
            priority: options?.priority ?? 'normal'
        },
        {
            priority: priorityMap[options?.priority ?? 'normal'],
            delay: options?.delay,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            },
            removeOnComplete: 100,
            removeOnFail: 500
        }
    );

    logger.info(`Optimization job queued`, {
        jobId: job.id,
        scenarioId,
        priority: options?.priority ?? 'normal'
    });

    return job.id;
}

/**
 * Setup optimization queue with processor
 */
export function setupOptimizationQueue(
    runOptimization: (scenarioId: string) => Promise<{
        success: boolean;
        planId?: string;
        totalWaste?: number;
        wastePercentage?: number;
        stockUsedCount?: number;
        efficiency?: number;
        error?: string;
    }>,
    onProgressCallback?: (userId: string, scenarioId: string, status: string, progress: number, data?: object) => void
): void {
    if (!queueManager) {
        logger.warn('Job queue not initialized, cannot setup optimization queue');
        return;
    }

    const queue = queueManager.getQueue<IOptimizationJobData>('optimization');
    const processor = createOptimizationJobProcessor(runOptimization, onProgressCallback);
    processor.setQueue(queue);
    queue.registerProcessor(processor);

    logger.info('Optimization queue processor registered');
}

/**
 * Shutdown job queue
 */
export async function shutdownJobQueue(): Promise<void> {
    if (queueManager) {
        await queueManager.shutdown();
        queueManager = null;
        logger.info('Job queue shutdown complete');
    }
}

/**
 * Get job queue statistics
 */
export async function getJobQueueStats(): Promise<Record<string, {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}> | null> {
    if (!queueManager) {
        return null;
    }
    return queueManager.getAllStats();
}

/**
 * Check if job queue is enabled and initialized
 */
export function isJobQueueEnabled(): boolean {
    return queueManager !== null && process.env.USE_JOB_QUEUE === 'true';
}
