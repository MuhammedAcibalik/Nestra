/**
 * Command Bus Implementation
 * Routes commands to their registered handlers
 * Following Single Responsibility Principle
 */
import { ICommand, ICommandHandler, ICommandBus } from './interfaces';
export declare class CommandBus implements ICommandBus {
    private readonly handlers;
    private readonly enableTracing;
    constructor(options?: {
        enableTracing?: boolean;
    });
    /**
     * Register a handler for a command type
     */
    register<TCommand extends ICommand<TResult>, TResult>(commandType: new (...args: unknown[]) => TCommand, handler: ICommandHandler<TCommand, TResult>): void;
    /**
     * Execute a command
     */
    execute<TResult>(command: ICommand<TResult>): Promise<TResult>;
    /**
     * Check if a handler is registered for a command type
     */
    hasHandler(commandType: new (...args: unknown[]) => ICommand<unknown>): boolean;
    /**
     * Get all registered command names
     */
    getRegisteredCommands(): string[];
}
export declare function getCommandBus(): CommandBus;
export declare function initializeCommandBus(options?: {
    enableTracing?: boolean;
}): CommandBus;
//# sourceMappingURL=command-bus.d.ts.map