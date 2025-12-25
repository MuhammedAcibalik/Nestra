/**
 * Infrastructure Layer Barrel Export
 */

export { OptimizationEventEmitter, optimizationEventEmitter, IOptimizationEventEmitter } from './optimization.events';

// Re-export repository (stays in original location for backward compatibility)
export {
    OptimizationRepository,
    IOptimizationRepository,
    ScenarioWithRelations,
    PlanWithRelations
} from '../optimization.repository';
