"use strict";
/**
 * Request/Response Transformers
 * Middleware for transforming requests and responses
 * Following Chain of Responsibility Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTransformer = requestTransformer;
exports.responseEnvelope = responseEnvelope;
exports.corsHeaders = corsHeaders;
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('Transformers');
// ==================== REQUEST TRANSFORMER ====================
/**
 * Request transformer middleware
 */
function requestTransformer(rules) {
    return (req, _res, next) => {
        for (const rule of rules) {
            if (matchPath(req.path, rule.path) && matchMethod(req.method, rule.methods)) {
                if (rule.transformRequest) {
                    try {
                        rule.transformRequest(req);
                    }
                    catch (error) {
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
function responseEnvelope() {
    return (_req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            // Skip if already enveloped
            if (isEnveloped(data)) {
                return originalJson(data);
            }
            // Check if it's an error response
            const isError = res.statusCode >= 400;
            const envelope = {
                success: !isError,
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: res.getHeader('X-Request-ID'),
                    version: 'v1'
                }
            };
            if (isError) {
                envelope.error = {
                    code: getErrorCode(res.statusCode),
                    message: typeof data === 'object' && data !== null && 'message' in data
                        ? String(data.message)
                        : 'An error occurred',
                    details: typeof data === 'object' && data !== null && 'details' in data
                        ? data.details
                        : undefined
                };
            }
            else {
                envelope.data = data;
                // Add pagination if present
                if (typeof data === 'object' && data !== null && 'total' in data && 'page' in data) {
                    const paginated = data;
                    envelope.meta.pagination = {
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
function corsHeaders(options) {
    const allowedOrigins = options?.origins ?? ['*'];
    const allowedMethods = options?.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    const allowedHeaders = options?.headers ?? ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Version'];
    return (req, res, next) => {
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
function matchPath(path, pattern) {
    if (pattern === '*')
        return true;
    if (pattern.endsWith('*')) {
        return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
}
function matchMethod(method, allowedMethods) {
    if (!allowedMethods || allowedMethods.length === 0)
        return true;
    return allowedMethods.includes(method.toUpperCase());
}
function isEnveloped(data) {
    return typeof data === 'object' &&
        data !== null &&
        'success' in data &&
        typeof data.success === 'boolean';
}
function getErrorCode(statusCode) {
    const codes = {
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
//# sourceMappingURL=transformers.js.map