/**
 * In-Memory Job Queue Tests
 * Tests job adding, processing, and queue management
 */

import { InMemoryJobQueue, createQueue, getQueue, shutdownAllQueues } from '../memory-queue';
import { IJobResult } from '../interfaces';

// Mock logger
jest.mock('../../logger', () => ({
    createModuleLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
}));

describe('InMemoryJobQueue', () => {
    let queue: InMemoryJobQueue<{ value: string }>;

    beforeEach(() => {
        queue = new InMemoryJobQueue('test-queue');
    });

    afterEach(async () => {
        await queue.shutdown();
    });

    describe('add', () => {
        it('should add a job and return job ID', async () => {
            const jobId = await queue.add('test-job', { value: 'hello' });

            expect(jobId).toBeDefined();
            expect(typeof jobId).toBe('string');
        });

        it('should add job with custom options', async () => {
            const jobId = await queue.add('priority-job', { value: 'urgent' }, {
                priority: 10,
                delay: 1000
            });

            const job = await queue.getJob(jobId);
            expect(job).toBeDefined();
            expect(job?.name).toBe('priority-job');
        });
    });

    describe('addBulk', () => {
        it('should add multiple jobs at once', async () => {
            const jobIds = await queue.addBulk([
                { name: 'job-1', data: { value: 'first' } },
                { name: 'job-2', data: { value: 'second' } },
                { name: 'job-3', data: { value: 'third' } }
            ]);

            expect(jobIds).toHaveLength(3);
        });
    });

    describe('getJob', () => {
        it('should return job info by ID', async () => {
            const jobId = await queue.add('fetch-job', { value: 'data' });

            const job = await queue.getJob(jobId);

            expect(job).toBeDefined();
            expect(job?.id).toBe(jobId);
            expect(job?.name).toBe('fetch-job');
            expect(job?.status).toBe('waiting');
        });

        it('should return null for non-existent job', async () => {
            const job = await queue.getJob('non-existent-id');

            expect(job).toBeNull();
        });
    });

    describe('getStats', () => {
        it('should return queue statistics', async () => {
            await queue.add('stat-job', { value: 'test' });

            const stats = await queue.getStats();

            expect(stats).toHaveProperty('waiting');
            expect(stats).toHaveProperty('active');
            expect(stats).toHaveProperty('completed');
            expect(stats).toHaveProperty('failed');
            expect(stats.waiting).toBeGreaterThanOrEqual(1);
        });
    });

    describe('pause and resume', () => {
        it('should pause and resume the queue', async () => {
            await queue.pause();
            let stats = await queue.getStats();
            expect(stats.paused).toBeGreaterThanOrEqual(0);

            await queue.resume();
            stats = await queue.getStats();
            expect(stats.paused).toBe(0);
        });
    });

    describe('registerProcessor', () => {
        it('should process jobs with registered processor', async () => {
            const processed: string[] = [];

            queue.registerProcessor('process-job', {
                process: async (data): Promise<IJobResult> => {
                    processed.push(data.value);
                    return { success: true };
                }
            });

            await queue.add('process-job', { value: 'item-1' });

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(processed).toContain('item-1');
        });
    });

    describe('clean', () => {
        it('should clean completed jobs older than grace period', async () => {
            queue.registerProcessor('clean-job', {
                process: async (): Promise<IJobResult> => ({ success: true })
            });
            await queue.add('clean-job', { value: 'to-clean' });

            await new Promise(resolve => setTimeout(resolve, 100));

            const cleaned = await queue.clean(0, 100, 'completed');

            expect(Array.isArray(cleaned)).toBe(true);
        });
    });
});

describe('Queue Manager', () => {
    afterEach(async () => {
        await shutdownAllQueues();
    });

    describe('createQueue', () => {
        it('should create a new queue', () => {
            const queue = createQueue('new-queue');

            expect(queue).toBeInstanceOf(InMemoryJobQueue);
            expect(queue.name).toBe('new-queue');
        });

        it('should return existing queue if already created', () => {
            const queue1 = createQueue('duplicate-queue');
            const queue2 = createQueue('duplicate-queue');

            expect(queue1).toBe(queue2);
        });
    });

    describe('getQueue', () => {
        it('should return undefined for non-existent queue', () => {
            const queue = getQueue('non-existent');

            expect(queue).toBeUndefined();
        });

        it('should return existing queue', () => {
            createQueue('existing-queue');

            const queue = getQueue('existing-queue');

            expect(queue).toBeDefined();
        });
    });

    describe('shutdownAllQueues', () => {
        it('should shutdown all queues', async () => {
            createQueue('queue-1');
            createQueue('queue-2');

            await shutdownAllQueues();

            expect(getQueue('queue-1')).toBeUndefined();
            expect(getQueue('queue-2')).toBeUndefined();
        });
    });
});
