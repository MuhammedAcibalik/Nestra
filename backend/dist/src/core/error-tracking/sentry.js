"use strict";
/**
 * Sentry Error Tracking Integration
 * Centralized error tracking for production monitoring
 * Following Single Responsibility Principle (SRP)
 * Compatible with Sentry SDK v8+
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSentry = initializeSentry;
exports.initializeSentryFromEnv = initializeSentryFromEnv;
exports.sentryErrorHandler = sentryErrorHandler;
exports.setupSentryMiddleware = setupSentryMiddleware;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.setUser = setUser;
exports.addBreadcrumb = addBreadcrumb;
exports.setTag = setTag;
exports.flushSentry = flushSentry;
exports.isSentryEnabled = isSentryEnabled;
const Sentry = __importStar(require("@sentry/node"));
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('Sentry');
let isInitialized = false;
/**
 * Initialize Sentry SDK
 * Call this at application startup, before any other middleware
 */
function initializeSentry(config) {
    if (isInitialized) {
        logger.warn('Sentry already initialized');
        return;
    }
    if (!config.dsn) {
        logger.warn('Sentry DSN not provided, error tracking disabled');
        return;
    }
    try {
        Sentry.init({
            dsn: config.dsn,
            environment: config.environment ?? process.env.NODE_ENV ?? 'development',
            release: config.release ?? process.env.npm_package_version ?? '1.0.0',
            tracesSampleRate: config.tracesSampleRate ?? 0.1, // 10% of requests
            profilesSampleRate: config.profilesSampleRate ?? 0.1,
            debug: config.debug ?? false,
            // Filter out non-error events
            beforeSend(event, hint) {
                const error = hint.originalException;
                // Don't send validation errors to Sentry
                if (error instanceof Error && error.name === 'ValidationError') {
                    return null;
                }
                // Don't send 4xx client errors
                const statusCode = error?.statusCode;
                if (statusCode && statusCode >= 400 && statusCode < 500) {
                    return null;
                }
                return event;
            },
            // Ignore common non-critical errors
            ignoreErrors: [
                'ECONNREFUSED',
                'ENOTFOUND',
                'ETIMEDOUT',
                'Request aborted',
                'socket hang up'
            ]
        });
        isInitialized = true;
        logger.info('Sentry initialized', {
            environment: config.environment,
            release: config.release
        });
    }
    catch (error) {
        logger.error('Sentry initialization failed', { error });
    }
}
/**
 * Initialize Sentry from environment variables
 */
function initializeSentryFromEnv() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        logger.info('SENTRY_DSN not set, error tracking disabled');
        return;
    }
    initializeSentry({
        dsn,
        environment: process.env.NODE_ENV,
        release: process.env.npm_package_version,
        tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
        debug: process.env.SENTRY_DEBUG === 'true'
    });
}
/**
 * Sentry error handler middleware for Express
 * Add this after your routes but before your error handler
 */
function sentryErrorHandler() {
    return (err, req, res, next) => {
        if (!isInitialized) {
            next(err);
            return;
        }
        // Capture the error with request context
        Sentry.withScope((scope) => {
            scope.setExtra('url', req.url);
            scope.setExtra('method', req.method);
            scope.setExtra('headers', req.headers);
            scope.setExtra('query', req.query);
            scope.setExtra('body', req.body);
            // Set user if available
            const user = req.user;
            if (user) {
                scope.setUser({ id: user.id, email: user.email });
            }
            Sentry.captureException(err);
        });
        next(err);
    };
}
/**
 * Setup Sentry middleware on Express app
 * Note: In Sentry v8+, use setupExpressErrorHandler for error handling
 */
function setupSentryMiddleware(app) {
    if (!isInitialized) {
        logger.debug('Sentry not initialized, skipping middleware setup');
        return;
    }
    // Use the new v8+ API for Express integration
    Sentry.setupExpressErrorHandler(app);
    logger.info('Sentry middleware configured');
}
/**
 * Capture an exception manually
 */
function captureException(error, context) {
    if (!isInitialized) {
        logger.error('Untracked exception', { error: error.message, context });
        return undefined;
    }
    return Sentry.captureException(error, {
        extra: context
    });
}
/**
 * Capture a message manually
 */
function captureMessage(message, level = 'info') {
    if (!isInitialized) {
        logger.info('Untracked message', { message, level });
        return undefined;
    }
    return Sentry.captureMessage(message, level);
}
/**
 * Set user context for error tracking
 */
function setUser(user) {
    if (!isInitialized)
        return;
    Sentry.setUser(user);
}
/**
 * Add breadcrumb for debugging
 */
function addBreadcrumb(breadcrumb) {
    if (!isInitialized)
        return;
    Sentry.addBreadcrumb(breadcrumb);
}
/**
 * Set custom tag
 */
function setTag(key, value) {
    if (!isInitialized)
        return;
    Sentry.setTag(key, value);
}
/**
 * Flush pending events before shutdown
 */
async function flushSentry(timeout = 2000) {
    if (!isInitialized)
        return true;
    return Sentry.close(timeout);
}
/**
 * Check if Sentry is initialized
 */
function isSentryEnabled() {
    return isInitialized;
}
//# sourceMappingURL=sentry.js.map