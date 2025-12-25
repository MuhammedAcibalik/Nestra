/**
 * Security Headers Middleware
 * Uses Helmet for comprehensive HTTP security
 * Following Microservice Pattern: Defense in Depth
 */

import helmet from 'helmet';
import { RequestHandler } from 'express';

/**
 * Helmet configuration for production-ready security
 */
export const securityHeadersMiddleware: RequestHandler = helmet({
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
