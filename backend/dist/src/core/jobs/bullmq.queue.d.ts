/**
 * BullMQ Queue Implementation
 * Redis-based job queue with retry, delay, and priority support
 * Following Single Responsibility Principle (SRP)
 */
import { RedisOptions } from 'ioredis';
import { IJobQueue, IJob, IJobData, IJobOptions, IJobProcessor, JobStatus } from './job-queue.interface';
export interface IBullMQConfig {
    redis: RedisOptions;
    defaultJobOptions?: IJobOptions;
}
/**
 * Get Redis config from environment
 */
export declare function getRedisConfig(): RedisOptions;
/**
 * BullMQ Queue Adapter
 * Wraps BullMQ Queue with our interface
 */
export declare class BullMQQueue<T extends IJobData = IJobData> implements IJobQueue<T> {
    readonly name: string;
    private readonly redisConfig;
    private readonly defaultOptions?;
    private readonly queue;
    private worker;
    constructor(name: string, redisConfig: RedisOptions, defaultOptions?: IJobOptions | undefined);
    private convertOptions;
    private convertJob;
    private mapJobState;
    add(jobName: string, data: T, options?: IJobOptions): Promise<IJob<T>>;
    addBulk(jobs: Array<{
        name: string;
        data: T;
        options?: IJobOptions;
    }>): Promise<IJob<T>[]>;
    getJob(jobId: string): Promise<IJob<T> | null>;
    getJobs(status: JobStatus | JobStatus[], start?: number, end?: number): Promise<IJob<T>[]>;
    removeJob(jobId: string): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    clean(grace: number, status: 'completed' | 'failed'): Promise<string[]>;
    close(): Promise<void>;
    /**
     * Register a processor for this queue
     */
    registerProcessor<R = unknown>(processor: IJobProcessor<T, R>, concurrency?: number): void;
    /**
     * Update job progress
     */
    updateProgress(jobId: string, progress: number): Promise<void>;
    /**
     * Get queue statistics
     */
    getStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
}
interface IQueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}
/**
 * BullMQ Queue Manager
 * Manages multiple queues and their processors
 */
export declare class BullMQManager {
    private readonly queues;
    private readonly redisConfig;
    private readonly defaultOptions?;
    constructor(config?: IBullMQConfig);
    getQueue<T extends IJobData = IJobData>(name: string): BullMQQueue<T>;
    registerProcessor<T extends IJobData = IJobData, R = unknown>(queueName: string, processor: IJobProcessor<T, R>): void;
    getQueueNames(): string[];
    shutdown(): Promise<void>;
    /**
     * Get statistics for all queues
     */
    getAllStats(): Promise<Record<string, IQueueStats>>;
}
export {};
//# sourceMappingURL=bullmq.queue.d.ts.map