/**
 * Validation Middleware
 * Express middleware for request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

/**
 * Validation target in request
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation error response format
 */
interface ValidationErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details: {
            field: string;
            message: string;
        }[];
    };
}

/**
 * Format Zod errors into a user-friendly format
 */
function formatZodErrors(error: ZodError): ValidationErrorResponse['error']['details'] {
    return error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}

/**
 * Create validation middleware for a specific schema and target
 */
export function validate<T>(
    schema: ZodType<T>,
    target: ValidationTarget = 'body'
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[target];
            const parsed = schema.parse(data);

            // Replace the target with parsed (and transformed) data
            if (target === 'body') {
                req.body = parsed;
            } else if (target === 'query') {
                (req as any).query = parsed;
            } else if (target === 'params') {
                (req as any).params = parsed;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const response: ValidationErrorResponse = {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'İstek verisi doğrulama hatası',
                        details: formatZodErrors(error)
                    }
                };
                res.status(400).json(response);
                return;
            }

            // Re-throw non-Zod errors
            next(error);
        }
    };
}

/**
 * Validate multiple targets at once
 */
export function validateAll<B = unknown, Q = unknown, P = unknown>(options: {
    body?: ZodType<B>;
    query?: ZodType<Q>;
    params?: ZodType<P>;
}) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: ValidationErrorResponse['error']['details'] = [];

        try {
            if (options.body) {
                const parsed = options.body.parse(req.body);
                req.body = parsed;
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(...formatZodErrors(error).map(e => ({
                    ...e,
                    field: `body.${e.field}`
                })));
            }
        }

        try {
            if (options.query) {
                const parsed = options.query.parse(req.query);
                (req as any).query = parsed;
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(...formatZodErrors(error).map(e => ({
                    ...e,
                    field: `query.${e.field}`
                })));
            }
        }

        try {
            if (options.params) {
                const parsed = options.params.parse(req.params);
                (req as any).params = parsed;
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(...formatZodErrors(error).map(e => ({
                    ...e,
                    field: `params.${e.field}`
                })));
            }
        }

        if (errors.length > 0) {
            const response: ValidationErrorResponse = {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'İstek verisi doğrulama hatası',
                    details: errors
                }
            };
            res.status(400).json(response);
            return;
        }

        next();
    };
}

/**
 * Helper to validate UUID params
 */
export function validateId(paramName = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
        const id = req.params[paramName];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!id || !uuidRegex.test(id)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: `Geçersiz ${paramName} formatı`,
                    details: [{ field: paramName, message: 'Geçerli bir UUID olmalıdır' }]
                }
            });
            return;
        }

        next();
    };
}
