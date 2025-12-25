/**
 * Sentry Error Tracking Integration
 * Centralized error tracking for production monitoring
 * Following Single Responsibility Principle (SRP)
 * Compatible with Sentry SDK v8+
 */
import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
export interface ISentryConfig {
    dsn: string;
    environment?: string;
    release?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    debug?: boolean;
}
/**
 * Initialize Sentry SDK
 * Call this at application startup, before any other middleware
 */
export declare function initializeSentry(config: ISentryConfig): void;
/**
 * Initialize Sentry from environment variables
 */
export declare function initializeSentryFromEnv(): void;
/**
 * Sentry error handler middleware for Express
 * Add this after your routes but before your error handler
 */
export declare function sentryErrorHandler(): (err: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Setup Sentry middleware on Express app
 * Note: In Sentry v8+, use setupExpressErrorHandler for error handling
 */
export declare function setupSentryMiddleware(app: Express): void;
/**
 * Capture an exception manually
 */
export declare function captureException(error: Error, context?: Record<string, unknown>): string | undefined;
/**
 * Capture a message manually
 */
export declare function captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'): string | undefined;
/**
 * Set user context for error tracking
 */
export declare function setUser(user: {
    id: string;
    email?: string;
    username?: string;
} | null): void;
/**
 * Add breadcrumb for debugging
 */
export declare function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void;
/**
 * Set custom tag
 */
export declare function setTag(key: string, value: string): void;
/**
 * Flush pending events before shutdown
 */
export declare function flushSentry(timeout?: number): Promise<boolean>;
/**
 * Check if Sentry is initialized
 */
export declare function isSentryEnabled(): boolean;
//# sourceMappingURL=sentry.d.ts.map