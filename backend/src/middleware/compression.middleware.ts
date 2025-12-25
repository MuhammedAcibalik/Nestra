/**
 * Compression Middleware
 * GZIP compression for responses
 * Following Microservice Pattern: Performance Optimization
 */

import compression from 'compression';
import { Request, Response } from 'express';

// ==================== CONFIG ====================

interface ICompressionConfig {
    readonly level: number;
    readonly threshold: number;
    readonly filter: (req: Request, res: Response) => boolean;
}

/**
 * Should compress filter
 * Skip compression for certain content types
 */
function shouldCompress(req: Request, res: Response): boolean {
    // Don't compress if 'x-no-compression' header is present
    if (req.headers['x-no-compression']) {
        return false;
    }

    // Fall back to standard filter
    return compression.filter(req, res);
}

const compressionConfig: ICompressionConfig = {
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress if response > 1KB
    filter: shouldCompress
};

// ==================== MIDDLEWARE ====================

export const compressionMiddleware = compression({
    level: compressionConfig.level,
    threshold: compressionConfig.threshold,
    filter: compressionConfig.filter
});

export { compressionConfig };
