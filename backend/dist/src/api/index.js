"use strict";
/**
 * API Module
 * Versioned API infrastructure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_VERSIONS = exports.DEFAULT_API_VERSION = exports.isVersionSunset = exports.isVersionDeprecated = exports.transformForVersion = exports.versionedHandler = exports.deprecationMiddleware = exports.versionMiddleware = void 0;
var version_middleware_1 = require("./version.middleware");
Object.defineProperty(exports, "versionMiddleware", { enumerable: true, get: function () { return version_middleware_1.versionMiddleware; } });
Object.defineProperty(exports, "deprecationMiddleware", { enumerable: true, get: function () { return version_middleware_1.deprecationMiddleware; } });
Object.defineProperty(exports, "versionedHandler", { enumerable: true, get: function () { return version_middleware_1.versionedHandler; } });
Object.defineProperty(exports, "transformForVersion", { enumerable: true, get: function () { return version_middleware_1.transformForVersion; } });
Object.defineProperty(exports, "isVersionDeprecated", { enumerable: true, get: function () { return version_middleware_1.isVersionDeprecated; } });
Object.defineProperty(exports, "isVersionSunset", { enumerable: true, get: function () { return version_middleware_1.isVersionSunset; } });
Object.defineProperty(exports, "DEFAULT_API_VERSION", { enumerable: true, get: function () { return version_middleware_1.DEFAULT_API_VERSION; } });
Object.defineProperty(exports, "SUPPORTED_VERSIONS", { enumerable: true, get: function () { return version_middleware_1.SUPPORTED_VERSIONS; } });
//# sourceMappingURL=index.js.map