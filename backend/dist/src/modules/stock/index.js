"use strict";
/**
 * Stock Module - Barrel Export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockEventHandler = exports.StockServiceHandler = exports.createStockController = exports.StockController = exports.StockService = exports.StockRepository = void 0;
var stock_repository_1 = require("./stock.repository");
Object.defineProperty(exports, "StockRepository", { enumerable: true, get: function () { return stock_repository_1.StockRepository; } });
var stock_service_1 = require("./stock.service");
Object.defineProperty(exports, "StockService", { enumerable: true, get: function () { return stock_service_1.StockService; } });
var stock_controller_1 = require("./stock.controller");
Object.defineProperty(exports, "StockController", { enumerable: true, get: function () { return stock_controller_1.StockController; } });
Object.defineProperty(exports, "createStockController", { enumerable: true, get: function () { return stock_controller_1.createStockController; } });
// Microservice
var stock_service_handler_1 = require("./stock.service-handler");
Object.defineProperty(exports, "StockServiceHandler", { enumerable: true, get: function () { return stock_service_handler_1.StockServiceHandler; } });
var stock_event_handler_1 = require("./stock.event-handler");
Object.defineProperty(exports, "StockEventHandler", { enumerable: true, get: function () { return stock_event_handler_1.StockEventHandler; } });
//# sourceMappingURL=index.js.map