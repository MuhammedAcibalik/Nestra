import { ExperimentService } from './experiment.service';
import { createMockDb } from '../../../../../test/mocks/db.mock';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Mock logger
jest.mock('../../../../core/logger', () => ({
    createModuleLogger: () => ({
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn()
    })
}));

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

describe('ExperimentService', () => {
    let service: ExperimentService;
    let dbMock: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        dbMock = createMockDb();
        service = new ExperimentService(
            dbMock as unknown as Database,
            { ttlMs: 1000, jitterMs: 100 }
        );
    });

    describe('Bucketing Consistency', () => {
        it('should return same variant for same unitKey (deterministic)', () => {
            const salt = 'test-salt';
            const experimentId = 'exp-123';
            const unitKey = 'user-456';
            const allocationBps = 5000; // 50%

            // Access private method via bracket notation for testing
            const bucketFn = (service as unknown as { bucket: (salt: string, expId: string, key: string, bps: number) => { bucket: number; variant: 'control' | 'variant' } }).bucket.bind(service);

            const result1 = bucketFn(salt, experimentId, unitKey, allocationBps);
            const result2 = bucketFn(salt, experimentId, unitKey, allocationBps);
            const result3 = bucketFn(salt, experimentId, unitKey, allocationBps);

            expect(result1.bucket).toBe(result2.bucket);
            expect(result2.bucket).toBe(result3.bucket);
            expect(result1.variant).toBe(result2.variant);
            expect(result2.variant).toBe(result3.variant);
        });

        it('should return different results for different unitKeys', () => {
            const salt = 'test-salt';
            const experimentId = 'exp-123';
            const allocationBps = 5000;

            const bucketFn = (service as unknown as { bucket: (salt: string, expId: string, key: string, bps: number) => { bucket: number; variant: 'control' | 'variant' } }).bucket.bind(service);

            const results = new Set<number>();
            for (let i = 0; i < 100; i++) {
                const result = bucketFn(salt, experimentId, `user-${i}`, allocationBps);
                results.add(result.bucket);
            }

            // With 100 different users, we should have many different buckets
            expect(results.size).toBeGreaterThan(50);
        });

        it('should respect allocation basis points', () => {
            const salt = 'distribution-test';
            const experimentId = 'exp-dist';
            const allocationBps = 2000; // 20%

            const bucketFn = (service as unknown as { bucket: (salt: string, expId: string, key: string, bps: number) => { bucket: number; variant: 'control' | 'variant' } }).bucket.bind(service);

            let variantCount = 0;
            const sampleSize = 1000;

            for (let i = 0; i < sampleSize; i++) {
                const result = bucketFn(salt, experimentId, `test-user-${i}`, allocationBps);
                if (result.variant === 'variant') {
                    variantCount++;
                }
            }

            // With 20% allocation, expect roughly 200 variants (±5%)
            const variantRatio = variantCount / sampleSize;
            expect(variantRatio).toBeGreaterThan(0.15);
            expect(variantRatio).toBeLessThan(0.25);
        });
    });

    describe('Cache Behavior', () => {
        it('should call DB only once for same cache key within TTL', async () => {
            // Mock DB to return no experiments
            dbMock.select.mockReturnThis();
            dbMock.from.mockReturnThis();
            dbMock.where.mockReturnThis();
            dbMock.limit.mockResolvedValue([]);

            // Make multiple calls
            await service.resolveExperiment('waste_predictor', 'user-1');
            await service.resolveExperiment('waste_predictor', 'user-2');
            await service.resolveExperiment('waste_predictor', 'user-3');

            // DB should only be called once (negative cache)
            expect(dbMock.limit).toHaveBeenCalledTimes(1);
        });
    });
});
