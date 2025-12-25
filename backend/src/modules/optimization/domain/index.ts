/**
 * Domain Layer Barrel Export
 * Re-exports existing engine for backward compatibility
 */

// Re-export from existing engine
export {
    OptimizationEngine,
    OptimizationInput,
    OptimizationOutput,
    OptimizationParameters,
    PlanData,
    LayoutData
} from '../optimization.engine';

// Export strategy executor (new)
export { StrategyExecutor, IExecutionResult } from './strategy-executor';
