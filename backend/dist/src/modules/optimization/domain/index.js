"use strict";
/**
 * Domain Layer Barrel Export
 * Re-exports existing engine for backward compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyExecutor = exports.OptimizationEngine = void 0;
// Re-export from existing engine
var optimization_engine_1 = require("../optimization.engine");
Object.defineProperty(exports, "OptimizationEngine", { enumerable: true, get: function () { return optimization_engine_1.OptimizationEngine; } });
// Export strategy executor (new)
var strategy_executor_1 = require("./strategy-executor");
Object.defineProperty(exports, "StrategyExecutor", { enumerable: true, get: function () { return strategy_executor_1.StrategyExecutor; } });
//# sourceMappingURL=index.js.map