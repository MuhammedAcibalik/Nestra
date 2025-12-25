"use strict";
/**
 * Optimization Module - Barrel Export
 * Production-ready with clean architecture
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
exports.OptimizationEventHandler = exports.OptimizationServiceHandler = exports.OptimizationStrategyRegistry = exports.createPlanController = exports.PlanController = exports.createScenarioController = exports.ScenarioController = exports.createOptimizationController = exports.OptimizationController = exports.OptimizationService = exports.OptimizationEngine = exports.OptimizationRepository = exports.optimizationEventEmitter = exports.OptimizationEventEmitter = exports.OptimizationValidator = exports.OptimizationFacade = exports.GuillotineStrategy = exports.BottomLeftStrategy = exports.BFDStrategy = exports.FFDStrategy = exports.getAlgorithmRegistry = exports.AlgorithmRegistry = exports.StrategyExecutor = void 0;
// ==================== INTERFACES ====================
__exportStar(require("./interfaces"), exports);
// ==================== DOMAIN ====================
// Export from domain layer - re-exports existing engine
var domain_1 = require("./domain");
Object.defineProperty(exports, "StrategyExecutor", { enumerable: true, get: function () { return domain_1.StrategyExecutor; } });
// ==================== STRATEGIES ====================
var strategies_1 = require("./strategies");
Object.defineProperty(exports, "AlgorithmRegistry", { enumerable: true, get: function () { return strategies_1.AlgorithmRegistry; } });
Object.defineProperty(exports, "getAlgorithmRegistry", { enumerable: true, get: function () { return strategies_1.getAlgorithmRegistry; } });
Object.defineProperty(exports, "FFDStrategy", { enumerable: true, get: function () { return strategies_1.FFDStrategy; } });
Object.defineProperty(exports, "BFDStrategy", { enumerable: true, get: function () { return strategies_1.BFDStrategy; } });
Object.defineProperty(exports, "BottomLeftStrategy", { enumerable: true, get: function () { return strategies_1.BottomLeftStrategy; } });
Object.defineProperty(exports, "GuillotineStrategy", { enumerable: true, get: function () { return strategies_1.GuillotineStrategy; } });
// ==================== APPLICATION ====================
var application_1 = require("./application");
Object.defineProperty(exports, "OptimizationFacade", { enumerable: true, get: function () { return application_1.OptimizationFacade; } });
Object.defineProperty(exports, "OptimizationValidator", { enumerable: true, get: function () { return application_1.OptimizationValidator; } });
// ==================== INFRASTRUCTURE ====================
var infrastructure_1 = require("./infrastructure");
Object.defineProperty(exports, "OptimizationEventEmitter", { enumerable: true, get: function () { return infrastructure_1.OptimizationEventEmitter; } });
Object.defineProperty(exports, "optimizationEventEmitter", { enumerable: true, get: function () { return infrastructure_1.optimizationEventEmitter; } });
var optimization_repository_1 = require("./optimization.repository");
Object.defineProperty(exports, "OptimizationRepository", { enumerable: true, get: function () { return optimization_repository_1.OptimizationRepository; } });
// ==================== LEGACY (Backward Compatibility) ====================
var optimization_engine_1 = require("./optimization.engine");
Object.defineProperty(exports, "OptimizationEngine", { enumerable: true, get: function () { return optimization_engine_1.OptimizationEngine; } });
var optimization_service_1 = require("./optimization.service");
Object.defineProperty(exports, "OptimizationService", { enumerable: true, get: function () { return optimization_service_1.OptimizationService; } });
var optimization_controller_1 = require("./optimization.controller");
Object.defineProperty(exports, "OptimizationController", { enumerable: true, get: function () { return optimization_controller_1.OptimizationController; } });
Object.defineProperty(exports, "createOptimizationController", { enumerable: true, get: function () { return optimization_controller_1.createOptimizationController; } });
Object.defineProperty(exports, "ScenarioController", { enumerable: true, get: function () { return optimization_controller_1.ScenarioController; } });
Object.defineProperty(exports, "createScenarioController", { enumerable: true, get: function () { return optimization_controller_1.createScenarioController; } });
Object.defineProperty(exports, "PlanController", { enumerable: true, get: function () { return optimization_controller_1.PlanController; } });
Object.defineProperty(exports, "createPlanController", { enumerable: true, get: function () { return optimization_controller_1.createPlanController; } });
var optimization_strategy_1 = require("./optimization.strategy");
Object.defineProperty(exports, "OptimizationStrategyRegistry", { enumerable: true, get: function () { return optimization_strategy_1.OptimizationStrategyRegistry; } });
// ==================== MICROSERVICE ====================
var optimization_service_handler_1 = require("./optimization.service-handler");
Object.defineProperty(exports, "OptimizationServiceHandler", { enumerable: true, get: function () { return optimization_service_handler_1.OptimizationServiceHandler; } });
var optimization_event_handler_1 = require("./optimization.event-handler");
Object.defineProperty(exports, "OptimizationEventHandler", { enumerable: true, get: function () { return optimization_event_handler_1.OptimizationEventHandler; } });
//# sourceMappingURL=index.js.map