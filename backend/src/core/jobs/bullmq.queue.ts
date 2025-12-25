/**
 * BullMQ Queue Implementation
 * Redis-based job queue with retry, delay, and priority support
 * Following Single Responsibility Principle (SRP)
 */

import { Queue, Worker, Job } from 'bullmq';
import { RedisOptions } from 'ioredis';
import {
    IJobQueue,
    IJob,
    IJobData,
    IJobOptions,
    IJobProcessor,
    JobStatus
} from './job-queue.interface';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('BullMQ');

// ==================== CONFIGURATION ====================

export interface IBullMQConfig {
    redis: RedisOptions;
    defaultJobOptions?: IJobOptions;
}

/**
 * Get Redis config from environment
 */
export function getRedisConfig(): RedisOptions {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
        try {
            const url = new URL(redisUrl);
            return {
                host: url.hostname,
                port: Number.parseInt(url.port, 10) || 6379,
                password: url.password || undefined,
                maxRetriesPerRequest: null // Required for BullMQ
            };
        } catch {
            logger.warn('Invalid REDIS_URL for BullMQ');
        }
    }

    return {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null
    };
}

// ==================== BULLMQ QUEUE ADAPTER ====================

/**
 * BullMQ Queue Adapter
 * Wraps BullMQ Queue with our interface
 */
export class BullMQQueue<T extends IJobData = IJobData> implements IJobQueue<T> {
    private readonly queue: Queue;
    private worker: Worker | null = null;

    constructor(
        public readonly name: string,
        private readonly redisConfig: RedisOptions,
        private readonly defaultOptions?: IJobOptions
    ) {
        this.queue = new Queue(name, {
            connection: redisConfig,
            defaultJobOptions: this.convertOptions(defaultOptions)
        });

        logger.info(`Queue created: ${name}`);
    }

    private convertOptions(options?: IJobOptions): object | undefined {
        if (!options) return undefined;

        return {
            delay: options.delay,
            attempts: options.attempts ?? 3,
            backoff: options.backoff,
            priority: options.priority,
            removeOnComplete: options.removeOnComplete ?? 100,
            removeOnFail: options.removeOnFail ?? 500,
            jobId: options.jobId
        };
    }

    private convertJob(job: Job): IJob<T> {
        return {
            id: job.id ?? '',
            name: job.name,
            data: job.data as T,
            status: this.mapJobState(job),
            progress: typeof job.progress === 'number' ? job.progress : 0,
            attemptsMade: job.attemptsMade,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn ? new Date(job.finishedOn) : undefined,
            processedOn: job.processedOn ? new Date(job.processedOn) : undefined
        };
    }

    private mapJobState(job: Job): JobStatus {
        if (job.returnvalue !== undefined) {
            return 'completed';
        }
        if (job.failedReason) {
            return 'failed';
        }
        return 'waiting';
    }

    async add(jobName: string, data: T, options?: IJobOptions): Promise<IJob<T>> {
        const job = await this.queue.add(jobName, data, this.convertOptions(options));
        logger.debug(`Job added: ${jobName}`, { jobId: job.id, queue: this.name });
        return this.convertJob(job);
    }

    async addBulk(jobs: Array<{ name: string; data: T; options?: IJobOptions }>): Promise<IJob<T>[]> {
        const bulkJobs = jobs.map(j => ({
            name: j.name,
            data: j.data,
            opts: this.convertOptions(j.options)
        }));

        const addedJobs = await this.queue.addBulk(bulkJobs);
        logger.debug(`Bulk jobs added: ${addedJobs.length}`, { queue: this.name });
        return addedJobs.map(j => this.convertJob(j));
    }

    async getJob(jobId: string): Promise<IJob<T> | null> {
        const job = await this.queue.getJob(jobId);
        return job ? this.convertJob(job) : null;
    }

    async getJobs(status: JobStatus | JobStatus[], start = 0, end = 100): Promise<IJob<T>[]> {
        const statuses = Array.isArray(status) ? status : [status];
        const jobs = await this.queue.getJobs(statuses, start, end);
        return jobs.map(j => this.convertJob(j));
    }

