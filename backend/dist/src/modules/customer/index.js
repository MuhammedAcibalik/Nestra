"use strict";
/**
 * Customer Module - Barrel Export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = exports.CustomerService = exports.CustomerRepository = void 0;
var customer_repository_1 = require("./customer.repository");
Object.defineProperty(exports, "CustomerRepository", { enumerable: true, get: function () { return customer_repository_1.CustomerRepository; } });
var customer_service_1 = require("./customer.service");
Object.defineProperty(exports, "CustomerService", { enumerable: true, get: function () { return customer_service_1.CustomerService; } });
var customer_controller_1 = require("./customer.controller");
Object.defineProperty(exports, "CustomerController", { enumerable: true, get: function () { return customer_controller_1.CustomerController; } });
//# sourceMappingURL=index.js.map