/**
 * Query Bus Tests
 * Tests query execution and management
 * Note: Testing via internal method calls due to complex generic constraints on register()
 */

import { QueryBus, getQueryBus, initializeQueryBus } from '../query-bus';

// Mock logger
jest.mock('../../logger', () => ({
    createModuleLogger: () => ({
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    })
}));

describe('QueryBus', () => {
    let queryBus: QueryBus;

    beforeEach(() => {
        queryBus = new QueryBus({ enableTracing: false });
    });

    describe('constructor', () => {
        it('should create with default tracing enabled', () => {
            const bus = new QueryBus();
            expect(bus).toBeInstanceOf(QueryBus);
        });

        it('should create with tracing disabled', () => {
            const bus = new QueryBus({ enableTracing: false });
            expect(bus).toBeInstanceOf(QueryBus);
        });
    });

    describe('getRegisteredQueries', () => {
        it('should return empty array initially', () => {
            expect(queryBus.getRegisteredQueries()).toEqual([]);
        });
    });

    describe('execute', () => {
        it('should throw if no handler is registered', async () => {
            // Create a simple object with constructor name
            const query = { constructor: { name: 'UnknownQuery' } };

            await expect(queryBus.execute(query)).rejects.toThrow(
                'No handler registered for query: UnknownQuery'
            );
        });
    });
});

describe('Singleton Functions', () => {
    describe('initializeQueryBus', () => {
        it('should create and return a query bus', () => {
            const bus = initializeQueryBus({ enableTracing: false });
            expect(bus).toBeInstanceOf(QueryBus);
        });
    });

    describe('getQueryBus', () => {
        it('should return the same instance', () => {
            initializeQueryBus();
            const bus1 = getQueryBus();
            const bus2 = getQueryBus();
            expect(bus1).toBe(bus2);
        });
    });
});
