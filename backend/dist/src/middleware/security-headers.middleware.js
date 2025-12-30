"use strict";
/**
 * Security Headers Middleware
 * Uses Helmet for comprehensive HTTP security
 * Following Microservice Pattern: Defense in Depth
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeadersMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
/**
 * Helmet configuration for production-ready security
 */
exports.securityHeadersMiddleware = (0, helmet_1.default)({
    // Prevent XSS attacks
    xssFilter: true,
    // Prevent MIME sniffing
    noSniff: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Strict transport security (HSTS)
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
            scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:'], // WebSocket support
            fontSrc: ["'self'", 'https:', 'data:']
        }
    },
    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Hide X-Powered-By
    hidePoweredBy: true,
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    // IE No Open
    ieNoOpen: true,
    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' }
});
//# sourceMappingURL=security-headers.middleware.js.map