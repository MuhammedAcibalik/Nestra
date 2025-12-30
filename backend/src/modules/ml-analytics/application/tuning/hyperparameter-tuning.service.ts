/**
 * Hyperparameter Tuning Service
 * Automated hyperparameter search for ML models
 * 
 * Features:
 * - Grid search
 * - Random search
 * - Bayesian optimization (simplified)
 * - Trial tracking and best model selection
 */

import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult, MLModelType } from '../../domain';
import { PythonBridgeService } from '../../infrastructure/python/python-bridge.service';
import path from 'path';

const logger = createModuleLogger('HyperparameterTuning');

// ==================== TYPES ====================

export type SearchStrategy = 'grid' | 'random' | 'bayesian';

export interface IHyperparameterSpace {
    /** Parameter name */
    name: string;
    /** Type of parameter */
    type: 'int' | 'float' | 'choice';
    /** For int/float: [min, max] */
    range?: [number, number];
    /** For choice: list of options */
    choices?: (string | number | boolean)[];
    /** Step size for grid search */
    step?: number;
    /** Log scale for float */
    logScale?: boolean;
}

export interface ITuningConfig {
    /** Model type to tune */
    modelType: MLModelType;
    /** Search strategy */
    strategy: SearchStrategy;
    /** Parameter space */
    parameterSpace: IHyperparameterSpace[];
    /** Max trials */
    maxTrials: number;
    /** Validation metric to optimize */
    metric: 'val_loss' | 'val_accuracy' | 'mae' | 'mse';
    /** Minimize or maximize metric */
    direction: 'minimize' | 'maximize';
    /** Early stopping patience per trial */
    earlyStoppingPatience?: number;
    /** Max epochs per trial */
    maxEpochsPerTrial?: number;
    /** Path to training data */
    trainingDataPath: string;
}

export interface ITrial {
    /** Trial ID */
    id: string;
    /** Hyperparameters used */
    params: Record<string, number | string | boolean>;
    /** Metric value achieved */
    metricValue: number;
    /** Training time in seconds */
    trainingTimeSeconds: number;
    /** Trial status */
    status: 'pending' | 'running' | 'completed' | 'failed';
    /** Model path if saved */
    modelPath?: string;
    /** Error message if failed */
    error?: string;
}

export interface ITuningResult {
    /** Best trial */
    bestTrial: ITrial;
    /** All trials */
    allTrials: ITrial[];
    /** Total tuning time */
    totalTimeSeconds: number;
    /** Configuration used */
    config: ITuningConfig;
}

// ==================== SERVICE ====================

export class HyperparameterTuningService {
    private readonly pythonBridge: PythonBridgeService;
    private readonly modelsDir: string;
    private currentTrials: Map<string, ITrial> = new Map();

    constructor() {
        this.pythonBridge = new PythonBridgeService();
        this.modelsDir = path.join(process.cwd(), 'models', 'tuning');
    }

    // ==================== PUBLIC API ====================

    /**
     * Run hyperparameter tuning
     */
    async tune(config: ITuningConfig): Promise<IServiceResult<ITuningResult>> {
        const startTime = Date.now();

        logger.info('Starting hyperparameter tuning', {
            modelType: config.modelType,
            strategy: config.strategy,
            maxTrials: config.maxTrials
        });

        try {
            // Generate parameter combinations
            const paramCombinations = this.generateCombinations(config);
            const trials: ITrial[] = [];
            let bestTrial: ITrial | null = null;

            for (let i = 0; i < Math.min(paramCombinations.length, config.maxTrials); i++) {
                const params = paramCombinations[i];
                const trialId = `trial_${i + 1}`;

                const trial = await this.runTrial(config, params, trialId);
                trials.push(trial);
                this.currentTrials.set(trialId, trial);

                // Update best trial
                if (trial.status === 'completed') {
                    if (!bestTrial || this.isBetter(trial, bestTrial, config.direction)) {
                        bestTrial = trial;
                        logger.info('New best trial found', {
                            trialId,
                            metricValue: trial.metricValue,
                            params
                        });
                    }
                }
            }

            if (!bestTrial) {
                return { success: false, error: 'No successful trials completed' };
            }

            const result: ITuningResult = {
                bestTrial,
                allTrials: trials,
                totalTimeSeconds: (Date.now() - startTime) / 1000,
                config
            };

            logger.info('Hyperparameter tuning complete', {
                bestTrialId: bestTrial.id,
                bestMetric: bestTrial.metricValue,
                totalTrials: trials.length,
                successfulTrials: trials.filter(t => t.status === 'completed').length
            });

            return { success: true, data: result };

        } catch (error) {
            logger.error('Tuning failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Tuning failed'
            };
        }
    }

    /**
     * Get current trial status
     */
    getTrialStatus(trialId: string): ITrial | undefined {
        return this.currentTrials.get(trialId);
    }

    /**
     * Get all current trials
     */
    getAllTrials(): ITrial[] {
        return Array.from(this.currentTrials.values());
    }

    // ==================== INTERNAL METHODS ====================

