/**
 * Circuit Breaker Manager Tests
 * Tests circuit breaker creation and management
 */

import { CircuitBreakerManager, createCircuitBreaker, getCircuitBreakerStats } from '../circuit-breaker';

// Mock logger
jest.mock('../../logger', () => ({
    createModuleLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
}));

describe('CircuitBreakerManager', () => {
    afterEach(async () => {
        await CircuitBreakerManager.shutdownAll();
    });

    describe('create', () => {
        it('should create a circuit breaker', async () => {
            const action = jest.fn().mockResolvedValue('success');

            const breaker = CircuitBreakerManager.create(action, {
                name: 'test-breaker',
                timeout: 1000,
                resetTimeout: 100
            });

            const result = await breaker.fire();
            expect(result).toBe('success');
            expect(action).toHaveBeenCalled();
        });

        it('should create breaker with fallback', async () => {
            const action = jest.fn().mockRejectedValue(new Error('fail'));
            const fallback = jest.fn().mockReturnValue('fallback-value');

            const breaker = CircuitBreakerManager.create(action, {
                name: 'fallback-breaker',
                timeout: 100
            }, fallback);

            const result = await breaker.fire();
            expect(result).toBe('fallback-value');
        });
    });

    describe('get', () => {
        it('should return undefined for non-existent breaker', () => {
            const breaker = CircuitBreakerManager.get('non-existent');
            expect(breaker).toBeUndefined();
        });

        it('should return existing breaker', () => {
            const action = jest.fn().mockResolvedValue('ok');
            CircuitBreakerManager.create(action, { name: 'existing-breaker' });

            const breaker = CircuitBreakerManager.get('existing-breaker');
            expect(breaker).toBeDefined();
        });
    });

    describe('getAllStats', () => {
        it('should return stats for all breakers', async () => {
            CircuitBreakerManager.create(
                jest.fn().mockResolvedValue('ok'),
                { name: 'stats-breaker-1' }
            );
            CircuitBreakerManager.create(
                jest.fn().mockResolvedValue('ok'),
                { name: 'stats-breaker-2' }
            );

            const stats = CircuitBreakerManager.getAllStats();

            expect(stats.length).toBeGreaterThanOrEqual(2);
            expect(stats.some(s => s.name === 'stats-breaker-1')).toBe(true);
            expect(stats.some(s => s.name === 'stats-breaker-2')).toBe(true);
        });
    });

    describe('shutdownAll', () => {
        it('should shutdown all breakers', async () => {
            CircuitBreakerManager.create(
                jest.fn().mockResolvedValue('ok'),
                { name: 'shutdown-breaker' }
            );

            await CircuitBreakerManager.shutdownAll();

            const breaker = CircuitBreakerManager.get('shutdown-breaker');
            expect(breaker).toBeUndefined();
        });
    });
});

describe('Helper Functions', () => {
    afterEach(async () => {
        await CircuitBreakerManager.shutdownAll();
    });

    describe('createCircuitBreaker', () => {
        it('should create circuit breaker via helper', async () => {
            const action = jest.fn().mockResolvedValue('result');

            const breaker = createCircuitBreaker(action, { name: 'helper-breaker' });
            const result = await breaker.fire();

            expect(result).toBe('result');
        });
    });

    describe('getCircuitBreakerStats', () => {
        it('should return stats via helper', () => {
            const stats = getCircuitBreakerStats();
            expect(Array.isArray(stats)).toBe(true);
        });
    });
});
