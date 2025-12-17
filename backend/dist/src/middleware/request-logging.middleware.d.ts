/**
 * Request Logging Middleware
 * Structured logging for all HTTP requests
 * Following Microservice Pattern: Observability, Distributed Tracing
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Request logging middleware
 * Logs request start and completion with duration
 */
export declare function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=request-logging.middleware.d.ts.map