"use strict";
/**
 * Security Headers Middleware
 * Adds security headers for XSS, clickjacking, etc. protection
 * Following Microservice Pattern: Defense in Depth
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeadersMiddleware = securityHeadersMiddleware;
/**
 * Security Headers Middleware
 * Adds standard security headers to all responses
 */
function securityHeadersMiddleware(_req, res, next) {
    // Prevent XSS attacks
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Strict transport security (HSTS)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Content Security Policy (basic)
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    // Remove X-Powered-By header (information disclosure)
    res.removeHeader('X-Powered-By');
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
}
//# sourceMappingURL=security-headers.middleware.js.map