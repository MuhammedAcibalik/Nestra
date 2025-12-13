/**
 * Metrics Middleware
 * HTTP request/response metrics collection
 * Following Microservice Pattern: Observability
 */
import { Request, Response, NextFunction } from 'express';
/**
 * HTTP Metrics Middleware
 * Records request count, duration, and active connections
 */
export declare function metricsMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=metrics.middleware.d.ts.map