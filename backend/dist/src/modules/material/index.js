"use strict";
/**
 * Material Module - Barrel Export
 * Provides clean public API for the material module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialServiceHandler = exports.createMaterialController = exports.MaterialController = exports.MaterialService = exports.MaterialRepository = void 0;
var material_repository_1 = require("./material.repository");
Object.defineProperty(exports, "MaterialRepository", { enumerable: true, get: function () { return material_repository_1.MaterialRepository; } });
var material_service_1 = require("./material.service");
Object.defineProperty(exports, "MaterialService", { enumerable: true, get: function () { return material_service_1.MaterialService; } });
var material_controller_1 = require("./material.controller");
Object.defineProperty(exports, "MaterialController", { enumerable: true, get: function () { return material_controller_1.MaterialController; } });
Object.defineProperty(exports, "createMaterialController", { enumerable: true, get: function () { return material_controller_1.createMaterialController; } });
// Microservice
var material_service_handler_1 = require("./material.service-handler");
Object.defineProperty(exports, "MaterialServiceHandler", { enumerable: true, get: function () { return material_service_handler_1.MaterialServiceHandler; } });
//# sourceMappingURL=index.js.map