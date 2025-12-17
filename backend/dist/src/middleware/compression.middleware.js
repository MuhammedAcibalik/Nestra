"use strict";
/**
 * Compression Middleware
 * GZIP compression for responses
 * Following Microservice Pattern: Performance Optimization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionConfig = exports.compressionMiddleware = void 0;
const compression_1 = __importDefault(require("compression"));
/**
 * Should compress filter
 * Skip compression for certain content types
 */
function shouldCompress(req, res) {
    // Don't compress if 'x-no-compression' header is present
    if (req.headers['x-no-compression']) {
        return false;
    }
    // Fall back to standard filter
    return compression_1.default.filter(req, res);
}
const compressionConfig = {
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress if response > 1KB
    filter: shouldCompress
};
exports.compressionConfig = compressionConfig;
// ==================== MIDDLEWARE ====================
exports.compressionMiddleware = (0, compression_1.default)({
    level: compressionConfig.level,
    threshold: compressionConfig.threshold,
    filter: compressionConfig.filter
});
//# sourceMappingURL=compression.middleware.js.map