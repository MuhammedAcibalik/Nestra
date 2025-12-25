"use strict";
/**
 * Command Bus Implementation
 * Routes commands to their registered handlers
 * Following Single Responsibility Principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBus = void 0;
exports.getCommandBus = getCommandBus;
exports.initializeCommandBus = initializeCommandBus;
const logger_1 = require("../logger");
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const logger = (0, logger_1.createModuleLogger)('CommandBus');
const tracer = api_1.trace.getTracer('cqrs', '1.0.0');
// ==================== COMMAND BUS ====================
class CommandBus {
    handlers = new Map();
    enableTracing;
    constructor(options) {
        this.enableTracing = options?.enableTracing ?? true;
    }
    /**
     * Register a handler for a command type
     */
    register(commandType, handler) {
        const commandName = commandType.name;
        if (this.handlers.has(commandName)) {
            logger.warn('Overwriting existing handler', { command: commandName });
        }
        this.handlers.set(commandName, handler);
        logger.debug('Handler registered', { command: commandName });
    }
    /**
     * Execute a command
     */
    async execute(command) {
        const commandName = command.constructor.name;
        const handler = this.handlers.get(commandName);
        if (!handler) {
            throw new Error(`No handler registered for command: ${commandName}`);
        }
        if (!this.enableTracing) {
            return handler.execute(command);
        }
        // Trace the command execution
        const span = tracer.startSpan(`command.${commandName}`, {
            attributes: {
                'cqrs.type': 'command',
                'cqrs.command': commandName
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await handler.execute(command);
                span.setAttribute('cqrs.duration_ms', Date.now() - startTime);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                logger.debug('Command executed', { command: commandName, duration: Date.now() - startTime });
                return result;
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(semantic_conventions_1.ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Command failed', { command: commandName, error });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Check if a handler is registered for a command type
     */
    hasHandler(commandType) {
        return this.handlers.has(commandType.name);
    }
    /**
     * Get all registered command names
     */
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
}
exports.CommandBus = CommandBus;
// ==================== SINGLETON ====================
let commandBusInstance = null;
function getCommandBus() {
    commandBusInstance ??= new CommandBus();
    return commandBusInstance;
}
function initializeCommandBus(options) {
    commandBusInstance = new CommandBus(options);
    return commandBusInstance;
}
//# sourceMappingURL=command-bus.js.map