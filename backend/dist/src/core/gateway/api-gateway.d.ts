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
export interface IRateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipPaths?: string[];
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
export declare class ApiGateway {
    readonly router: Router;
    private readonly config;
    private readonly rateLimiter;
    private readonly requestLogger;
    private readonly metrics;
    constructor(config?: Partial<IGatewayConfig>);
    /**
     * Rate limiting middleware
     */
    rateLimitMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Request logging middleware
     */
    loggingMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Error handling middleware
     */
    errorMiddleware(): (err: Error, _req: Request, res: Response, _next: NextFunction) => void;
    private normalizePath;
    getRecentLogs(count?: number): IRequestLog[];
}
export declare function getApiGateway(config?: Partial<IGatewayConfig>): ApiGateway;
//# sourceMappingURL=api-gateway.d.ts.map