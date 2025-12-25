/**
 * Optimization Job Processor
 * Handles background optimization jobs via BullMQ
 * Following Single Responsibility Principle (SRP)
 */
import { IJobProcessor, IJob, IJobResult, IOptimizationJobData } from './job-queue.interface';
import { BullMQQueue } from './bullmq.queue';
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
/**
 * Optimization Job Processor
 * Processes optimization jobs asynchronously
 */
export declare class OptimizationJobProcessor implements IJobProcessor<IOptimizationJobData, IOptimizationJobResult> {
    private readonly runOptimization;
    private readonly onProgressCallback?;
    private queue;
    constructor(runOptimization: (scenarioId: string) => Promise<{
        success: boolean;
        planId?: string;
        totalWaste?: number;
        wastePercentage?: number;
        stockUsedCount?: number;
        efficiency?: number;
        error?: string;
    }>, onProgressCallback?: ((userId: string, scenarioId: string, status: string, progress: number, data?: object) => void) | undefined);
    /**
     * Set queue reference for progress updates
     */
    setQueue(queue: BullMQQueue<IOptimizationJobData>): void;
    /**
     * Process an optimization job
     */
    process(job: IJob<IOptimizationJobData>): Promise<IJobResult<IOptimizationJobResult>>;
    /**
     * Called when job completes successfully
     */
    onCompleted(job: IJob<IOptimizationJobData>, result: IJobResult<IOptimizationJobResult>): Promise<void>;
    /**
     * Called when job fails
     */
    onFailed(job: IJob<IOptimizationJobData>, error: Error): Promise<void>;
    /**
     * Called on progress update
     */
    onProgress(job: IJob<IOptimizationJobData>, progress: number): Promise<void>;
    /**
     * Update job progress
     */
    private updateProgress;
    /**
     * Notify progress via callback
     */
    private notifyProgress;
}
/**
 * Create optimization job processor
 */
export declare function createOptimizationJobProcessor(runOptimization: (scenarioId: string) => Promise<{
    success: boolean;
    planId?: string;
    totalWaste?: number;
    wastePercentage?: number;
    stockUsedCount?: number;
    efficiency?: number;
    error?: string;
}>, onProgressCallback?: (userId: string, scenarioId: string, status: string, progress: number, data?: object) => void): OptimizationJobProcessor;
//# sourceMappingURL=optimization.job.d.ts.map