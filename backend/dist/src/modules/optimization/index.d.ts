/**
 * Optimization Module - Barrel Export
 * Production-ready with clean architecture
 */
export * from './interfaces';
export { StrategyExecutor } from './domain';
export { AlgorithmRegistry, getAlgorithmRegistry, FFDStrategy, BFDStrategy, BottomLeftStrategy, GuillotineStrategy } from './strategies';
export { OptimizationFacade, OptimizationValidator } from './application';
export { OptimizationEventEmitter, optimizationEventEmitter } from './infrastructure';
export { OptimizationRepository, IOptimizationRepository, ScenarioWithRelations, PlanWithRelations } from './optimization.repository';
export { OptimizationEngine, OptimizationInput, OptimizationOutput, OptimizationParameters, PlanData, LayoutData } from './optimization.engine';
export { OptimizationService } from './optimization.service';
export { OptimizationController, createOptimizationController, ScenarioController, createScenarioController, PlanController, createPlanController } from './optimization.controller';
export { OptimizationStrategyRegistry, I1DOptimizationStrategy, I2DOptimizationStrategy } from './optimization.strategy';
export { OptimizationServiceHandler } from './optimization.service-handler';
export { OptimizationEventHandler } from './optimization.event-handler';
//# sourceMappingURL=index.d.ts.map