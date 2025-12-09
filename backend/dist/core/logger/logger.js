"use strict";
/**
 * Logger Module
 * Centralized logging using Pino for high-performance structured logging
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevels = exports.logger = void 0;
exports.createModuleLogger = createModuleLogger;
exports.createRequestLogger = createRequestLogger;
const pino_1 = __importDefault(require("pino"));
/**
 * Logger configuration
 */
const loggerConfig = {
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
const baseLogger = (0, pino_1.default)(loggerConfig);
/**
 * Logger wrapper for consistent API
 */
class Logger {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    debug(msg, data) {
        if (data) {
            this.logger.debug(data, msg);
        }
        else {
            this.logger.debug(msg);
        }
    }
    info(msg, data) {
        if (data) {
            this.logger.info(data, msg);
        }
        else {
            this.logger.info(msg);
        }
    }
    warn(msg, data) {
        if (data) {
            this.logger.warn(data, msg);
        }
        else {
            this.logger.warn(msg);
        }
    }
    error(msg, error, data) {
        const logData = { ...data };
        if (error instanceof Error) {
            logData.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        else if (error !== undefined) {
            logData.error = error;
        }
        if (Object.keys(logData).length > 0) {
            this.logger.error(logData, msg);
        }
        else {
            this.logger.error(msg);
        }
    }
    child(bindings) {
        return new Logger(this.logger.child(bindings));
    }
}
/**
 * Default application logger
 */
exports.logger = new Logger(baseLogger);
/**
 * Create a child logger for a specific module
 */
function createModuleLogger(moduleName) {
    return exports.logger.child({ module: moduleName });
}
/**
 * Create a child logger for a specific request
 */
function createRequestLogger(requestId, userId) {
    return exports.logger.child({
        requestId,
        ...(userId && { userId })
    });
}
/**
 * Log levels for configuration
 */
exports.LogLevels = {
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal'
};
//# sourceMappingURL=logger.js.map