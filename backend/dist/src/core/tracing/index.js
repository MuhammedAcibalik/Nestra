"use strict";
/**
 * Tracing Module - Barrel Export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTracingEnabled = exports.shutdownTracing = exports.initializeTracing = void 0;
var otel_config_1 = require("./otel.config");
Object.defineProperty(exports, "initializeTracing", { enumerable: true, get: function () { return otel_config_1.initializeTracing; } });
Object.defineProperty(exports, "shutdownTracing", { enumerable: true, get: function () { return otel_config_1.shutdownTracing; } });
Object.defineProperty(exports, "isTracingEnabled", { enumerable: true, get: function () { return otel_config_1.isTracingEnabled; } });
//# sourceMappingURL=index.js.map