/**
 * Request/Response Transformers
 * Middleware for transforming requests and responses
 * Following Chain of Responsibility Pattern
 */

import { Request, Response, NextFunction } from 'express';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('Transformers');

// ==================== INTERFACES ====================

export interface ITransformRule {
    /** Path pattern (supports wildcards) */
    path: string;
    /** HTTP methods to apply to */
    methods?: string[];
    /** Request transformation */
    transformRequest?: (req: Request) => void;
    /** Response transformation */
    transformResponse?: (data: unknown) => unknown;
}

export interface IResponseEnvelope<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        version?: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

// ==================== REQUEST TRANSFORMER ====================

/**
 * Request transformer middleware
 */
export function requestTransformer(rules: ITransformRule[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        for (const rule of rules) {
            if (matchPath(req.path, rule.path) && matchMethod(req.method, rule.methods)) {
                if (rule.transformRequest) {
                    try {
                        rule.transformRequest(req);
                    } catch (error) {
                        logger.error('Request transform failed', { path: req.path, error });
                    }
                }
            }
        }
        next();
    };
}

// ==================== RESPONSE TRANSFORMER ====================

/**
 * Response envelope middleware
 * Wraps all responses in standard format
 */
export function responseEnvelope() {
    return (_req: Request, res: Response, next: NextFunction): void => {
        const originalJson = res.json.bind(res);

        res.json = function (data: unknown) {
            // Skip if already enveloped
            if (isEnveloped(data)) {
                return originalJson(data);
            }

            // Check if it's an error response
            const isError = res.statusCode >= 400;

            const envelope: IResponseEnvelope = {
                success: !isError,
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: res.getHeader('X-Request-ID') as string | undefined,
                    version: 'v1'
                }
            };

            if (isError) {
                envelope.error = {
                    code: getErrorCode(res.statusCode),
                    message:
                        typeof data === 'object' && data !== null && 'message' in data
                            ? String((data as Record<string, unknown>).message)
                            : 'An error occurred',
                    details:
                        typeof data === 'object' && data !== null && 'details' in data
                            ? (data as Record<string, unknown>).details
                            : undefined
                };
            } else {
                envelope.data = data;

                // Add pagination if present
                if (typeof data === 'object' && data !== null && 'total' in data && 'page' in data) {
                    const paginated = data as Record<string, unknown>;
                    envelope.meta!.pagination = {
                        page: Number(paginated.page),
                        limit: Number(paginated.limit ?? 10),
                        total: Number(paginated.total),
                        totalPages: Number(paginated.totalPages ?? 1)
                    };
                }
            }

            return originalJson(envelope);
        };

        next();
    };
}

// ==================== CORS TRANSFORMER ====================

/**
 * CORS headers middleware
 */
export function corsHeaders(options?: { origins?: string[]; methods?: string[]; headers?: string[] }) {
    const allowedOrigins = options?.origins ?? ['*'];
    const allowedMethods = options?.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    const allowedHeaders = options?.headers ?? ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Version'];

    return (req: Request, res: Response, next: NextFunction): void => {
        const origin = req.get('Origin') ?? '*';

        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
        }

        res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', '86400');

        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }

        next();
    };
}

// ==================== HELPERS ====================

function matchPath(path: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
        return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
}

function matchMethod(method: string, allowedMethods?: string[]): boolean {
    if (!allowedMethods || allowedMethods.length === 0) return true;
    return allowedMethods.includes(method.toUpperCase());
}

function isEnveloped(data: unknown): boolean {
    return (
        typeof data === 'object' &&
        data !== null &&
        'success' in data &&
        typeof (data as Record<string, unknown>).success === 'boolean'
    );
}

function getErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'VALIDATION_ERROR',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_ERROR',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE'
    };
    return codes[statusCode] ?? 'UNKNOWN_ERROR';
}
