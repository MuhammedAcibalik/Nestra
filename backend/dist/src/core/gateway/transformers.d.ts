/**
 * Request/Response Transformers
 * Middleware for transforming requests and responses
 * Following Chain of Responsibility Pattern
 */
import { Request, Response, NextFunction } from 'express';
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
/**
 * Request transformer middleware
 */
export declare function requestTransformer(rules: ITransformRule[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Response envelope middleware
 * Wraps all responses in standard format
 */
export declare function responseEnvelope(): (_req: Request, res: Response, next: NextFunction) => void;
/**
 * CORS headers middleware
 */
export declare function corsHeaders(options?: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
}): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=transformers.d.ts.map