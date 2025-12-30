/**
 * Command Bus Tests
 * Tests command execution and management
 * Note: Testing via internal method calls due to complex generic constraints on register()
 */

import { CommandBus, getCommandBus, initializeCommandBus } from '../command-bus';

// Mock logger
jest.mock('../../logger', () => ({
    createModuleLogger: () => ({
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    })
}));

describe('CommandBus', () => {
    let commandBus: CommandBus;

    beforeEach(() => {
        commandBus = new CommandBus({ enableTracing: false });
    });

    describe('constructor', () => {
        it('should create with default tracing enabled', () => {
            const bus = new CommandBus();
            expect(bus).toBeInstanceOf(CommandBus);
        });

        it('should create with tracing disabled', () => {
            const bus = new CommandBus({ enableTracing: false });
            expect(bus).toBeInstanceOf(CommandBus);
        });
    });

    describe('getRegisteredCommands', () => {
        it('should return empty array initially', () => {
            expect(commandBus.getRegisteredCommands()).toEqual([]);
        });
    });

    describe('execute', () => {
        it('should throw if no handler is registered', async () => {
            // Create a simple object with constructor name
            const command = { constructor: { name: 'UnknownCommand' } };

            await expect(commandBus.execute(command)).rejects.toThrow(
                'No handler registered for command: UnknownCommand'
            );
        });
    });
});

describe('Singleton Functions', () => {
    describe('initializeCommandBus', () => {
        it('should create and return a command bus', () => {
            const bus = initializeCommandBus({ enableTracing: false });
            expect(bus).toBeInstanceOf(CommandBus);
        });
    });

    describe('getCommandBus', () => {
        it('should return the same instance', () => {
            initializeCommandBus();
            const bus1 = getCommandBus();
            const bus2 = getCommandBus();
            expect(bus1).toBe(bus2);
        });
    });
});
