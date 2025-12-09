/**
 * Validation Middleware
 * Express middleware for request validation using Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
/**
 * Validation target in request
 */
export type ValidationTarget = 'body' | 'query' | 'params';
/**
 * Create validation middleware for a specific schema and target
 */
export declare function validate<T>(schema: ZodType<T>, target?: ValidationTarget): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate multiple targets at once
 */
export declare function validateAll<B = unknown, Q = unknown, P = unknown>(options: {
    body?: ZodType<B>;
    query?: ZodType<Q>;
    params?: ZodType<P>;
}): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper to validate UUID params
 */
export declare function validateId(paramName?: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=middleware.d.ts.map