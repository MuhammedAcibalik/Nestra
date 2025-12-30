/**
 * Anonymous ID Middleware
 * Ensures sticky anonymous user identification for A/B testing
 */

import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

const COOKIE_NAME = 'ab_anon_id';
const HEADER_NAME = 'x-anonymous-id';
const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

/**
 * Extended Request with anonymous ID
 */
export interface RequestWithAnonId extends Request {
    anonymousId: string;
}

/**
 * Middleware to ensure anonymous ID exists for A/B testing
 * Priority: Cookie > Header > Generate new
 */
export function ensureAnonymousId(req: Request, res: Response, next: NextFunction): void {
    const request = req as RequestWithAnonId;

    // Check cookie first
    const fromCookie = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (fromCookie && isValidUUID(fromCookie)) {
        request.anonymousId = fromCookie;
        return next();
    }

    // Check header
    const fromHeader = req.headers[HEADER_NAME] as string | undefined;
    if (fromHeader && isValidUUID(fromHeader)) {
        // Set cookie from header for future requests
        res.cookie(COOKIE_NAME, fromHeader, getCookieOptions(req));
        request.anonymousId = fromHeader;
        return next();
    }

    // Generate new ID
    const newId = randomUUID();
    res.cookie(COOKIE_NAME, newId, getCookieOptions(req));
    request.anonymousId = newId;
    next();
}

/**
 * Get anonymous ID from request (helper for services)
 */
export function getAnonymousId(req: Request): string | undefined {
    const request = req as RequestWithAnonId;
    return request.anonymousId;
}

/**
 * Build unit key for experiment bucketing
 * Priority: userId > tenantId:userId > tenantId:anonymousId > anonymousId
 */
export function buildUnitKey(
    userId?: string | null,
    tenantId?: string | null,
    anonymousId?: string | null
): string {
    const tenant = tenantId ?? 'no-tenant';

    if (userId) {
        return `${tenant}:${userId}`;
    }

    if (anonymousId) {
        return `${tenant}:${anonymousId}`;
    }

    // Fallback (should not happen if middleware is used)
    return `${tenant}:unknown-${Date.now()}`;
}

// ==================== HELPERS ====================

function isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

function getCookieOptions(req: Request): {
    httpOnly: boolean;
    sameSite: 'lax';
    secure: boolean;
    maxAge: number;
} {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE_MS
    };
}
