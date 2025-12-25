/**
 * Optimization Module - Barrel Export
 * Production-ready with clean architecture
 */

// ==================== INTERFACES ====================
export * from './interfaces';

// ==================== DOMAIN ====================
// Export from domain layer - re-exports existing engine
export { StrategyExecutor } from './domain';

// ==================== STRATEGIES ====================
export { AlgorithmRegistry, getAlgorithmRegistry, FFDStrategy, BFDStrategy, BottomLeftStrategy, GuillotineStrategy } from './strategies';

// ==================== APPLICATION ====================
export { OptimizationFacade, OptimizationValidator } from './application';

// ==================== INFRASTRUCTURE ====================
export { OptimizationEventEmitter, optimizationEventEmitter } from './infrastructure';
export { OptimizationRepository, IOptimizationRepository, ScenarioWithRelations, PlanWithRelations } from './optimization.repository';

// ==================== LEGACY (Backward Compatibility) ====================
export { OptimizationEngine, OptimizationInput, OptimizationOutput, OptimizationParameters, PlanData, LayoutData } from './optimization.engine';
export { OptimizationService } from './optimization.service';
export { OptimizationController, createOptimizationController, ScenarioController, createScenarioController, PlanController, createPlanController } from './optimization.controller';
export { OptimizationStrategyRegistry, I1DOptimizationStrategy, I2DOptimizationStrategy } from './optimization.strategy';

// ==================== MICROSERVICE ====================
export { OptimizationServiceHandler } from './optimization.service-handler';
export { OptimizationEventHandler } from './optimization.event-handler';
