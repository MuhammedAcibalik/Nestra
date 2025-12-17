/**
 * Structured Logger
 * JSON logging with correlation ID support
 * Following Microservice Pattern: Observability, Structured Logging
 */
import { Request } from 'express';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface ILogEntry {
    readonly timestamp: string;
    readonly level: LogLevel;
    readonly message: string;
    readonly service: string;
    readonly requestId?: string;
    readonly userId?: string;
    readonly duration?: number;
    readonly error?: {
        readonly name: string;
        readonly message: string;
        readonly stack?: string;
    };
    readonly metadata?: Record<string, unknown>;
}
declare class Logger {
    private readonly service;
    private readonly minLevel;
    constructor(service?: string);
    private getMinLevel;
    private shouldLog;
    private formatEntry;
    private log;
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warn(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
    /**
     * Log with request context (includes requestId)
     */
    request(level: LogLevel, message: string, req: Request, metadata?: Record<string, unknown>): void;
    /**
     * Log request completion with duration
     */
    requestComplete(req: Request, statusCode: number, durationMs: number): void;
    /**
     * Create child logger with namespace
     */
    child(namespace: string): Logger;
}
export declare function getLogger(): Logger;
export declare function createLogger(namespace: string): Logger;
export type { Logger, LogLevel, ILogEntry };
//# sourceMappingURL=structured-logger.d.ts.map