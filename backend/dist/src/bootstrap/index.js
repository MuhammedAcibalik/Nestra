"use strict";
/**
 * Bootstrap Module - Barrel Export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeErrorHandling = exports.initializeRoutes = exports.initializeMiddleware = exports.initializeDependencies = void 0;
var di_container_1 = require("./di-container");
Object.defineProperty(exports, "initializeDependencies", { enumerable: true, get: function () { return di_container_1.initializeDependencies; } });
var middleware_1 = require("./middleware");
Object.defineProperty(exports, "initializeMiddleware", { enumerable: true, get: function () { return middleware_1.initializeMiddleware; } });
var routes_1 = require("./routes");
Object.defineProperty(exports, "initializeRoutes", { enumerable: true, get: function () { return routes_1.initializeRoutes; } });
Object.defineProperty(exports, "initializeErrorHandling", { enumerable: true, get: function () { return routes_1.initializeErrorHandling; } });
//# sourceMappingURL=index.js.map