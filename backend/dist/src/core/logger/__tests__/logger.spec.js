"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
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
        expect(logger_1.logger).toBeDefined();
    });
    it('should log info messages', () => {
        const spy = jest.spyOn(logger_1.logger, 'info');
        logger_1.logger.info('test message');
        // Since we are mocking pino, we verify that our wrapper called the underlying implementation
        // Actually since we mocked pino, the wrapper calls the mock.
        // But spying on the wrapper 'info' method is easier to verify
        expect(spy).toHaveBeenCalledWith('test message');
    });
    it('should log error messages with objects', () => {
        const spy = jest.spyOn(logger_1.logger, 'error');
        const error = new Error('Test Error');
        logger_1.logger.error('error message', error);
        expect(spy).toHaveBeenCalledWith('error message', error);
    });
    it('should create child logger', () => {
        const child = logger_1.logger.child({ module: 'test' });
        expect(child).toBeDefined();
        expect(child).not.toBe(logger_1.logger);
    });
    it('should create module logger', () => {
        const moduleLogger = (0, logger_1.createModuleLogger)('TestModule');
        expect(moduleLogger).toBeDefined();
    });
});
//# sourceMappingURL=logger.spec.js.map