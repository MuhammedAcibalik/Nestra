"use strict";
/**
 * Order Module - Barrel Export
 * Following standard module structure with CQRS
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
exports.OrderServiceHandler = exports.OrderEventHandler = exports.OrderTemplateService = exports.OrderImportService = exports.getErrorMessage = exports.toOrderItemDto = exports.toOrderDto = exports.createOrderController = exports.OrderController = exports.OrderService = exports.OrderRepository = void 0;
// ==================== CQRS ====================
__exportStar(require("./cqrs"), exports);
// ==================== REPOSITORY ====================
var order_repository_1 = require("./order.repository");
Object.defineProperty(exports, "OrderRepository", { enumerable: true, get: function () { return order_repository_1.OrderRepository; } });
// ==================== SERVICE ====================
var order_service_1 = require("./order.service");
Object.defineProperty(exports, "OrderService", { enumerable: true, get: function () { return order_service_1.OrderService; } });
// ==================== CONTROLLER ====================
var order_controller_1 = require("./order.controller");
Object.defineProperty(exports, "OrderController", { enumerable: true, get: function () { return order_controller_1.OrderController; } });
Object.defineProperty(exports, "createOrderController", { enumerable: true, get: function () { return order_controller_1.createOrderController; } });
// ==================== MAPPER ====================
var order_mapper_1 = require("./order.mapper");
Object.defineProperty(exports, "toOrderDto", { enumerable: true, get: function () { return order_mapper_1.toOrderDto; } });
Object.defineProperty(exports, "toOrderItemDto", { enumerable: true, get: function () { return order_mapper_1.toOrderItemDto; } });
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return order_mapper_1.getErrorMessage; } });
// ==================== SPECIALIZED SERVICES ====================
var order_import_service_1 = require("./order-import.service");
Object.defineProperty(exports, "OrderImportService", { enumerable: true, get: function () { return order_import_service_1.OrderImportService; } });
var order_template_service_1 = require("./order-template.service");
Object.defineProperty(exports, "OrderTemplateService", { enumerable: true, get: function () { return order_template_service_1.OrderTemplateService; } });
// ==================== MICROSERVICE ====================
var order_event_handler_1 = require("./order.event-handler");
Object.defineProperty(exports, "OrderEventHandler", { enumerable: true, get: function () { return order_event_handler_1.OrderEventHandler; } });
var order_service_handler_1 = require("./order.service-handler");
Object.defineProperty(exports, "OrderServiceHandler", { enumerable: true, get: function () { return order_service_handler_1.OrderServiceHandler; } });
//# sourceMappingURL=index.js.map