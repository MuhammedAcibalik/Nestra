/**
 * Request ID Middleware
 * Adds unique request ID for tracing and logging
 * Following Microservice Pattern: Distributed Tracing, Correlation ID
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}
/**
 * Request ID Middleware
 * Adds or uses existing X-Request-ID header for request tracing
 */
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Get request ID from request object
 */
export declare function getRequestId(req: Request): string;
//# sourceMappingURL=request-id.middleware.d.ts.map