/**
 * Swagger Security Middleware
 * Controls access to API documentation based on environment
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Access control middleware for Swagger documentation
 *
 * - Development: Open access
 * - Staging: Requires DOCS_ACCESS_TOKEN header
 * - Production: Completely disabled (404)
 */
export declare function swaggerAccessControl(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if Swagger should be enabled for current environment
 */
export declare function isSwaggerEnabled(): boolean;
/**
 * Swagger UI configuration options
 */
export declare const swaggerUiOptions: {
    swaggerOptions: {
        persistAuthorization: boolean;
        displayRequestDuration: boolean;
        filter: boolean;
        showExtensions: boolean;
        showCommonExtensions: boolean;
        tryItOutEnabled: boolean;
    };
    customCss: string;
    customSiteTitle: string;
    customfavIcon: string;
};
//# sourceMappingURL=swagger-security.d.ts.map