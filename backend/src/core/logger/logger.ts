/**
 * Logger Module
 * Centralized logging using Pino for high-performance structured logging
 */

import pino from 'pino';

/**
 * Logger configuration
 */
const loggerConfig: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname'
            }
        }
        : undefined,
    base: {
        service: 'nestra-backend',
        version: process.env.npm_package_version ?? '1.0.0'
    },
    formatters: {
        level: (label) => ({ level: label })
    }
};

/**
 * Create the base logger
 */
const baseLogger = pino(loggerConfig);

/**
 * Logger interface for type-safety
 */
export interface ILogger {
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, error?: unknown, data?: Record<string, unknown>): void;
    child(bindings: Record<string, unknown>): ILogger;
}

/**
 * Logger wrapper for consistent API
 */
class Logger implements ILogger {
    private readonly logger: pino.Logger;

    constructor(logger: pino.Logger) {
        this.logger = logger;
    }

    debug(msg: string, data?: Record<string, unknown>): void {
        if (data) {
            this.logger.debug(data, msg);
        } else {
            this.logger.debug(msg);
        }
    }

    info(msg: string, data?: Record<string, unknown>): void {
        if (data) {
            this.logger.info(data, msg);
        } else {
            this.logger.info(msg);
        }
    }

    warn(msg: string, data?: Record<string, unknown>): void {
        if (data) {
            this.logger.warn(data, msg);
        } else {
            this.logger.warn(msg);
        }
    }

    error(msg: string, error?: unknown, data?: Record<string, unknown>): void {
        const logData: Record<string, unknown> = { ...data };

        if (error instanceof Error) {
            logData.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        } else if (error !== undefined) {
            logData.error = error;
        }

        if (Object.keys(logData).length > 0) {
            this.logger.error(logData, msg);
        } else {
            this.logger.error(msg);
        }
    }

    child(bindings: Record<string, unknown>): ILogger {
        return new Logger(this.logger.child(bindings));
    }
}

/**
 * Default application logger
 */
export const logger = new Logger(baseLogger);

/**
 * Create a child logger for a specific module
 */
export function createModuleLogger(moduleName: string): ILogger {
    return logger.child({ module: moduleName });
}

/**
 * Create a child logger for a specific request
 */
export function createRequestLogger(requestId: string, userId?: string): ILogger {
    return logger.child({
        requestId,
        ...(userId && { userId })
    });
}

/**
 * Log levels for configuration
 */
export const LogLevels = {
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal'
} as const;

export type LogLevel = typeof LogLevels[keyof typeof LogLevels];
