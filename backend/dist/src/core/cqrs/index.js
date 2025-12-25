"use strict";
/**
 * CQRS Module - Barrel Export
 * Command Query Responsibility Segregation Infrastructure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeQueryBus = exports.getQueryBus = exports.QueryBus = exports.initializeCommandBus = exports.getCommandBus = exports.CommandBus = void 0;
// Command Bus
var command_bus_1 = require("./command-bus");
Object.defineProperty(exports, "CommandBus", { enumerable: true, get: function () { return command_bus_1.CommandBus; } });
Object.defineProperty(exports, "getCommandBus", { enumerable: true, get: function () { return command_bus_1.getCommandBus; } });
Object.defineProperty(exports, "initializeCommandBus", { enumerable: true, get: function () { return command_bus_1.initializeCommandBus; } });
// Query Bus
var query_bus_1 = require("./query-bus");
Object.defineProperty(exports, "QueryBus", { enumerable: true, get: function () { return query_bus_1.QueryBus; } });
Object.defineProperty(exports, "getQueryBus", { enumerable: true, get: function () { return query_bus_1.getQueryBus; } });
Object.defineProperty(exports, "initializeQueryBus", { enumerable: true, get: function () { return query_bus_1.initializeQueryBus; } });
//# sourceMappingURL=index.js.map