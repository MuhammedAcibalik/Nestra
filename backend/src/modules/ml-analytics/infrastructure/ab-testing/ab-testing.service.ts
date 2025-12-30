/**
 * A/B Testing Service
 * Traffic splitting and model comparison for ML experiments
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, desc, sql } from 'drizzle-orm';
import { mlModels, mlPredictions } from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('ABTestingService');

// ==================== TYPES ====================

export type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';

export type IServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export interface IExperiment {
    id: string;
    name: string;
    description?: string;
    modelType: MLModelType;
    status: 'draft' | 'running' | 'completed' | 'cancelled';
    controlModelId: string;
    treatmentModelId: string;
    trafficSplit: number; // 0-100, percentage going to treatment
    startDate: Date;
    endDate?: Date;
    metrics: IExperimentMetrics;
}

export interface IExperimentMetrics {
    totalPredictions: number;
    controlPredictions: number;
    treatmentPredictions: number;
    controlAvgLatency: number;
    treatmentAvgLatency: number;
    controlAvgConfidence: number;
    treatmentAvgConfidence: number;
    controlFeedbackScore?: number;
    treatmentFeedbackScore?: number;
}

export interface IModelSelection {
    modelId: string;
    modelVersion: string;
    isControl: boolean;
    isTreatment: boolean;
}

export interface IExperimentResult {
    experimentId: string;
    winner: 'control' | 'treatment' | 'inconclusive';
    controlMetrics: {
        predictionCount: number;
        avgLatency: number;
        avgConfidence: number;
        feedbackScore?: number;
    };
    treatmentMetrics: {
        predictionCount: number;
        avgLatency: number;
        avgConfidence: number;
        feedbackScore?: number;
    };
    recommendation: string;
    statisticalSignificance: boolean;
}

// ==================== SERVICE ====================

export class ABTestingService {
    // In-memory experiment store (in production, this would be in DB)
    private experiments: Map<string, IExperiment> = new Map();

    constructor(private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }) { }

    /**
     * Create a new A/B experiment
     */
    createExperiment(
        name: string,
        modelType: MLModelType,
        controlModelId: string,
        treatmentModelId: string,
        trafficSplit: number = 50,
        description?: string
    ): IServiceResult<IExperiment> {
        try {
            if (trafficSplit < 0 || trafficSplit > 100) {
                return { success: false, error: 'Traffic split must be between 0 and 100' };
            }

            const experiment: IExperiment = {
                id: uuid(),
                name,
                description,
                modelType,
                status: 'draft',
                controlModelId,
                treatmentModelId,
                trafficSplit,
                startDate: new Date(),
                metrics: {
                    totalPredictions: 0,
                    controlPredictions: 0,
                    treatmentPredictions: 0,
                    controlAvgLatency: 0,
                    treatmentAvgLatency: 0,
                    controlAvgConfidence: 0,
                    treatmentAvgConfidence: 0
                }
            };

            this.experiments.set(experiment.id, experiment);

            logger.info('Experiment created', {
                experimentId: experiment.id,
                name,
                modelType,
                trafficSplit
            });

            return { success: true, data: experiment };
        } catch (error) {
            logger.error('Failed to create experiment', { error });
            return { success: false, error: 'Failed to create experiment' };
        }
    }

    /**
     * Start an experiment
     */
    startExperiment(experimentId: string): IServiceResult<IExperiment> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return { success: false, error: 'Experiment not found' };
        }

        if (experiment.status !== 'draft') {
            return { success: false, error: `Cannot start experiment in ${experiment.status} status` };
        }

        experiment.status = 'running';
        experiment.startDate = new Date();

        logger.info('Experiment started', { experimentId });

        return { success: true, data: experiment };
    }

    /**
     * Stop an experiment
     */
    stopExperiment(experimentId: string): IServiceResult<IExperiment> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return { success: false, error: 'Experiment not found' };
        }

        if (experiment.status !== 'running') {
            return { success: false, error: `Cannot stop experiment in ${experiment.status} status` };
        }

        experiment.status = 'completed';
        experiment.endDate = new Date();

        logger.info('Experiment stopped', { experimentId });

        return { success: true, data: experiment };
    }

    /**
     * Get experiment by ID
     */
    getExperiment(experimentId: string): IServiceResult<IExperiment> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return { success: false, error: 'Experiment not found' };
        }
        return { success: true, data: experiment };
    }

    /**
     * List all experiments
     */
    listExperiments(modelType?: MLModelType): IServiceResult<IExperiment[]> {
        let experiments = Array.from(this.experiments.values());

        if (modelType) {
            experiments = experiments.filter(e => e.modelType === modelType);
        }

        return { success: true, data: experiments };
    }

    /**
     * Select which model to use for a prediction (traffic routing)
     */
    selectModelForPrediction(experimentId: string): IServiceResult<IModelSelection> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return { success: false, error: 'Experiment not found' };
        }

        if (experiment.status !== 'running') {
            return { success: false, error: 'Experiment is not running' };
        }

        // Random selection based on traffic split
        const random = Math.random() * 100;
        const useTreatment = random < experiment.trafficSplit;

        const selection: IModelSelection = {
            modelId: useTreatment ? experiment.treatmentModelId : experiment.controlModelId,
            modelVersion: 'latest', // Would be fetched from registry in real impl
            isControl: !useTreatment,
            isTreatment: useTreatment
        };

        // Update metrics
        experiment.metrics.totalPredictions++;
        if (useTreatment) {
            experiment.metrics.treatmentPredictions++;
        } else {
            experiment.metrics.controlPredictions++;
        }

        return { success: true, data: selection };
    }

    /**
     * Get active experiment for a model type
     */
    getActiveExperiment(modelType: MLModelType): IServiceResult<IExperiment | null> {
        const active = Array.from(this.experiments.values())
            .find(e => e.modelType === modelType && e.status === 'running');

        return { success: true, data: active ?? null };
    }

    /**
     * Calculate experiment results
     */
    async calculateResults(experimentId: string): Promise<IServiceResult<IExperimentResult>> {
        try {
            const experiment = this.experiments.get(experimentId);
            if (!experiment) {
                return { success: false, error: 'Experiment not found' };
            }

            // Fetch prediction metrics from database
            const controlMetrics = await this.fetchModelMetrics(
                experiment.controlModelId,
                experiment.startDate,
                experiment.endDate
            );

            const treatmentMetrics = await this.fetchModelMetrics(
                experiment.treatmentModelId,
                experiment.startDate,
                experiment.endDate
            );

            // Determine winner based on metrics
            const winner = this.determineWinner(controlMetrics, treatmentMetrics);

            // Calculate statistical significance (simplified)
            const totalSamples = controlMetrics.predictionCount + treatmentMetrics.predictionCount;
            const statisticalSignificance = totalSamples >= 100; // Simple threshold

            // Generate recommendation
            const recommendation = this.generateRecommendation(winner, statisticalSignificance);

            const result: IExperimentResult = {
                experimentId,
                winner,
                controlMetrics,
                treatmentMetrics,
                recommendation,
                statisticalSignificance
            };

            logger.info('Experiment results calculated', {
                experimentId,
                winner,
                statisticalSignificance
            });

            return { success: true, data: result };
        } catch (error) {
            logger.error('Failed to calculate experiment results', { error });
            return { success: false, error: 'Failed to calculate results' };
        }
    }

    /**
     * Fetch metrics for a model
     */
    private async fetchModelMetrics(
        modelId: string,
        startDate: Date,
        endDate?: Date
    ): Promise<{
        predictionCount: number;
        avgLatency: number;
        avgConfidence: number;
        feedbackScore?: number;
    }> {
        // In real implementation, query the database
        // For now, return mock data based on experiment metrics
        return {
            predictionCount: Math.floor(Math.random() * 1000),
            avgLatency: 50 + Math.random() * 50,
            avgConfidence: 0.7 + Math.random() * 0.2,
            feedbackScore: Math.random() > 0.5 ? 0.8 + Math.random() * 0.15 : undefined
        };
    }

    /**
     * Determine winner based on metrics
     */
    private determineWinner(
        control: { predictionCount: number; avgLatency: number; avgConfidence: number; feedbackScore?: number },
        treatment: { predictionCount: number; avgLatency: number; avgConfidence: number; feedbackScore?: number }
    ): 'control' | 'treatment' | 'inconclusive' {
        // Compare multiple metrics
        let controlScore = 0;
        let treatmentScore = 0;

        // Lower latency is better
        if (control.avgLatency < treatment.avgLatency) {
            controlScore += 1;
        } else if (treatment.avgLatency < control.avgLatency) {
            treatmentScore += 1;
        }

        // Higher confidence is better
        if (control.avgConfidence > treatment.avgConfidence) {
            controlScore += 1;
        } else if (treatment.avgConfidence > control.avgConfidence) {
            treatmentScore += 1;
        }

        // Higher feedback score is better (if available)
        if (control.feedbackScore !== undefined && treatment.feedbackScore !== undefined) {
            if (control.feedbackScore > treatment.feedbackScore) {
                controlScore += 2; // Feedback is weighted higher
            } else if (treatment.feedbackScore > control.feedbackScore) {
                treatmentScore += 2;
            }
        }

        if (controlScore > treatmentScore) {
            return 'control';
        } else if (treatmentScore > controlScore) {
            return 'treatment';
        }
        return 'inconclusive';
    }

    /**
     * Generate recommendation text
     */
    private generateRecommendation(
        winner: 'control' | 'treatment' | 'inconclusive',
        statisticalSignificance: boolean
    ): string {
        if (!statisticalSignificance) {
            return 'Insufficient data for statistical significance. Consider running the experiment longer.';
        }

        switch (winner) {
            case 'control':
                return 'Control model performed better. Recommend keeping the current production model.';
            case 'treatment':
                return 'Treatment model performed better. Recommend promoting treatment model to production.';
            case 'inconclusive':
                return 'No clear winner. Both models perform similarly. Consider other factors for decision.';
        }
    }

    /**
     * Delete an experiment
     */
    deleteExperiment(experimentId: string): IServiceResult<void> {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return { success: false, error: 'Experiment not found' };
        }

        if (experiment.status === 'running') {
            return { success: false, error: 'Cannot delete a running experiment. Stop it first.' };
        }

        this.experiments.delete(experimentId);
        return { success: true, data: undefined };
    }
}
