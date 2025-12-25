/**
 * API Version Middleware
 * Detects API version from header or URL and sets on request
 *
 * Supports:
 * - Header: Accept: application/vnd.nestra.v2+json
 * - URL: /api/v2/...
 * - Query: ?version=2
 */
import { Request, Response, NextFunction } from 'express';
export type ApiVersion = 'v1' | 'v2';
export declare const DEFAULT_API_VERSION: ApiVersion;
export declare const SUPPORTED_VERSIONS: ApiVersion[];
declare global {
    namespace Express {
        interface Request {
            apiVersion: ApiVersion;
        }
    }
}
/**
 * API Version Middleware
 * Sets req.apiVersion based on detection priority:
 * 1. Accept header
 * 2. URL path
 * 3. Query parameter
 * 4. Default version
 */
export declare function versionMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Version-specific route handler wrapper
 * Returns different handlers based on API version
 */
export declare function versionedHandler<T>(handlers: Partial<Record<ApiVersion, T>>): (req: Request) => T | undefined;
export interface IDeprecationInfo {
    deprecatedAt: Date;
    sunsetDate: Date;
    message: string;
    successorVersion?: ApiVersion;
}
/**
 * Add deprecation headers for deprecated versions
 */
export declare function deprecationMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Check if version is deprecated
 */
export declare function isVersionDeprecated(version: ApiVersion): boolean;
/**
 * Check if version is sunset (no longer available)
 */
export declare function isVersionSunset(version: ApiVersion): boolean;
/**
 * Helper to transform response data for different versions
 */
export declare function transformForVersion<T, V1, V2>(data: T, transformers: {
    v1?: (data: T) => V1;
    v2?: (data: T) => V2;
}, version: ApiVersion): V1 | V2 | T;
//# sourceMappingURL=version.middleware.d.ts.map