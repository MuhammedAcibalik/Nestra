"use strict";
/**
 * BullMQ Queue Implementation
 * Redis-based job queue with retry, delay, and priority support
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullMQManager = exports.BullMQQueue = void 0;
exports.getRedisConfig = getRedisConfig;
const bullmq_1 = require("bullmq");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('BullMQ');
/**
 * Get Redis config from environment
 */
function getRedisConfig() {
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
        }
        catch {
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
class BullMQQueue {
    name;
    redisConfig;
    defaultOptions;
    queue;
    worker = null;
    constructor(name, redisConfig, defaultOptions) {
        this.name = name;
        this.redisConfig = redisConfig;
        this.defaultOptions = defaultOptions;
        this.queue = new bullmq_1.Queue(name, {
            connection: redisConfig,
            defaultJobOptions: this.convertOptions(defaultOptions)
        });
        logger.info(`Queue created: ${name}`);
    }
    convertOptions(options) {
        if (!options)
            return undefined;
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
    convertJob(job) {
        return {
            id: job.id ?? '',
            name: job.name,
            data: job.data,
            status: this.mapJobState(job),
            progress: typeof job.progress === 'number' ? job.progress : 0,
            attemptsMade: job.attemptsMade,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn ? new Date(job.finishedOn) : undefined,
            processedOn: job.processedOn ? new Date(job.processedOn) : undefined
        };
    }
    mapJobState(job) {
        if (job.returnvalue !== undefined) {
            return 'completed';
        }
        if (job.failedReason) {
            return 'failed';
        }
        return 'waiting';
    }
    async add(jobName, data, options) {
        const job = await this.queue.add(jobName, data, this.convertOptions(options));
        logger.debug(`Job added: ${jobName}`, { jobId: job.id, queue: this.name });
        return this.convertJob(job);
    }
    async addBulk(jobs) {
        const bulkJobs = jobs.map((j) => ({
            name: j.name,
            data: j.data,
            opts: this.convertOptions(j.options)
        }));
        const addedJobs = await this.queue.addBulk(bulkJobs);
        logger.debug(`Bulk jobs added: ${addedJobs.length}`, { queue: this.name });
        return addedJobs.map((j) => this.convertJob(j));
    }
    async getJob(jobId) {
        const job = await this.queue.getJob(jobId);
        return job ? this.convertJob(job) : null;
    }
    async getJobs(status, start = 0, end = 100) {
        const statuses = Array.isArray(status) ? status : [status];
        const jobs = await this.queue.getJobs(statuses, start, end);
        return jobs.map((j) => this.convertJob(j));
    }
    async removeJob(jobId) {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.remove();
            logger.debug(`Job removed: ${jobId}`, { queue: this.name });
        }
    }
    async pause() {
        await this.queue.pause();
        logger.info(`Queue paused: ${this.name}`);
    }
    async resume() {
        await this.queue.resume();
        logger.info(`Queue resumed: ${this.name}`);
    }
    async clean(grace, status) {
        const cleaned = await this.queue.clean(grace, 1000, status);
        logger.info(`Cleaned ${cleaned.length} ${status} jobs from ${this.name}`);
        return cleaned;
    }
    async close() {
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
    registerProcessor(processor, concurrency = 1) {
        if (this.worker) {
            logger.warn(`Processor already registered for queue: ${this.name}`);
            return;
        }
        this.worker = new bullmq_1.Worker(this.name, async (job) => {
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
            }
            catch (error) {
                if (processor.onFailed) {
                    await processor.onFailed(convertedJob, error);
                }
                throw error;
            }
        }, {
            connection: this.redisConfig,
            concurrency
        });
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
                void processor.onProgress(convertedJob, progress);
            }
        });
        logger.info(`Processor registered for queue: ${this.name}`, { concurrency });
    }
    /**
     * Update job progress
     */
    async updateProgress(jobId, progress) {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.updateProgress(progress);
        }
    }
    /**
     * Get queue statistics
     */
    async getStats() {
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
exports.BullMQQueue = BullMQQueue;
/**
 * BullMQ Queue Manager
 * Manages multiple queues and their processors
 */
class BullMQManager {
    queues = new Map();
    redisConfig;
    defaultOptions;
    constructor(config) {
        this.redisConfig = config?.redis ?? getRedisConfig();
        this.defaultOptions = config?.defaultJobOptions;
        logger.info('BullMQ Manager initialized');
    }
    getQueue(name) {
        let queue = this.queues.get(name);
        if (!queue) {
            queue = new BullMQQueue(name, this.redisConfig, this.defaultOptions);
            this.queues.set(name, queue);
        }
        return queue;
    }
    registerProcessor(queueName, processor) {
        const queue = this.getQueue(queueName);
        queue.registerProcessor(processor);
    }
    getQueueNames() {
        return Array.from(this.queues.keys());
    }
    async shutdown() {
        logger.info('Shutting down all queues...');
        const closePromises = Array.from(this.queues.values()).map((q) => q.close());
        await Promise.all(closePromises);
        this.queues.clear();
        logger.info('All queues closed');
    }
    /**
     * Get statistics for all queues
     */
    async getAllStats() {
        const stats = {};
        for (const [name, queue] of this.queues) {
            stats[name] = await queue.getStats();
        }
        return stats;
    }
}
exports.BullMQManager = BullMQManager;
//# sourceMappingURL=bullmq.queue.js.map