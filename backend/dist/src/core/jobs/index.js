"use strict";
/**
 * Jobs Module - Barrel Export
 * Factory functions for job queue management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOptimizationJobProcessor = exports.OptimizationJobProcessor = exports.BullMQQueue = exports.BullMQManager = exports.shutdownInMemoryQueues = exports.getInMemoryQueue = exports.createInMemoryQueue = exports.InMemoryJobQueue = exports.JobType = void 0;
exports.initializeJobQueue = initializeJobQueue;
exports.getJobQueueManager = getJobQueueManager;
exports.getQueue = getQueue;
exports.addOptimizationJob = addOptimizationJob;
exports.setupOptimizationQueue = setupOptimizationQueue;
exports.shutdownJobQueue = shutdownJobQueue;
exports.getJobQueueStats = getJobQueueStats;
exports.isJobQueueEnabled = isJobQueueEnabled;
const job_queue_interface_1 = require("./job-queue.interface");
const bullmq_queue_1 = require("./bullmq.queue");
const optimization_job_1 = require("./optimization.job");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('JobsFactory');
// Re-exports
var job_queue_interface_2 = require("./job-queue.interface");
Object.defineProperty(exports, "JobType", { enumerable: true, get: function () { return job_queue_interface_2.JobType; } });
// In-memory queue (for development/testing)
var memory_queue_1 = require("./memory-queue");
Object.defineProperty(exports, "InMemoryJobQueue", { enumerable: true, get: function () { return memory_queue_1.InMemoryJobQueue; } });
Object.defineProperty(exports, "createInMemoryQueue", { enumerable: true, get: function () { return memory_queue_1.createQueue; } });
Object.defineProperty(exports, "getInMemoryQueue", { enumerable: true, get: function () { return memory_queue_1.getQueue; } });
Object.defineProperty(exports, "shutdownInMemoryQueues", { enumerable: true, get: function () { return memory_queue_1.shutdownAllQueues; } });
var bullmq_queue_2 = require("./bullmq.queue");
Object.defineProperty(exports, "BullMQManager", { enumerable: true, get: function () { return bullmq_queue_2.BullMQManager; } });
Object.defineProperty(exports, "BullMQQueue", { enumerable: true, get: function () { return bullmq_queue_2.BullMQQueue; } });
var optimization_job_2 = require("./optimization.job");
Object.defineProperty(exports, "OptimizationJobProcessor", { enumerable: true, get: function () { return optimization_job_2.OptimizationJobProcessor; } });
Object.defineProperty(exports, "createOptimizationJobProcessor", { enumerable: true, get: function () { return optimization_job_2.createOptimizationJobProcessor; } });
// ==================== SINGLETON ====================
let queueManager = null;
/**
 * Initialize job queue manager
 */
async function initializeJobQueue(config) {
    if (queueManager) {
        logger.warn('Job queue already initialized');
        return queueManager;
    }
    // Check if job queue is enabled
    const useJobQueue = process.env.USE_JOB_QUEUE === 'true';
    if (!useJobQueue) {
        logger.info('Job queue disabled (USE_JOB_QUEUE != true)');
    }
    queueManager = new bullmq_queue_1.BullMQManager(config);
    logger.info('Job queue manager initialized');
    return queueManager;
}
/**
 * Get job queue manager
 */
function getJobQueueManager() {
    return queueManager;
}
/**
 * Get a specific queue
 */
function getQueue(name) {
    if (!queueManager) {
        logger.warn('Job queue not initialized');
        return null;
    }
    return queueManager.getQueue(name);
}
/**
 * Add optimization job to queue
 */
async function addOptimizationJob(scenarioId, userId, options) {
    const queue = getQueue('optimization');
    if (!queue) {
        logger.warn('Optimization queue not available, job not added');
        return null;
    }
    const priorityMap = {
        high: 1,
        normal: 5,
        low: 10
    };
    const job = await queue.add(job_queue_interface_1.JobType.OPTIMIZATION_RUN, {
        scenarioId,
        userId,
        priority: options?.priority ?? 'normal'
    }, {
        priority: priorityMap[options?.priority ?? 'normal'],
        delay: options?.delay,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    });
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
function setupOptimizationQueue(runOptimization, onProgressCallback) {
    if (!queueManager) {
        logger.warn('Job queue not initialized, cannot setup optimization queue');
        return;
    }
    const queue = queueManager.getQueue('optimization');
    const processor = (0, optimization_job_1.createOptimizationJobProcessor)(runOptimization, onProgressCallback);
    processor.setQueue(queue);
    queue.registerProcessor(processor);
    logger.info('Optimization queue processor registered');
}
/**
 * Shutdown job queue
 */
async function shutdownJobQueue() {
    if (queueManager) {
        await queueManager.shutdown();
        queueManager = null;
        logger.info('Job queue shutdown complete');
    }
}
/**
 * Get job queue statistics
 */
async function getJobQueueStats() {
    if (!queueManager) {
        return null;
    }
    return queueManager.getAllStats();
}
/**
 * Check if job queue is enabled and initialized
 */
function isJobQueueEnabled() {
    return queueManager !== null && process.env.USE_JOB_QUEUE === 'true';
}
//# sourceMappingURL=index.js.map