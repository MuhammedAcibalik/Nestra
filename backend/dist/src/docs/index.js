"use strict";
/**
 * Documentation Module Barrel Export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUiOptions = exports.isSwaggerEnabled = exports.swaggerAccessControl = exports.swaggerSpec = void 0;
var swagger_1 = require("./swagger");
Object.defineProperty(exports, "swaggerSpec", { enumerable: true, get: function () { return swagger_1.swaggerSpec; } });
var swagger_security_1 = require("./swagger-security");
Object.defineProperty(exports, "swaggerAccessControl", { enumerable: true, get: function () { return swagger_security_1.swaggerAccessControl; } });
Object.defineProperty(exports, "isSwaggerEnabled", { enumerable: true, get: function () { return swagger_security_1.isSwaggerEnabled; } });
Object.defineProperty(exports, "swaggerUiOptions", { enumerable: true, get: function () { return swagger_security_1.swaggerUiOptions; } });
//# sourceMappingURL=index.js.map