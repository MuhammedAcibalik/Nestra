"use strict";
/**
 * Swagger Security Middleware
 * Controls access to API documentation based on environment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUiOptions = void 0;
exports.swaggerAccessControl = swaggerAccessControl;
exports.isSwaggerEnabled = isSwaggerEnabled;
/**
 * Access control middleware for Swagger documentation
 *
 * - Development: Open access
 * - Staging: Requires DOCS_ACCESS_TOKEN header
 * - Production: Completely disabled (404)
 */
function swaggerAccessControl() {
    return (req, res, next) => {
        const env = process.env.NODE_ENV;
        // Production: Completely disable - return 404 to hide existence
        if (env === 'production') {
            res.status(404).json({ message: 'Not Found' });
            return;
        }
        // Staging: Require access token
        if (env === 'staging') {
            const token = req.headers['x-docs-token'];
            const expectedToken = process.env.DOCS_ACCESS_TOKEN;
            if (!expectedToken) {
                console.warn('[Swagger] DOCS_ACCESS_TOKEN not set in staging environment');
                res.status(500).json({ message: 'Configuration error' });
                return;
            }
            if (!token || token !== expectedToken) {
                res.status(401).json({ message: 'Unauthorized - Invalid or missing docs token' });
                return;
            }
        }
        // Development: Allow access
        next();
    };
}
/**
 * Check if Swagger should be enabled for current environment
 */
function isSwaggerEnabled() {
    const env = process.env.NODE_ENV;
    return env !== 'production';
}
/**
 * Swagger UI configuration options
 */
exports.swaggerUiOptions = {
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true
    },
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin-bottom: 20px; }
        .swagger-ui .info .title { color: #3b4151; }
    `,
    customSiteTitle: 'Nestra API Documentation',
    customfavIcon: '/favicon.ico'
};
//# sourceMappingURL=swagger-security.js.map