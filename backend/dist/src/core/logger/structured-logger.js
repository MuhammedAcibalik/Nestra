"use strict";
/**
 * Structured Logger
 * JSON logging with correlation ID support
 * Following Microservice Pattern: Observability, Structured Logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = getLogger;
exports.createLogger = createLogger;
const config_1 = require("../config");
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
// ==================== LOGGER CLASS ====================
class Logger {
    service;
    minLevel;
    constructor(service = 'nestra-backend') {
        this.service = service;
        this.minLevel = this.getMinLevel();
    }
    getMinLevel() {
        const config = (0, config_1.getConfig)();
        if (config.server.nodeEnv === 'production')
            return 'info';
        return 'debug';
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
    }
    formatEntry(entry) {
        const config = (0, config_1.getConfig)();
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
    log(level, message, context) {
        if (!this.shouldLog(level))
            return;
        const entry = {
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
    debug(message, metadata) {
        this.log('debug', message, { metadata });
    }
    info(message, metadata) {
        this.log('info', message, { metadata });
    }
    warn(message, metadata) {
        this.log('warn', message, { metadata });
    }
    error(message, error, metadata) {
        this.log('error', message, {
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined,
            metadata
        });
    }
    /**
     * Log with request context (includes requestId)
     */
    request(level, message, req, metadata) {
        this.log(level, message, {
            requestId: req.requestId,
            userId: req.userId,
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
    requestComplete(req, statusCode, durationMs) {
        let level = 'info';
        if (statusCode >= 500) {
            level = 'error';
        }
        else if (statusCode >= 400) {
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
    child(namespace) {
        return new Logger(`${this.service}:${namespace}`);
    }
}
// ==================== SINGLETON INSTANCE ====================
let loggerInstance = null;
function getLogger() {
    loggerInstance ??= new Logger();
    return loggerInstance;
}
function createLogger(namespace) {
    return getLogger().child(namespace);
}
//# sourceMappingURL=structured-logger.js.map