/**
 * API Gateway
 * Centralized entry point for all API requests
 * Following Microservice Pattern: API Gateway
 *
 * Features:
 * - Rate limiting
 * - Request/Response logging
 * - Request routing
 * - Error handling
 */

import { Request, Response, NextFunction, Router } from 'express';
import { getMetricsService } from '../monitoring/metrics.service';

// ==================== INTERFACES ====================

export interface IRateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
    skipPaths?: string[]; // Paths to skip rate limiting
}

export interface IRequestLog {
    id: string;
    method: string;
    path: string;
    ip: string;
    userAgent: string;
    userId?: string;
    timestamp: Date;
    duration?: number;
    statusCode?: number;
}

export interface IGatewayConfig {
    rateLimit: IRateLimitConfig;
    enableLogging: boolean;
    enableMetrics: boolean;
}

// ==================== DEFAULT CONFIG ====================

const defaultConfig: IGatewayConfig = {
    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
        skipPaths: ['/health', '/health/live', '/health/ready', '/metrics']
    },
    enableLogging: true,
    enableMetrics: true
};

// ==================== RATE LIMITER ====================

class RateLimiter {
    private readonly requests: Map<string, { count: number; resetTime: number }> = new Map();
    private readonly config: IRateLimitConfig;

    constructor(config: IRateLimitConfig) {
        this.config = config;
    }

    isRateLimited(key: string, path: string): { limited: boolean; remaining: number; resetTime: number } {
        // Skip certain paths
        if (this.config.skipPaths?.some((p) => path.startsWith(p))) {
            return { limited: false, remaining: this.config.maxRequests, resetTime: 0 };
        }

        const now = Date.now();
        const entry = this.requests.get(key);

        if (!entry || now >= entry.resetTime) {
            // New window
            this.requests.set(key, {
                count: 1,
                resetTime: now + this.config.windowMs
            });
            return {
                limited: false,
                remaining: this.config.maxRequests - 1,
                resetTime: now + this.config.windowMs
            };
        }

        if (entry.count >= this.config.maxRequests) {
            return { limited: true, remaining: 0, resetTime: entry.resetTime };
        }

        entry.count++;
        return {
            limited: false,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.resetTime
        };
    }

    // Clean up old entries periodically
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (now >= entry.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}

// ==================== REQUEST LOGGER ====================

class RequestLogger {
    private readonly logs: IRequestLog[] = [];
    private readonly maxLogs = 1000;

    log(logEntry: IRequestLog): void {
        this.logs.push(logEntry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.log(
            `[${logEntry.timestamp.toISOString()}] ${logEntry.method} ${logEntry.path} ` +
                `${logEntry.statusCode ?? '-'} ${logEntry.duration ?? '-'}ms`
        );
    }

    getRecentLogs(count = 50): IRequestLog[] {
        return this.logs.slice(-count);
    }
}

// ==================== API GATEWAY ====================

export class ApiGateway {
    public readonly router: Router;
    private readonly config: IGatewayConfig;
    private readonly rateLimiter: RateLimiter;
    private readonly requestLogger: RequestLogger;
    private readonly metrics = getMetricsService();

    constructor(config?: Partial<IGatewayConfig>) {
        this.config = { ...defaultConfig, ...config };
        this.rateLimiter = new RateLimiter(this.config.rateLimit);
        this.requestLogger = new RequestLogger();
        this.router = Router();

        // Cleanup rate limiter every minute
        setInterval(() => this.rateLimiter.cleanup(), 60 * 1000);
    }

    // ==================== MIDDLEWARE ====================

    /**
     * Rate limiting middleware
     */
    rateLimitMiddleware() {
        return (req: Request, res: Response, next: NextFunction): void => {
            const clientKey = req.ip ?? req.socket.remoteAddress ?? 'unknown';
            const result = this.rateLimiter.isRateLimited(clientKey, req.path);

            res.setHeader('X-RateLimit-Limit', this.config.rateLimit.maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

            if (result.limited) {
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
                });
                return;
            }

            next();
        };
    }

    /**
     * Request logging middleware
     */
    loggingMiddleware() {
        return (req: Request, res: Response, next: NextFunction): void => {
            if (!this.config.enableLogging) {
                next();
                return;
            }

            const startTime = Date.now();
            const requestId = crypto.randomUUID();

            // Attach request ID to response
            res.setHeader('X-Request-ID', requestId);

            // Log on response finish
            res.on('finish', () => {
                const duration = Date.now() - startTime;

                const logEntry: IRequestLog = {
                    id: requestId,
                    method: req.method,
                    path: req.path,
                    ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
                    userAgent: req.get('User-Agent') ?? 'unknown',
                    userId: (req as Request & { user?: { id: string } }).user?.id,
                    timestamp: new Date(),
                    duration,
                    statusCode: res.statusCode
                };

                this.requestLogger.log(logEntry);

                // Update metrics
                if (this.config.enableMetrics) {
                    this.metrics.incrementCounter('http_requests_total', {
                        method: req.method,
                        path: this.normalizePath(req.path),
                        status: String(res.statusCode)
                    });
                    this.metrics.recordHistogram('http_request_duration_seconds', duration / 1000, {
                        method: req.method,
                        path: this.normalizePath(req.path)
                    });
                }
            });

            next();
        };
    }

    /**
     * Error handling middleware
     */
    errorMiddleware() {
        return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
            console.error('[API Gateway] Error:', err.message);

            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
            });
        };
    }

    // ==================== HELPERS ====================

    private normalizePath(path: string): string {
        // Replace UUIDs and numeric IDs with placeholders
        return path
            .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
            .replace(/\/\d+/g, '/:id');
    }

    getRecentLogs(count?: number): IRequestLog[] {
        return this.requestLogger.getRecentLogs(count);
    }
}

// ==================== SINGLETON INSTANCE ====================

let gatewayInstance: ApiGateway | null = null;

export function getApiGateway(config?: Partial<IGatewayConfig>): ApiGateway {
    gatewayInstance ??= new ApiGateway(config);
    return gatewayInstance;
}
