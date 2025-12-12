"use strict";
/**
 * Customer Module - Barrel Export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerServiceHandler = exports.CustomerController = exports.CustomerService = exports.CustomerRepository = void 0;
var customer_repository_1 = require("./customer.repository");
Object.defineProperty(exports, "CustomerRepository", { enumerable: true, get: function () { return customer_repository_1.CustomerRepository; } });
var customer_service_1 = require("./customer.service");
Object.defineProperty(exports, "CustomerService", { enumerable: true, get: function () { return customer_service_1.CustomerService; } });
var customer_controller_1 = require("./customer.controller");
Object.defineProperty(exports, "CustomerController", { enumerable: true, get: function () { return customer_controller_1.CustomerController; } });
// Microservice
var customer_service_handler_1 = require("./customer.service-handler");
Object.defineProperty(exports, "CustomerServiceHandler", { enumerable: true, get: function () { return customer_service_handler_1.CustomerServiceHandler; } });
//# sourceMappingURL=index.js.map