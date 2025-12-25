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
import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('APIVersion');

// ==================== TYPES ====================

export type ApiVersion = 'v1' | 'v2';

export const DEFAULT_API_VERSION: ApiVersion = 'v2';
export const SUPPORTED_VERSIONS: ApiVersion[] = ['v1', 'v2'];

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            apiVersion: ApiVersion;
        }
    }
}

// ==================== VERSION DETECTION ====================

/**
 * Parse version from Accept header
 * Format: application/vnd.nestra.v2+json
 */
function parseAcceptHeader(req: Request): ApiVersion | null {
    const accept = req.headers.accept;
    if (!accept) return null;

    const match = accept.match(/application\/vnd\.nestra\.(v\d+)\+json/);
    if (match?.[1] && SUPPORTED_VERSIONS.includes(match[1] as ApiVersion)) {
        return match[1] as ApiVersion;
    }

    return null;
}

/**
 * Parse version from URL path
 * Format: /api/v2/...
 */
function parseUrlVersion(path: string): ApiVersion | null {
    const match = path.match(/^\/api\/(v\d+)\//);
    if (match?.[1] && SUPPORTED_VERSIONS.includes(match[1] as ApiVersion)) {
        return match[1] as ApiVersion;
    }

    return null;
}

/**
 * Parse version from query parameter
 * Format: ?version=2
 */
function parseQueryVersion(req: Request): ApiVersion | null {
    const version = req.query.version as string | undefined;
    if (!version) return null;

    const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
    if (SUPPORTED_VERSIONS.includes(normalizedVersion as ApiVersion)) {
        return normalizedVersion as ApiVersion;
    }

    return null;
}

// ==================== MIDDLEWARE ====================

/**
 * API Version Middleware
 * Sets req.apiVersion based on detection priority:
 * 1. Accept header
 * 2. URL path
 * 3. Query parameter
 * 4. Default version
 */
export function versionMiddleware(req: Request, _res: Response, next: NextFunction): void {
    // Priority: Header > URL > Query > Default
    const headerVersion = parseAcceptHeader(req);
    const urlVersion = parseUrlVersion(req.path);
    const queryVersion = parseQueryVersion(req);

    req.apiVersion = headerVersion ?? urlVersion ?? queryVersion ?? DEFAULT_API_VERSION;

    logger.debug('API version detected', {
        version: req.apiVersion,
        source: headerVersion ? 'header' : urlVersion ? 'url' : queryVersion ? 'query' : 'default'
    });

    next();
}

/**
 * Version-specific route handler wrapper
 * Returns different handlers based on API version
 */
export function versionedHandler<T>(handlers: Partial<Record<ApiVersion, T>>): (req: Request) => T | undefined {
    return (req: Request) => {
        return handlers[req.apiVersion] ?? handlers[DEFAULT_API_VERSION];
    };
}

// ==================== DEPRECATION HELPERS ====================

export interface IDeprecationInfo {
    deprecatedAt: Date;
    sunsetDate: Date;
    message: string;
    successorVersion?: ApiVersion;
}

const versionDeprecations: Partial<Record<ApiVersion, IDeprecationInfo>> = {
    v1: {
        deprecatedAt: new Date('2025-07-01'),
        sunsetDate: new Date('2026-01-01'),
        message: 'API v1 is deprecated. Please migrate to v2.',
        successorVersion: 'v2'
    }
};

/**
 * Add deprecation headers for deprecated versions
 */
export function deprecationMiddleware(req: Request, res: Response, next: NextFunction): void {
    const deprecation = versionDeprecations[req.apiVersion];

    if (deprecation) {
        res.setHeader('Deprecation', deprecation.deprecatedAt.toUTCString());
        res.setHeader('Sunset', deprecation.sunsetDate.toUTCString());

        if (deprecation.successorVersion) {
            res.setHeader('Link', `</api/${deprecation.successorVersion}/docs>; rel="successor-version"`);
        }

        // Add warning header
        res.setHeader('Warning', `299 - "${deprecation.message}"`);
    }

    next();
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
    return !!versionDeprecations[version];
}

/**
 * Check if version is sunset (no longer available)
 */
export function isVersionSunset(version: ApiVersion): boolean {
    const deprecation = versionDeprecations[version];
    if (!deprecation) return false;
    return new Date() > deprecation.sunsetDate;
}

// ==================== VERSION-AWARE RESPONSE ====================

/**
 * Helper to transform response data for different versions
 */
export function transformForVersion<T, V1, V2>(
    data: T,
    transformers: {
        v1?: (data: T) => V1;
        v2?: (data: T) => V2;
    },
    version: ApiVersion
): V1 | V2 | T {
    const transformer = transformers[version];
    return transformer ? transformer(data) : data;
}
