"use strict";
/**
 * Location Module - Barrel Export
 * Following standard module structure
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationServiceHandler = exports.LocationController = exports.LocationService = exports.LocationRepository = void 0;
// ==================== INTERFACES ====================
__exportStar(require("./interfaces"), exports);
// ==================== REPOSITORY ====================
var location_repository_1 = require("./location.repository");
Object.defineProperty(exports, "LocationRepository", { enumerable: true, get: function () { return location_repository_1.LocationRepository; } });
// ==================== SERVICE ====================
var location_service_1 = require("./location.service");
Object.defineProperty(exports, "LocationService", { enumerable: true, get: function () { return location_service_1.LocationService; } });
// ==================== CONTROLLER ====================
var location_controller_1 = require("./location.controller");
Object.defineProperty(exports, "LocationController", { enumerable: true, get: function () { return location_controller_1.LocationController; } });
// ==================== MICROSERVICE ====================
var location_service_handler_1 = require("./location.service-handler");
Object.defineProperty(exports, "LocationServiceHandler", { enumerable: true, get: function () { return location_service_handler_1.LocationServiceHandler; } });
//# sourceMappingURL=index.js.map