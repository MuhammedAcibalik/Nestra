/**
 * A/B Testing and Advanced Experiment Domain Types
 */

export type ExperimentStatus = 'active' | 'paused' | 'completed';
export type ScopeType = 'global' | 'tenant';
export type VariantType = 'control' | 'variant';

// ==================== EXPERIMENT TYPES ====================

export type ExperimentType = 'ab_test' | 'mab_epsilon' | 'mab_ucb' | 'mab_thompson' | 'canary';

export type MABStrategy = 'epsilon_greedy' | 'ucb' | 'thompson_sampling';

// ==================== A/B TEST CONFIG ====================

export interface IExperimentConfig {
    modelType: string;
    experimentType?: ExperimentType;
    scopeType: ScopeType;
    scopeTenantId?: string;
    controlModelId: string;
    variantModelId: string;
    allocationBasisPoints: number; // 0-10000
    salt: string;
    startDate?: Date;
    endDate?: Date;
    // MAB specific
    mabEpsilon?: number; // For epsilon-greedy (e.g., 0.1 = 10% exploration)
    // Canary specific
    canaryConfig?: ICanaryConfig;
}

export interface IActiveExperiment {
    id: string;
    modelType: string;
    experimentType: ExperimentType;
    scopeType: ScopeType;
    scopeTenantId: string | null;
    controlModelId: string;
    variantModelId: string;
    allocationBasisPoints: number;
    salt: string;
    startDate: Date;
    endDate: Date | null;
    mabState?: IMABState;
    canaryState?: ICanaryState;
}

export interface IBucketingResult {
    bucket: number; // 0-9999
    variant: VariantType;
}

export interface IExperimentResolution {
    experiment: IActiveExperiment | null;
    assignedVariant: VariantType | null;
    unitKey: string;
}

// ==================== MULTI-ARM BANDIT (MAB) ====================

export interface IMABArmStats {
    armId: VariantType;
    pulls: number;           // Number of times this arm was selected
    rewards: number;         // Cumulative reward sum
    avgReward: number;       // rewards / pulls
    ucbScore?: number;       // UCB upper confidence bound
    thompsonAlpha?: number;  // Thompson sampling alpha
    thompsonBeta?: number;   // Thompson sampling beta
}

export interface IMABState {
    strategy: MABStrategy;
    epsilon?: number;        // For epsilon-greedy
    totalPulls: number;
    arms: IMABArmStats[];
    lastUpdated: Date;
}

export interface IMABRewardInput {
    experimentId: string;
    unitKey: string;
    arm: VariantType;
    reward: number;  // 0-1 normalized reward
}

// ==================== CANARY DEPLOYMENT ====================

export type CanaryStage = 'initial' | 'ramp_1' | 'ramp_5' | 'ramp_25' | 'ramp_50' | 'full' | 'rolled_back';

export const CANARY_TRAFFIC_MAP: Record<CanaryStage, number> = {
    initial: 0,
    ramp_1: 100,      // 1% = 100 basis points
    ramp_5: 500,      // 5%
    ramp_25: 2500,    // 25%
    ramp_50: 5000,    // 50%
    full: 10000,      // 100%
    rolled_back: 0
};

export interface ICanaryConfig {
    errorThreshold: number;     // Error rate threshold for rollback (e.g., 0.05 = 5%)
    minSamplesPerStage: number; // Minimum samples before advancing
    autoAdvance: boolean;       // Auto-advance if healthy
    advanceDelayMs: number;     // Delay between stages in ms
}

export interface ICanaryState {
    stage: CanaryStage;
    trafficBasisPoints: number;
    errorThreshold: number;
    samplesInStage: number;
    errorsInStage: number;
    currentErrorRate: number;
    startedAt: Date;
    lastStageChange: Date;
    promotedAt?: Date;
    rolledBackAt?: Date;
    rollbackReason?: string;
}
