/**
 * Enhanced Error Handler Middleware
 * Following Single Responsibility Principle (SRP)
 * Centralized error handling with Sentry integration
 */
import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
    details?: Record<string, unknown>;
}
export type ErrorCategory = 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMIT' | 'INTERNAL' | 'EXTERNAL_SERVICE' | 'DATABASE';
export declare const ErrorCodes: {
    readonly VALIDATION: {
        readonly code: "VALIDATION_ERROR";
        readonly status: 400;
    };
    readonly AUTHENTICATION: {
        readonly code: "AUTHENTICATION_ERROR";
        readonly status: 401;
    };
    readonly AUTHORIZATION: {
        readonly code: "AUTHORIZATION_ERROR";
        readonly status: 403;
    };
    readonly NOT_FOUND: {
        readonly code: "NOT_FOUND";
        readonly status: 404;
    };
    readonly CONFLICT: {
        readonly code: "CONFLICT";
        readonly status: 409;
    };
    readonly RATE_LIMIT: {
        readonly code: "RATE_LIMIT_EXCEEDED";
        readonly status: 429;
    };
    readonly INTERNAL: {
        readonly code: "INTERNAL_ERROR";
        readonly status: 500;
    };
    readonly EXTERNAL_SERVICE: {
        readonly code: "EXTERNAL_SERVICE_ERROR";
        readonly status: 502;
    };
    readonly DATABASE: {
        readonly code: "DATABASE_ERROR";
        readonly status: 503;
    };
};
export declare function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void;
export declare function createError(message: string, statusCode?: number, code?: string): AppError;
export declare function createValidationError(message: string, details?: Record<string, unknown>): AppError;
export declare function createNotFoundError(resource: string): AppError;
export declare function createAuthenticationError(message?: string): AppError;
export declare function createAuthorizationError(message?: string): AppError;
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
export declare function notFoundHandler(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map