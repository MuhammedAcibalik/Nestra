"use strict";
/**
 * API Version Middleware
 * Detects API version from header or URL and sets on request
 *
 * Supports:
 * - Header: Accept: application/vnd.nestra.v2+json
 * - URL: /api/v2/...
 * - Query: ?version=2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_VERSIONS = exports.DEFAULT_API_VERSION = void 0;
exports.versionMiddleware = versionMiddleware;
exports.versionedHandler = versionedHandler;
exports.deprecationMiddleware = deprecationMiddleware;
exports.isVersionDeprecated = isVersionDeprecated;
exports.isVersionSunset = isVersionSunset;
exports.transformForVersion = transformForVersion;
const logger_1 = require("../core/logger");
const logger = (0, logger_1.createModuleLogger)('APIVersion');
exports.DEFAULT_API_VERSION = 'v2';
exports.SUPPORTED_VERSIONS = ['v1', 'v2'];
// ==================== VERSION DETECTION ====================
/**
 * Parse version from Accept header
 * Format: application/vnd.nestra.v2+json
 */
function parseAcceptHeader(req) {
    const accept = req.headers.accept;
    if (!accept)
        return null;
    const match = accept.match(/application\/vnd\.nestra\.(v\d+)\+json/);
    if (match?.[1] && exports.SUPPORTED_VERSIONS.includes(match[1])) {
        return match[1];
    }
    return null;
}
/**
 * Parse version from URL path
 * Format: /api/v2/...
 */
function parseUrlVersion(path) {
    const match = path.match(/^\/api\/(v\d+)\//);
    if (match?.[1] && exports.SUPPORTED_VERSIONS.includes(match[1])) {
        return match[1];
    }
    return null;
}
/**
 * Parse version from query parameter
 * Format: ?version=2
 */
function parseQueryVersion(req) {
    const version = req.query.version;
    if (!version)
        return null;
    const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
    if (exports.SUPPORTED_VERSIONS.includes(normalizedVersion)) {
        return normalizedVersion;
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
function versionMiddleware(req, _res, next) {
    // Priority: Header > URL > Query > Default
    const headerVersion = parseAcceptHeader(req);
    const urlVersion = parseUrlVersion(req.path);
    const queryVersion = parseQueryVersion(req);
    req.apiVersion = headerVersion ?? urlVersion ?? queryVersion ?? exports.DEFAULT_API_VERSION;
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
function versionedHandler(handlers) {
    return (req) => {
        return handlers[req.apiVersion] ?? handlers[exports.DEFAULT_API_VERSION];
    };
}
const versionDeprecations = {
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
function deprecationMiddleware(req, res, next) {
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
function isVersionDeprecated(version) {
    return !!versionDeprecations[version];
}
/**
 * Check if version is sunset (no longer available)
 */
function isVersionSunset(version) {
    const deprecation = versionDeprecations[version];
    if (!deprecation)
        return false;
    return new Date() > deprecation.sunsetDate;
}
// ==================== VERSION-AWARE RESPONSE ====================
/**
 * Helper to transform response data for different versions
 */
function transformForVersion(data, transformers, version) {
    const transformer = transformers[version];
    return transformer ? transformer(data) : data;
}
//# sourceMappingURL=version.middleware.js.map