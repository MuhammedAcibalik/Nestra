/**
 * Optimization Job Processor
 * Handles background optimization jobs via BullMQ
 * Following Single Responsibility Principle (SRP)
 */

import { IJobProcessor, IJob, IJobResult, IOptimizationJobData } from './job-queue.interface';
import { BullMQQueue } from './bullmq.queue';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('OptimizationJob');

// ==================== JOB RESULT TYPES ====================

export interface IOptimizationJobResult {
    planId: string;
    scenarioId: string;
    success: boolean;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    efficiency: number;
    duration: number;
}

// ==================== PROCESSOR ====================

/**
 * Optimization Job Processor
 * Processes optimization jobs asynchronously
 */
export class OptimizationJobProcessor implements IJobProcessor<IOptimizationJobData, IOptimizationJobResult> {
    private queue: BullMQQueue<IOptimizationJobData> | null = null;

    constructor(
        private readonly runOptimization: (scenarioId: string) => Promise<{
            success: boolean;
            planId?: string;
            totalWaste?: number;
            wastePercentage?: number;
            stockUsedCount?: number;
            efficiency?: number;
            error?: string;
        }>,
        private readonly onProgressCallback?: (
            userId: string,
            scenarioId: string,
            status: string,
            progress: number,
            data?: object
        ) => void
    ) {}

    /**
     * Set queue reference for progress updates
     */
    setQueue(queue: BullMQQueue<IOptimizationJobData>): void {
        this.queue = queue;
    }

    /**
     * Process an optimization job
     */
    async process(job: IJob<IOptimizationJobData>): Promise<IJobResult<IOptimizationJobResult>> {
        const { scenarioId, userId } = job.data;
        const startTime = Date.now();

        logger.info(`Processing optimization job`, {
            jobId: job.id,
            scenarioId,
            userId,
            priority: job.data.priority
        });

        // Notify that optimization started
        this.notifyProgress(userId, scenarioId, 'started', 0);

        try {
            // Update progress: 10% - Starting
            await this.updateProgress(job.id, 10);
            this.notifyProgress(userId, scenarioId, 'preparing', 10);

            // Update progress: 30% - Running algorithm
            await this.updateProgress(job.id, 30);
            this.notifyProgress(userId, scenarioId, 'optimizing', 30);

            // Run the actual optimization
            const result = await this.runOptimization(scenarioId);

            // Update progress: 90% - Saving results
            await this.updateProgress(job.id, 90);
            this.notifyProgress(userId, scenarioId, 'saving', 90);

            const duration = Date.now() - startTime;

            if (!result.success) {
                this.notifyProgress(userId, scenarioId, 'failed', 100, { error: result.error });
                return {
                    success: false,
                    error: result.error ?? 'Optimization failed'
                };
            }

            // Update progress: 100% - Complete
            await this.updateProgress(job.id, 100);

            const jobResult: IOptimizationJobResult = {
                planId: result.planId ?? '',
                scenarioId,
                success: true,
                totalWaste: result.totalWaste ?? 0,
                wastePercentage: result.wastePercentage ?? 0,
                stockUsedCount: result.stockUsedCount ?? 0,
                efficiency: result.efficiency ?? 0,
                duration
            };

            this.notifyProgress(userId, scenarioId, 'completed', 100, {
                planId: jobResult.planId,
                efficiency: jobResult.efficiency,
                duration
            });

            logger.info(`Optimization job completed`, {
                jobId: job.id,
                scenarioId,
                planId: jobResult.planId,
                duration: `${duration}ms`,
                efficiency: `${jobResult.efficiency}%`
            });

            return {
                success: true,
                data: jobResult
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            logger.error(`Optimization job failed`, {
                jobId: job.id,
                scenarioId,
                error: errorMessage,
                duration: `${duration}ms`
            });

            this.notifyProgress(userId, scenarioId, 'failed', 100, { error: errorMessage });

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Called when job completes successfully
     */
    async onCompleted(job: IJob<IOptimizationJobData>, result: IJobResult<IOptimizationJobResult>): Promise<void> {
        if (result.success && result.data) {
            logger.info(`Job ${job.id} completed successfully`, {
                scenarioId: job.data.scenarioId,
                planId: result.data.planId
            });
        }
    }

    /**
     * Called when job fails
     */
    async onFailed(job: IJob<IOptimizationJobData>, error: Error): Promise<void> {
        logger.error(`Optimization job failed permanently`, {
            jobId: job.id,
            scenarioId: job.data.scenarioId,
            attemptsMade: job.attemptsMade,
            error: error.message
        });
    }

    /**
     * Called on progress update
     */
    async onProgress(job: IJob<IOptimizationJobData>, progress: number): Promise<void> {
        logger.debug(`Job ${job.id} progress: ${progress}%`);
    }

    /**
     * Update job progress
     */
    private async updateProgress(jobId: string, progress: number): Promise<void> {
        if (this.queue) {
            await this.queue.updateProgress(jobId, progress);
        }
    }

    /**
     * Notify progress via callback
     */
    private notifyProgress(userId: string, scenarioId: string, status: string, progress: number, data?: object): void {
        if (this.onProgressCallback) {
            this.onProgressCallback(userId, scenarioId, status, progress, data);
        }
    }
}

// ==================== FACTORY ====================

/**
 * Create optimization job processor
 */
export function createOptimizationJobProcessor(
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
): OptimizationJobProcessor {
    return new OptimizationJobProcessor(runOptimization, onProgressCallback);
}
