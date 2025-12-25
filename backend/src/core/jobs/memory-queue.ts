/**
 * In-Memory Job Queue Implementation
 * For development and testing, with production-ready interface
 * Following Strategy Pattern - can be swapped with Redis-based BullMQ
 */

import { IJobQueue, IJobData, IJobOptions, IJobInfo, IQueueStats, IJobProcessor, JobStatus } from './interfaces';
import { createModuleLogger } from '../logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const logger = createModuleLogger('JobQueue');
const tracer = trace.getTracer('jobs', '1.0.0');

// ==================== IN-MEMORY JOB ====================

interface IInternalJob<TData extends IJobData = IJobData> {
    id: string;
    name: string;
    data: TData;
    options: IJobOptions;
    status: JobStatus;
    progress: number;
    attemptsMade: number;
    createdAt: Date;
    processedOn?: Date;
    finishedOn?: Date;
    failedReason?: string;
    nextRetryAt?: Date;
}

// ==================== IN-MEMORY QUEUE ====================

export class InMemoryJobQueue<TData extends IJobData = IJobData> implements IJobQueue<TData> {
    public readonly name: string;

    private readonly jobs: Map<string, IInternalJob<TData>> = new Map();
    private readonly processors: Map<string, IJobProcessor<TData>> = new Map();
    private readonly delayedJobs: Map<string, NodeJS.Timeout> = new Map();
    private paused = false;
    private processing = false;
    private jobCounter = 0;

    constructor(name: string) {
        this.name = name;
        logger.info('Queue created', { queue: name });
    }

    /**
     * Register a processor for a job type
     */
    registerProcessor(jobName: string, processor: IJobProcessor<TData>): void {
        this.processors.set(jobName, processor);
        logger.debug('Processor registered', { queue: this.name, job: jobName });
    }

    /**
     * Add a job to the queue
     */
    async add(name: string, data: TData, options?: IJobOptions): Promise<string> {
        const jobId = options?.jobId ?? `${this.name}-${++this.jobCounter}-${Date.now()}`;

        const job: IInternalJob<TData> = {
            id: jobId,
            name,
            data,
            options: options ?? {},
            status: options?.delay ? 'delayed' : 'waiting',
            progress: 0,
            attemptsMade: 0,
            createdAt: new Date()
        };

        this.jobs.set(jobId, job);
        logger.debug('Job added', { queue: this.name, jobId, name });

        // Handle delayed jobs
        if (options?.delay && options.delay > 0) {
            const timeout = setTimeout(() => {
                const delayedJob = this.jobs.get(jobId);
                if (delayedJob?.status === 'delayed') {
                    delayedJob.status = 'waiting';
                    this.processQueue();
                }
                this.delayedJobs.delete(jobId);
            }, options.delay);
            this.delayedJobs.set(jobId, timeout);
        } else {
            // Process immediately if not delayed
            setImmediate(() => this.processQueue());
        }

        return jobId;
    }

    /**
     * Add multiple jobs
     */
    async addBulk(jobs: Array<{ name: string; data: TData; options?: IJobOptions }>): Promise<string[]> {
        const ids: string[] = [];
        for (const job of jobs) {
            const id = await this.add(job.name, job.data, job.options);
            ids.push(id);
        }
        return ids;
    }

    /**
     * Get job by ID
     */
    async getJob(jobId: string): Promise<IJobInfo | null> {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        return {
            id: job.id,
            name: job.name,
            data: job.data,
            status: job.status,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            failedReason: job.failedReason
        };
    }

    /**
     * Get queue statistics
     */
    async getStats(): Promise<IQueueStats> {
        const stats: IQueueStats = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0
        };

        for (const job of this.jobs.values()) {
            stats[job.status]++;
        }