    private async runTrial(
        config: ITuningConfig,
        params: Record<string, number | string | boolean>,
        trialId: string
    ): Promise<ITrial> {
        const trial: ITrial = {
            id: trialId,
            params,
            metricValue: 0,
            trainingTimeSeconds: 0,
            status: 'running'
        };

        const startTime = Date.now();

        try {
            // Build hyperparameters for Python training script
            const hyperparams = {
                ...params,
                epochs: config.maxEpochsPerTrial ?? 50,
                early_stopping_patience: config.earlyStoppingPatience ?? 10
            };

            // Output path for this trial
            const outputPath = path.join(this.modelsDir, config.modelType, trialId);

            // Run training via Python bridge
            const result = await this.pythonBridge.trainModel(
                config.modelType,
                config.trainingDataPath,
                outputPath,
                hyperparams
            );

            trial.trainingTimeSeconds = (Date.now() - startTime) / 1000;

            if (result.success && result.data) {
                // Parse metric from stdout
                trial.metricValue = this.parseMetricFromOutput(result.data.stdout, config.metric);
                trial.status = 'completed';
                trial.modelPath = outputPath;
            } else {
                trial.status = 'failed';
                trial.error = result.error;
            }

        } catch (error) {
            trial.status = 'failed';
            trial.error = error instanceof Error ? error.message : 'Trial failed';
            trial.trainingTimeSeconds = (Date.now() - startTime) / 1000;
        }

        return trial;
    }

    private generateCombinations(config: ITuningConfig): Array<Record<string, number | string | boolean>> {
        switch (config.strategy) {
            case 'grid':
                return this.generateGridCombinations(config.parameterSpace);

            case 'random':
                return this.generateRandomCombinations(config.parameterSpace, config.maxTrials);

            case 'bayesian':
                // Simplified: start with random, real impl would use GP
                return this.generateRandomCombinations(config.parameterSpace, config.maxTrials);

            default:
                return [];
        }
    }

    private generateGridCombinations(
        space: IHyperparameterSpace[]
    ): Array<Record<string, number | string | boolean>> {
        if (space.length === 0) return [{}];

        const [first, ...rest] = space;
        const restCombinations = this.generateGridCombinations(rest);
        const result: Array<Record<string, number | string | boolean>> = [];

        const values = this.getParameterValues(first, 'grid');

        for (const value of values) {
            for (const combo of restCombinations) {
                result.push({ [first.name]: value, ...combo });
            }
        }

        return result;
    }

    private generateRandomCombinations(
        space: IHyperparameterSpace[],
        count: number
    ): Array<Record<string, number | string | boolean>> {
        const result: Array<Record<string, number | string | boolean>> = [];

        for (let i = 0; i < count; i++) {
            const combo: Record<string, number | string | boolean> = {};
            for (const param of space) {
                combo[param.name] = this.sampleParameter(param);
            }
            result.push(combo);
        }

        return result;
    }

    private getParameterValues(param: IHyperparameterSpace, strategy: string): (number | string | boolean)[] {
        if (param.type === 'choice' && param.choices) {
            return param.choices;
        }

        if ((param.type === 'int' || param.type === 'float') && param.range) {
            const [min, max] = param.range;
            const step = param.step ?? (param.type === 'int' ? 1 : (max - min) / 5);
            const values: number[] = [];

            if (param.logScale) {
                const logMin = Math.log10(min);
                const logMax = Math.log10(max);
                const logStep = (logMax - logMin) / 5;
                for (let logVal = logMin; logVal <= logMax; logVal += logStep) {
                    values.push(Math.pow(10, logVal));
                }
            } else {
                for (let val = min; val <= max; val += step) {
                    values.push(param.type === 'int' ? Math.round(val) : val);
                }
            }

            return values;
        }

        return [];
    }

    private sampleParameter(param: IHyperparameterSpace): number | string | boolean {
        if (param.type === 'choice' && param.choices) {
            return param.choices[Math.floor(Math.random() * param.choices.length)];
        }

        if ((param.type === 'int' || param.type === 'float') && param.range) {
            const [min, max] = param.range;

            if (param.logScale) {
                const logMin = Math.log10(min);
                const logMax = Math.log10(max);
                const logVal = logMin + Math.random() * (logMax - logMin);
                const val = Math.pow(10, logVal);
                return param.type === 'int' ? Math.round(val) : val;
            }

            const val = min + Math.random() * (max - min);
            return param.type === 'int' ? Math.round(val) : val;
        }

        return 0;
    }

    private parseMetricFromOutput(stdout: string, metric: string): number {
        // Look for metric in output (e.g., "val_loss: 0.0234")
        const regex = new RegExp(`${metric}[:\\s]+([0-9.]+)`, 'i');
        const match = stdout.match(regex);

        if (match && match[1]) {
            return parseFloat(match[1]);
        }

        // Try to parse JSON output
        try {
            const jsonMatch = stdout.match(/\{[^}]+\}/g);
            if (jsonMatch) {
                for (const json of jsonMatch.reverse()) {
                    const parsed = JSON.parse(json);
                    if (parsed[metric] !== undefined) {
                        return parsed[metric];
                    }
                }
            }
        } catch {
            // Ignore parse errors
        }

        return 0;
    }

    private isBetter(trial: ITrial, best: ITrial, direction: 'minimize' | 'maximize'): boolean {
        if (direction === 'minimize') {
            return trial.metricValue < best.metricValue;
        }
        return trial.metricValue > best.metricValue;
    }
}

// ==================== FACTORY ====================

let tuningServiceInstance: HyperparameterTuningService | null = null;

export function getHyperparameterTuningService(): HyperparameterTuningService {
    if (!tuningServiceInstance) {
        tuningServiceInstance = new HyperparameterTuningService();
    }
    return tuningServiceInstance;
}
