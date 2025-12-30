"use strict";
/**
 * Customer Module - Barrel Export
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
exports.CustomerServiceHandler = exports.CustomerController = exports.CustomerService = exports.CustomerRepository = void 0;
// ==================== INTERFACES ====================
__exportStar(require("./interfaces"), exports);
// ==================== REPOSITORY ====================
var customer_repository_1 = require("./customer.repository");
Object.defineProperty(exports, "CustomerRepository", { enumerable: true, get: function () { return customer_repository_1.CustomerRepository; } });
// ==================== SERVICE ====================
var customer_service_1 = require("./customer.service");
Object.defineProperty(exports, "CustomerService", { enumerable: true, get: function () { return customer_service_1.CustomerService; } });
// ==================== CONTROLLER ====================
var customer_controller_1 = require("./customer.controller");
Object.defineProperty(exports, "CustomerController", { enumerable: true, get: function () { return customer_controller_1.CustomerController; } });
// ==================== MICROSERVICE ====================
var customer_service_handler_1 = require("./customer.service-handler");
Object.defineProperty(exports, "CustomerServiceHandler", { enumerable: true, get: function () { return customer_service_handler_1.CustomerServiceHandler; } });
//# sourceMappingURL=index.js.map