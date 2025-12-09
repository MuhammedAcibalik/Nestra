/**
 * Request Logging Middleware
 * Logs all incoming requests with timing and response info
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            log: typeof logger;
        }
    }
}
/**
 * Request ID middleware - adds unique ID to each request
 */
export declare function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Request logging middleware - logs request/response details
 */
export declare function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Audit logging for important actions
 */
export declare function auditLog(action: string, userId: string, resourceType: string, resourceId: string, details?: Record<string, unknown>): void;
//# sourceMappingURL=request-logger.d.ts.map