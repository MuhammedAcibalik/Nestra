/**
 * Timeout Middleware
 * Prevents long-running requests from blocking resources
 * Following Microservice Pattern: Fail-Fast, Resource Management
 */

import { Request, Response, NextFunction } from 'express';

// ==================== CONFIG ====================

interface ITimeoutConfig {
    readonly defaultTimeoutMs: number;
    readonly optimizationTimeoutMs: number;
    readonly uploadTimeoutMs: number;
}

const timeoutConfig: ITimeoutConfig = {
    defaultTimeoutMs: 30000,      // 30 seconds
    optimizationTimeoutMs: 120000, // 2 minutes for CPU-intensive
    uploadTimeoutMs: 300000       // 5 minutes for uploads
};

// ==================== MIDDLEWARE ====================

/**
 * Creates timeout middleware with configurable duration
 */
export function createTimeoutMiddleware(timeoutMs: number = timeoutConfig.defaultTimeoutMs) {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Set timeout on the request
        req.setTimeout(timeoutMs);

        // Create timeout handler
        const timeoutId = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    error: 'Request Timeout',
                    message: `Request exceeded ${timeoutMs}ms timeout`,
                    requestId: req.requestId
                });
            }
        }, timeoutMs);

        // Clear timeout when response finishes
        res.on('finish', () => clearTimeout(timeoutId));
        res.on('close', () => clearTimeout(timeoutId));

        next();
    };
}

// ==================== PRE-CONFIGURED MIDDLEWARE ====================

export const defaultTimeout = createTimeoutMiddleware(timeoutConfig.defaultTimeoutMs);
export const optimizationTimeout = createTimeoutMiddleware(timeoutConfig.optimizationTimeoutMs);
export const uploadTimeout = createTimeoutMiddleware(timeoutConfig.uploadTimeoutMs);

export { timeoutConfig };
