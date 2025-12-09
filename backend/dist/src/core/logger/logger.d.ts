/**
 * Logger Module
 * Centralized logging using Pino for high-performance structured logging
 */
import pino from 'pino';
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
declare class Logger implements ILogger {
    private readonly logger;
    constructor(logger: pino.Logger);
    debug(msg: string, data?: Record<string, unknown>): void;
    info(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, error?: unknown, data?: Record<string, unknown>): void;
    child(bindings: Record<string, unknown>): ILogger;
}
/**
 * Default application logger
 */
export declare const logger: Logger;
/**
 * Create a child logger for a specific module
 */
export declare function createModuleLogger(moduleName: string): ILogger;
/**
 * Create a child logger for a specific request
 */
export declare function createRequestLogger(requestId: string, userId?: string): ILogger;
/**
 * Log levels for configuration
 */
export declare const LogLevels: {
    readonly TRACE: "trace";
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARN: "warn";
    readonly ERROR: "error";
    readonly FATAL: "fatal";
};
export type LogLevel = typeof LogLevels[keyof typeof LogLevels];
export {};
//# sourceMappingURL=logger.d.ts.map