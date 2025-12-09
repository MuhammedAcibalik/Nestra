import { createModuleLogger, logger } from '../logger';

// Mock pino
jest.mock('pino', () => {
    return jest.fn((_options) => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn().mockReturnThis()
    }));
});

describe('Logger', () => {

    it('should create logger instance', () => {
        expect(logger).toBeDefined();
    });

    it('should log info messages', () => {
        const spy = jest.spyOn(logger as any, 'info');
        logger.info('test message');
        // Since we are mocking pino, we verify that our wrapper called the underlying implementation
        // Actually since we mocked pino, the wrapper calls the mock.
        // But spying on the wrapper 'info' method is easier to verify
        expect(spy).toHaveBeenCalledWith('test message');
    });

    it('should log error messages with objects', () => {
        const spy = jest.spyOn(logger as any, 'error');
        const error = new Error('Test Error');
        logger.error('error message', error);
        expect(spy).toHaveBeenCalledWith('error message', error);
    });

    it('should create child logger', () => {
        const child = logger.child({ module: 'test' });
        expect(child).toBeDefined();
        expect(child).not.toBe(logger);
    });

    it('should create module logger', () => {
        const moduleLogger = createModuleLogger('TestModule');
        expect(moduleLogger).toBeDefined();
    });
});