        return stats;
    }

    /**
     * Pause the queue
     */
    async pause(): Promise<void> {
        this.paused = true;
        logger.info('Queue paused', { queue: this.name });
    }

    /**
     * Resume the queue
     */
    async resume(): Promise<void> {
        this.paused = false;
        logger.info('Queue resumed', { queue: this.name });
        this.processQueue();
    }

    /**
     * Clean old jobs
     */
    async clean(grace: number, limit: number, status: JobStatus): Promise<string[]> {
        const cleaned: string[] = [];
        const cutoff = Date.now() - grace;
        let count = 0;

        for (const [id, job] of this.jobs.entries()) {
            if (count >= limit) break;
            if (job.status === status && job.finishedOn && job.finishedOn.getTime() < cutoff) {
                this.jobs.delete(id);
                cleaned.push(id);
                count++;
            }
        }

        logger.debug('Jobs cleaned', { queue: this.name, count: cleaned.length, status });
        return cleaned;
    }

    /**
     * Process the next job in queue
     */
    private async processQueue(): Promise<void> {
        if (this.paused || this.processing) return;

        // Find next waiting job
        const waitingJob = Array.from(this.jobs.values()).find((j) => j.status === 'waiting');

        if (!waitingJob) return;

        const processor = this.processors.get(waitingJob.name);
        if (!processor) {
            logger.warn('No processor for job', { queue: this.name, job: waitingJob.name });
            return;
        }

        this.processing = true;
        waitingJob.status = 'active';
        waitingJob.processedOn = new Date();
        waitingJob.attemptsMade++;

        const span = tracer.startSpan(`job.${waitingJob.name}`, {
            attributes: {
                'job.queue': this.name,
                'job.id': waitingJob.id,
                'job.name': waitingJob.name,
                'job.attempt': waitingJob.attemptsMade
            }
        });

        try {
            const result = await processor.process(waitingJob.data, waitingJob.id);

            if (result.success) {
                waitingJob.status = 'completed';
                waitingJob.progress = 100;
                span.setStatus({ code: SpanStatusCode.OK });
                logger.debug('Job completed', { queue: this.name, jobId: waitingJob.id });
            } else {
                throw new Error(result.error ?? 'Job failed');
            }
        } catch (error) {
            const maxAttempts = waitingJob.options.attempts ?? 3;

            if (waitingJob.attemptsMade < maxAttempts) {
                // Retry with backoff
                const backoffDelay = this.calculateBackoff(waitingJob);
                waitingJob.status = 'delayed';
                waitingJob.nextRetryAt = new Date(Date.now() + backoffDelay);

                setTimeout(() => {
                    const job = this.jobs.get(waitingJob.id);
                    if (job?.status === 'delayed') {
                        job.status = 'waiting';
                        this.processQueue();
                    }
                }, backoffDelay);

                logger.debug('Job scheduled for retry', {
                    queue: this.name,
                    jobId: waitingJob.id,
                    attempt: waitingJob.attemptsMade,
                    nextRetry: backoffDelay
                });
            } else {
                waitingJob.status = 'failed';
                waitingJob.failedReason = error instanceof Error ? error.message : String(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: waitingJob.failedReason });
                logger.error('Job failed', { queue: this.name, jobId: waitingJob.id, error: waitingJob.failedReason });
            }
        } finally {
            waitingJob.finishedOn = new Date();
            span.end();
            this.processing = false;

            // Process next job
            setImmediate(() => this.processQueue());
        }
    }

    /**
     * Calculate backoff delay
     */
    private calculateBackoff(job: IInternalJob<TData>): number {
        const backoff = job.options.backoff ?? { type: 'exponential', delay: 1000 };

        if (backoff.type === 'fixed') {
            return backoff.delay;
        }

        // Exponential backoff: delay * 2^(attempt-1)
        return backoff.delay * Math.pow(2, job.attemptsMade - 1);
    }

    /**
     * Shutdown the queue
     */
    async shutdown(): Promise<void> {
        this.paused = true;

        // Clear all delayed job timeouts
        for (const timeout of this.delayedJobs.values()) {
            clearTimeout(timeout);
        }
        this.delayedJobs.clear();

        logger.info('Queue shutdown', { queue: this.name });
    }
}

// ==================== QUEUE MANAGER ====================

const queues: Map<string, InMemoryJobQueue> = new Map();

export function createQueue<TData extends IJobData = IJobData>(name: string): InMemoryJobQueue<TData> {
    if (queues.has(name)) {
        return queues.get(name) as InMemoryJobQueue<TData>;
    }

    const queue = new InMemoryJobQueue<TData>(name);
    queues.set(name, queue);
    return queue;
}

export function getQueue<TData extends IJobData = IJobData>(name: string): InMemoryJobQueue<TData> | undefined {
    return queues.get(name) as InMemoryJobQueue<TData> | undefined;
}

export async function shutdownAllQueues(): Promise<void> {
    for (const queue of queues.values()) {
        await queue.shutdown();
    }
    queues.clear();
    logger.info('All queues shutdown');
}
