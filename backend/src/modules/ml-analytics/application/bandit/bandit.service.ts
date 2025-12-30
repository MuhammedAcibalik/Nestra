/**
 * Bandit Service
 * Multi-Arm Bandit experiment strategies
 * Supports: Epsilon-Greedy, UCB (Upper Confidence Bound), Thompson Sampling
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { mlExperiments } from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';
import {
    VariantType,
    MABStrategy,
    IMABState,
    IMABArmStats,
    IMABRewardInput,
    IActiveExperiment
} from '../../domain';

const logger = createModuleLogger('BanditService');

// ==================== TYPES ====================

type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// ==================== SERVICE ====================

export class BanditService {
    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) { }

    // ==================== ARM SELECTION ====================

    /**
     * Select which arm to pull based on the MAB strategy
     */
    async selectArm(experimentId: string): Promise<IServiceResult<VariantType>> {
        try {
            const experiment = await this.getExperiment(experimentId);
            if (!experiment) {
                return { success: false, error: 'Experiment not found' };
            }

            if (!experiment.mabState) {
                // Initialize MAB state if not exists
                const initialState = this.createInitialState('epsilon_greedy', 0.1);
                await this.updateMABState(experimentId, initialState);
                // First selection is always exploration (control)
                return { success: true, data: 'control' };
            }

            const state = experiment.mabState;
            let selectedArm: VariantType;

            switch (state.strategy) {
                case 'epsilon_greedy':
                    selectedArm = this.selectEpsilonGreedy(state);
                    break;
                case 'ucb':
                    selectedArm = this.selectUCB(state);
                    break;
                case 'thompson_sampling':
                    selectedArm = this.selectThompsonSampling(state);
                    break;
                default:
                    selectedArm = 'control';
            }

            logger.debug('Arm selected', {
                experimentId,
                strategy: state.strategy,
                selectedArm,
                totalPulls: state.totalPulls
            });

            return { success: true, data: selectedArm };
        } catch (error) {
            logger.error('Failed to select arm', { experimentId, error });
            return { success: false, error: 'Failed to select arm' };
        }
    }

    /**
     * Epsilon-Greedy: With probability epsilon, explore; otherwise exploit
     */
    private selectEpsilonGreedy(state: IMABState): VariantType {
        const epsilon = state.epsilon ?? 0.1;

        // Exploration
        if (Math.random() < epsilon) {
            return Math.random() < 0.5 ? 'control' : 'variant';
        }

        // Exploitation: select arm with highest average reward
        const controlArm = state.arms.find(a => a.armId === 'control');
        const variantArm = state.arms.find(a => a.armId === 'variant');

        if (!controlArm || !variantArm || controlArm.pulls === 0 || variantArm.pulls === 0) {
            // Not enough data, explore
            return state.totalPulls % 2 === 0 ? 'control' : 'variant';
        }

        return controlArm.avgReward >= variantArm.avgReward ? 'control' : 'variant';
    }

    /**
     * UCB: Select arm with highest upper confidence bound
     * UCB formula: avgReward + sqrt(2 * ln(totalPulls) / arm.pulls)
     */
    private selectUCB(state: IMABState): VariantType {
        if (state.totalPulls < 2) {
            // Pull each arm at least once
            return state.totalPulls === 0 ? 'control' : 'variant';
        }

        const controlArm = state.arms.find(a => a.armId === 'control');
        const variantArm = state.arms.find(a => a.armId === 'variant');

        if (!controlArm || !variantArm || controlArm.pulls === 0 || variantArm.pulls === 0) {
            return controlArm?.pulls === 0 ? 'control' : 'variant';
        }

        const c = Math.sqrt(2); // Exploration constant
        const logTotal = Math.log(state.totalPulls);

        const controlUCB = controlArm.avgReward + c * Math.sqrt(logTotal / controlArm.pulls);
        const variantUCB = variantArm.avgReward + c * Math.sqrt(logTotal / variantArm.pulls);

        return controlUCB >= variantUCB ? 'control' : 'variant';
    }

    /**
     * Thompson Sampling: Sample from Beta distributions
     * Beta(alpha, beta) where alpha = successes + 1, beta = failures + 1
     */
    private selectThompsonSampling(state: IMABState): VariantType {
        const controlArm = state.arms.find(a => a.armId === 'control');
        const variantArm = state.arms.find(a => a.armId === 'variant');

        const controlAlpha = controlArm?.thompsonAlpha ?? 1;
        const controlBeta = controlArm?.thompsonBeta ?? 1;
        const variantAlpha = variantArm?.thompsonAlpha ?? 1;
        const variantBeta = variantArm?.thompsonBeta ?? 1;

        const controlSample = this.sampleBeta(controlAlpha, controlBeta);
        const variantSample = this.sampleBeta(variantAlpha, variantBeta);

        return controlSample >= variantSample ? 'control' : 'variant';
    }

    /**
     * Sample from Beta distribution using Jöhnk's algorithm
     */
    private sampleBeta(alpha: number, beta: number): number {
        // Simple approximation for beta sampling
        const gammaAlpha = this.sampleGamma(alpha);
        const gammaBeta = this.sampleGamma(beta);
        return gammaAlpha / (gammaAlpha + gammaBeta);
    }

    /**
     * Sample from Gamma distribution (simplified)
     */
    private sampleGamma(shape: number): number {
        if (shape < 1) {
            return this.sampleGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
        }

        const d = shape - 1 / 3;
        const c = 1 / Math.sqrt(9 * d);

        while (true) {
            let x: number;
            let v: number;

            do {
                x = this.sampleNormal();
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            const u = Math.random();

            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v;
            }

            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v;
            }
        }
    }

    /**
     * Box-Muller transform for normal sampling
     */
    private sampleNormal(): number {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    // ==================== REWARD RECORDING ====================

    /**
     * Record a reward for an arm
     */
    async recordReward(input: IMABRewardInput): Promise<IServiceResult<void>> {
        try {
            const experiment = await this.getExperiment(input.experimentId);
            if (!experiment) {
                return { success: false, error: 'Experiment not found' };
            }

            const state = experiment.mabState ?? this.createInitialState('epsilon_greedy', 0.1);
            const arm = state.arms.find(a => a.armId === input.arm);

            if (!arm) {
                return { success: false, error: 'Arm not found in state' };
            }

            // Update arm stats
            arm.pulls += 1;
            arm.rewards += input.reward;
            arm.avgReward = arm.rewards / arm.pulls;

            // Update Thompson sampling parameters
            if (state.strategy === 'thompson_sampling') {
                // Assuming binary reward (0 or 1)
                arm.thompsonAlpha = (arm.thompsonAlpha ?? 1) + input.reward;
                arm.thompsonBeta = (arm.thompsonBeta ?? 1) + (1 - input.reward);
            }

            state.totalPulls += 1;
            state.lastUpdated = new Date();

            await this.updateMABState(input.experimentId, state);

            logger.debug('Reward recorded', {
                experimentId: input.experimentId,
                arm: input.arm,
                reward: input.reward,
                newAvgReward: arm.avgReward
            });

            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to record reward', { input, error });
            return { success: false, error: 'Failed to record reward' };
        }
    }

    // ==================== STATE MANAGEMENT ====================

    /**
     * Get arm statistics for an experiment
     */
    async getArmStats(experimentId: string): Promise<IServiceResult<IMABArmStats[]>> {
        try {
            const experiment = await this.getExperiment(experimentId);
            if (!experiment) {
                return { success: false, error: 'Experiment not found' };
            }

            if (!experiment.mabState) {
                return { success: true, data: [] };
            }

            return { success: true, data: experiment.mabState.arms };
        } catch (error) {
            logger.error('Failed to get arm stats', { experimentId, error });
            return { success: false, error: 'Failed to get arm stats' };
        }
    }

    /**
     * Initialize MAB state for an experiment
     */
    async initializeMAB(
        experimentId: string,
        strategy: MABStrategy,
        epsilon?: number
    ): Promise<IServiceResult<IMABState>> {
        try {
            const state = this.createInitialState(strategy, epsilon);
            await this.updateMABState(experimentId, state);
            return { success: true, data: state };
        } catch (error) {
            logger.error('Failed to initialize MAB', { experimentId, error });
            return { success: false, error: 'Failed to initialize MAB' };
        }
    }

    private createInitialState(strategy: MABStrategy, epsilon?: number): IMABState {
        return {
            strategy,
            epsilon: strategy === 'epsilon_greedy' ? (epsilon ?? 0.1) : undefined,
            totalPulls: 0,
            arms: [
                {
                    armId: 'control',
                    pulls: 0,
                    rewards: 0,
                    avgReward: 0,
                    thompsonAlpha: 1,
                    thompsonBeta: 1
                },
                {
                    armId: 'variant',
                    pulls: 0,
                    rewards: 0,
                    avgReward: 0,
                    thompsonAlpha: 1,
                    thompsonBeta: 1
                }
            ],
            lastUpdated: new Date()
        };
    }

    private async getExperiment(experimentId: string): Promise<IActiveExperiment | null> {
        const rows = await this.db
            .select()
            .from(mlExperiments)
            .where(eq(mlExperiments.id, experimentId))
            .limit(1);

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            modelType: row.modelType,
            experimentType: (row as Record<string, unknown>).experimentType as IActiveExperiment['experimentType'] ?? 'ab_test',
            scopeType: row.scopeType,
            scopeTenantId: row.scopeTenantId,
            controlModelId: row.controlModelId,
            variantModelId: row.variantModelId,
            allocationBasisPoints: row.allocationBasisPoints,
            salt: row.salt,
            startDate: row.startDate,
            endDate: row.endDate,
            mabState: (row as Record<string, unknown>).mabState as IMABState | undefined,
            canaryState: undefined
        };
    }

    private async updateMABState(experimentId: string, state: IMABState): Promise<void> {
        await this.db.update(mlExperiments)
            .set({ mabState: state } as Record<string, unknown>)
            .where(eq(mlExperiments.id, experimentId));
        logger.debug('MAB state persisted', { experimentId, totalPulls: state.totalPulls });
    }
}
