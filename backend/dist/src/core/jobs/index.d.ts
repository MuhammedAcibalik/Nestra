/**
 * Jobs Module - Barrel Export
 * Factory functions for job queue management
 */
import { IJobData } from './job-queue.interface';
import { BullMQManager, BullMQQueue, IBullMQConfig } from './bullmq.queue';
export { IJobQueue, IJobData, IJobOptions, IJobProcessor, IQueueManager, JobType, IOptimizationJobData, IReportJobData, IExportJobData, IImportJobData } from './job-queue.interface';
export { IJobResult, IJobProgress, IJobInfo, IQueueStats, IEmailJobData, ICleanupJobData, JobStatus } from './interfaces';
export { InMemoryJobQueue, createQueue as createInMemoryQueue, getQueue as getInMemoryQueue, shutdownAllQueues as shutdownInMemoryQueues } from './memory-queue';
export { BullMQManager, BullMQQueue, IBullMQConfig } from './bullmq.queue';
export { OptimizationJobProcessor, IOptimizationJobResult, createOptimizationJobProcessor } from './optimization.job';
/**
 * Initialize job queue manager
 */
export declare function initializeJobQueue(config?: IBullMQConfig): Promise<BullMQManager>;
/**
 * Get job queue manager
 */
export declare function getJobQueueManager(): BullMQManager | null;
/**
 * Get a specific queue
 */
export declare function getQueue<T extends IJobData = IJobData>(name: string): BullMQQueue<T> | null;
/**
 * Add optimization job to queue
 */
export declare function addOptimizationJob(scenarioId: string, userId: string, options?: {
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
}): Promise<string | null>;
/**
 * Setup optimization queue with processor
 */
export declare function setupOptimizationQueue(runOptimization: (scenarioId: string) => Promise<{
    success: boolean;
    planId?: string;
    totalWaste?: number;
    wastePercentage?: number;
    stockUsedCount?: number;
    efficiency?: number;
    error?: string;
}>, onProgressCallback?: (userId: string, scenarioId: string, status: string, progress: number, data?: object) => void): void;
/**
 * Shutdown job queue
 */
export declare function shutdownJobQueue(): Promise<void>;
/**
 * Get job queue statistics
 */
export declare function getJobQueueStats(): Promise<Record<string, {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}> | null>;
/**
 * Check if job queue is enabled and initialized
 */
export declare function isJobQueueEnabled(): boolean;
//# sourceMappingURL=index.d.ts.map