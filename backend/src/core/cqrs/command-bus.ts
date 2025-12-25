/**
 * Command Bus Implementation
 * Routes commands to their registered handlers
 * Following Single Responsibility Principle
 */

import { ICommand, ICommandHandler, ICommandBus } from './interfaces';
import { createModuleLogger } from '../logger';
import { trace, SpanStatusCode, context as otelContext } from '@opentelemetry/api';
import { ATTR_ERROR_TYPE } from '@opentelemetry/semantic-conventions';

const logger = createModuleLogger('CommandBus');
const tracer = trace.getTracer('cqrs', '1.0.0');

// ==================== COMMAND BUS ====================

export class CommandBus implements ICommandBus {
    private readonly handlers: Map<string, ICommandHandler<ICommand<unknown>, unknown>> = new Map();
    private readonly enableTracing: boolean;

    constructor(options?: { enableTracing?: boolean }) {
        this.enableTracing = options?.enableTracing ?? true;
    }

    /**
     * Register a handler for a command type
     */
    register<TCommand extends ICommand<TResult>, TResult>(
        commandType: new (...args: unknown[]) => TCommand,
        handler: ICommandHandler<TCommand, TResult>
    ): void {
        const commandName = commandType.name;

        if (this.handlers.has(commandName)) {
            logger.warn('Overwriting existing handler', { command: commandName });
        }

        this.handlers.set(commandName, handler as ICommandHandler<ICommand<unknown>, unknown>);
        logger.debug('Handler registered', { command: commandName });
    }

    /**
     * Execute a command
     */
    async execute<TResult>(command: ICommand<TResult>): Promise<TResult> {
        const commandName = command.constructor.name;
        const handler = this.handlers.get(commandName);

        if (!handler) {
            throw new Error(`No handler registered for command: ${commandName}`);
        }

        if (!this.enableTracing) {
            return handler.execute(command) as Promise<TResult>;
        }

        // Trace the command execution
        const span = tracer.startSpan(`command.${commandName}`, {
            attributes: {
                'cqrs.type': 'command',
                'cqrs.command': commandName
            }
        });

        return otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await handler.execute(command);

                span.setAttribute('cqrs.duration_ms', Date.now() - startTime);
                span.setStatus({ code: SpanStatusCode.OK });

                logger.debug('Command executed', { command: commandName, duration: Date.now() - startTime });
                return result as TResult;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Command failed', { command: commandName, error });
                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Check if a handler is registered for a command type
     */
    hasHandler(commandType: new (...args: unknown[]) => ICommand<unknown>): boolean {
        return this.handlers.has(commandType.name);
    }

    /**
     * Get all registered command names
     */
    getRegisteredCommands(): string[] {
        return Array.from(this.handlers.keys());
    }
}

// ==================== SINGLETON ====================

let commandBusInstance: CommandBus | null = null;

export function getCommandBus(): CommandBus {
    commandBusInstance ??= new CommandBus();
    return commandBusInstance;
}

export function initializeCommandBus(options?: { enableTracing?: boolean }): CommandBus {
    commandBusInstance = new CommandBus(options);
    return commandBusInstance;
}
