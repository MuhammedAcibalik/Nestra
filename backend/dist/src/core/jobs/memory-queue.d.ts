/**
 * In-Memory Job Queue Implementation
 * For development and testing, with production-ready interface
 * Following Strategy Pattern - can be swapped with Redis-based BullMQ
 */
import { IJobQueue, IJobData, IJobOptions, IJobInfo, IQueueStats, IJobProcessor, JobStatus } from './interfaces';
export declare class InMemoryJobQueue<TData extends IJobData = IJobData> implements IJobQueue<TData> {
    readonly name: string;
    private readonly jobs;
    private readonly processors;
    private readonly delayedJobs;
    private paused;
    private processing;
    private jobCounter;
    constructor(name: string);
    /**
     * Register a processor for a job type
     */
    registerProcessor(jobName: string, processor: IJobProcessor<TData>): void;
    /**
     * Add a job to the queue
     */
    add(name: string, data: TData, options?: IJobOptions): Promise<string>;
    /**
     * Add multiple jobs
     */
    addBulk(jobs: Array<{
        name: string;
        data: TData;
        options?: IJobOptions;
    }>): Promise<string[]>;
    /**
     * Get job by ID
     */
    getJob(jobId: string): Promise<IJobInfo | null>;
    /**
     * Get queue statistics
     */
    getStats(): Promise<IQueueStats>;
    /**
     * Pause the queue
     */
    pause(): Promise<void>;
    /**
     * Resume the queue
     */
    resume(): Promise<void>;
    /**
     * Clean old jobs
     */
    clean(grace: number, limit: number, status: JobStatus): Promise<string[]>;
    /**
     * Process the next job in queue
     */
    private processQueue;
    /**
     * Calculate backoff delay
     */
    private calculateBackoff;
    /**
     * Shutdown the queue
     */
    shutdown(): Promise<void>;
}
export declare function createQueue<TData extends IJobData = IJobData>(name: string): InMemoryJobQueue<TData>;
export declare function getQueue<TData extends IJobData = IJobData>(name: string): InMemoryJobQueue<TData> | undefined;
export declare function shutdownAllQueues(): Promise<void>;
//# sourceMappingURL=memory-queue.d.ts.map