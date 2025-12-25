/**
 * Structured Logger
 * JSON logging with correlation ID support
 * Following Microservice Pattern: Observability, Structured Logging
 */

import { Request } from 'express';
import { getConfig } from '../config';

// ==================== LOG LEVELS ====================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
} as const;

// ==================== LOG ENTRY INTERFACE ====================

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

// ==================== LOGGER CLASS ====================

class Logger {
    private readonly service: string;
    private readonly minLevel: LogLevel;

    constructor(service: string = 'nestra-backend') {
        this.service = service;
        this.minLevel = this.getMinLevel();
    }

    private getMinLevel(): LogLevel {
        const config = getConfig();
        if (config.server.nodeEnv === 'production') return 'info';
        return 'debug';
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
    }

    private formatEntry(entry: ILogEntry): string {
        const config = getConfig();

        // Format based on environment
        if (config.server.nodeEnv === 'development') {
            // Human-readable format for development
            const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
            const reqId = entry.requestId ? ` [${entry.requestId.slice(0, 8)}]` : '';
            const duration = entry.duration === undefined ? '' : ` (${entry.duration}ms)`;
            return `${prefix}${reqId} ${entry.message}${duration}`;
        }

        // JSON format for production (log aggregation)
        return JSON.stringify(entry);
    }

    private log(
        level: LogLevel,
        message: string,
        context?: Partial<Omit<ILogEntry, 'timestamp' | 'level' | 'message' | 'service'>>
    ): void {
        if (!this.shouldLog(level)) return;

        const entry: ILogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: this.service,
            ...context
        };

        const formatted = this.formatEntry(entry);

        switch (level) {
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
        }
    }

    // ==================== PUBLIC METHODS ====================

    debug(message: string, metadata?: Record<string, unknown>): void {
        this.log('debug', message, { metadata });
    }

    info(message: string, metadata?: Record<string, unknown>): void {
        this.log('info', message, { metadata });
    }

    warn(message: string, metadata?: Record<string, unknown>): void {
        this.log('warn', message, { metadata });
    }

    error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
        this.log('error', message, {
            error: error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack
                  }
                : undefined,
            metadata
        });
    }

    /**
     * Log with request context (includes requestId)
     */
    request(level: LogLevel, message: string, req: Request, metadata?: Record<string, unknown>): void {
        this.log(level, message, {
            requestId: req.requestId,
            userId: (req as unknown as { userId?: string }).userId,
            metadata: {
                method: req.method,
                path: req.path,
                ...metadata
            }
        });
    }

    /**
     * Log request completion with duration
     */
    requestComplete(req: Request, statusCode: number, durationMs: number): void {
        let level: LogLevel = 'info';
        if (statusCode >= 500) {
            level = 'error';
        } else if (statusCode >= 400) {
            level = 'warn';
        }

        this.log(level, `${req.method} ${req.path} ${statusCode}`, {
            requestId: req.requestId,
            duration: durationMs,
            metadata: {
                method: req.method,
                path: req.path,
                statusCode
            }
        });
    }

    /**
     * Create child logger with namespace
     */
    child(namespace: string): Logger {
        return new Logger(`${this.service}:${namespace}`);
    }
}

// ==================== SINGLETON INSTANCE ====================

let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
    loggerInstance ??= new Logger();
    return loggerInstance;
}

export function createLogger(namespace: string): Logger {
    return getLogger().child(namespace);
}

export type { Logger, LogLevel, ILogEntry };
