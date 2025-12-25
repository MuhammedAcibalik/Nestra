/**
 * Sentry Error Tracking Integration
 * Centralized error tracking for production monitoring
 * Following Single Responsibility Principle (SRP)
 * Compatible with Sentry SDK v8+
 */

import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('Sentry');

export interface ISentryConfig {
    dsn: string;
    environment?: string;
    release?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    debug?: boolean;
}

let isInitialized = false;

/**
 * Initialize Sentry SDK
 * Call this at application startup, before any other middleware
 */
export function initializeSentry(config: ISentryConfig): void {
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
                const statusCode = (error as { statusCode?: number })?.statusCode;
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
    } catch (error) {
        logger.error('Sentry initialization failed', { error });
    }
}

/**
 * Initialize Sentry from environment variables
 */
export function initializeSentryFromEnv(): void {
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
export function sentryErrorHandler() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
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
            const user = (req as { user?: { id: string; email?: string } }).user;
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
export function setupSentryMiddleware(app: Express): void {
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
export function captureException(error: Error, context?: Record<string, unknown>): string | undefined {
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
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'): string | undefined {
    if (!isInitialized) {
        logger.info('Untracked message', { message, level });
        return undefined;
    }

    return Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (!isInitialized) return;
    Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!isInitialized) return;
    Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string): void {
    if (!isInitialized) return;
    Sentry.setTag(key, value);
}

/**
 * Flush pending events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
    if (!isInitialized) return true;
    return Sentry.close(timeout);
}

/**
 * Check if Sentry is initialized
 */
export function isSentryEnabled(): boolean {
    return isInitialized;
}