    async removeJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.remove();
            logger.debug(`Job removed: ${jobId}`, { queue: this.name });
        }
    }

    async pause(): Promise<void> {
        await this.queue.pause();
        logger.info(`Queue paused: ${this.name}`);
    }

    async resume(): Promise<void> {
        await this.queue.resume();
        logger.info(`Queue resumed: ${this.name}`);
    }

    async clean(grace: number, status: 'completed' | 'failed'): Promise<string[]> {
        const cleaned = await this.queue.clean(grace, 1000, status);
        logger.info(`Cleaned ${cleaned.length} ${status} jobs from ${this.name}`);
        return cleaned;
    }

    async close(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
        }
        await this.queue.close();
        logger.info(`Queue closed: ${this.name}`);
    }

    /**
     * Register a processor for this queue
     */
    registerProcessor<R = unknown>(processor: IJobProcessor<T, R>, concurrency = 1): void {
        if (this.worker) {
            logger.warn(`Processor already registered for queue: ${this.name}`);
            return;
        }

        this.worker = new Worker(
            this.name,
            async (job: Job) => {
                const convertedJob = this.convertJob(job);

                try {
                    const result = await processor.process(convertedJob);

                    if (processor.onCompleted && result.success) {
                        await processor.onCompleted(convertedJob, result);
                    }

                    if (!result.success) {
                        throw new Error(result.error ?? 'Job processing failed');
                    }

                    return result.data;
                } catch (error) {
                    if (processor.onFailed) {
                        await processor.onFailed(convertedJob, error as Error);
                    }
                    throw error;
                }
            },
            {
                connection: this.redisConfig,
                concurrency
            }
        );

        // Setup event handlers
        this.worker.on('completed', (job) => {
            logger.debug(`Job completed: ${job.id}`, { queue: this.name, name: job.name });
        });

        this.worker.on('failed', (job, error) => {
            logger.error(`Job failed: ${job?.id}`, {
                queue: this.name,
                name: job?.name,
                error: error.message
            });
        });

        this.worker.on('progress', (job, progress) => {
            if (processor.onProgress) {
                const convertedJob = this.convertJob(job);
                void processor.onProgress(convertedJob, progress as number);
            }
        });

        logger.info(`Processor registered for queue: ${this.name}`, { concurrency });
    }

    /**
     * Update job progress
     */
    async updateProgress(jobId: string, progress: number): Promise<void> {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.updateProgress(progress);
        }
    }

    /**
     * Get queue statistics
     */
    async getStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }> {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount()
        ]);

        return { waiting, active, completed, failed, delayed };
    }
}

// ==================== QUEUE MANAGER ====================

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
export class BullMQManager {
    private readonly queues: Map<string, BullMQQueue<IJobData>> = new Map();
    private readonly redisConfig: RedisOptions;
    private readonly defaultOptions?: IJobOptions;

    constructor(config?: IBullMQConfig) {
        this.redisConfig = config?.redis ?? getRedisConfig();
        this.defaultOptions = config?.defaultJobOptions;
        logger.info('BullMQ Manager initialized');
    }

    getQueue<T extends IJobData = IJobData>(name: string): BullMQQueue<T> {
        let queue = this.queues.get(name);

        if (!queue) {
            queue = new BullMQQueue<IJobData>(name, this.redisConfig, this.defaultOptions);
            this.queues.set(name, queue);
        }

        return queue as unknown as BullMQQueue<T>;
    }

    registerProcessor<T extends IJobData = IJobData, R = unknown>(
        queueName: string,
        processor: IJobProcessor<T, R>
    ): void {
        const queue = this.getQueue<T>(queueName);
        queue.registerProcessor(processor);
    }

    getQueueNames(): string[] {
        return Array.from(this.queues.keys());
    }

    async shutdown(): Promise<void> {
        logger.info('Shutting down all queues...');

        const closePromises = Array.from(this.queues.values()).map(q => q.close());
        await Promise.all(closePromises);

        this.queues.clear();
        logger.info('All queues closed');
    }

    /**
     * Get statistics for all queues
     */
    async getAllStats(): Promise<Record<string, IQueueStats>> {
        const stats: Record<string, IQueueStats> = {};

        for (const [name, queue] of this.queues) {
            stats[name] = await queue.getStats();
        }

        return stats;
    }
}
