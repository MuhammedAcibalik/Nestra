/**
 * Security Headers Middleware
 * Adds security headers for XSS, clickjacking, etc. protection
 * Following Microservice Pattern: Defense in Depth
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Security Headers Middleware
 * Adds standard security headers to all responses
 */
export declare function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=security-headers.middleware.d.ts.map