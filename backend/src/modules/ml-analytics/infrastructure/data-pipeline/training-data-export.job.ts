/**
 * Training Data Export Job
 * Scheduled job for periodic training data export
 * 
 * Features:
 * - Configurable schedule (cron-like)
 * - Per-model-type exports
 * - Quality threshold enforcement
 * - Failure notifications
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createModuleLogger } from '../../../../core/logger';
import { TrainingDataPipelineService, IExportConfig, IExportResult } from './training-data-pipeline.service';
import { MLModelType } from '../../domain';
import path from 'path';

const logger = createModuleLogger('TrainingDataExportJob');

// ==================== TYPES ====================

export interface IJobConfig {
    /** Models to export data for */
    modelTypes: MLModelType[];
    /** Time window in days to look back */
    timeWindowDays: number;
    /** Minimum quality score to allow export */
    minQualityScore: number;
    /** Output directory for CSV files */
    outputDir?: string;
    /** Whether to validate before export */
    validateBeforeExport: boolean;
    /** Interval in milliseconds between runs (0 = one-shot) */
    intervalMs: number;
}

export interface IJobStatus {
    isRunning: boolean;
    lastRunAt?: Date;
    lastResults: Map<MLModelType, IExportResult>;
    consecutiveFailures: number;
    scheduledNextRun?: Date;
}

// ==================== JOB SERVICE ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export class TrainingDataExportJob {
    private readonly pipeline: TrainingDataPipelineService;
    private intervalHandle: NodeJS.Timeout | null = null;
    private readonly status: IJobStatus = {
        isRunning: false,
        lastResults: new Map(),
        consecutiveFailures: 0
    };

    constructor(
        private readonly db: Database,
        private readonly config: IJobConfig
    ) {
        this.pipeline = new TrainingDataPipelineService(db);
    }

    // ==================== PUBLIC API ====================

    /**
     * Start scheduled exports
     */
    start(): void {
        if (this.intervalHandle) {
            logger.warn('Job already running');
            return;
        }

        logger.info('Starting training data export job', {
            models: this.config.modelTypes,
            intervalMs: this.config.intervalMs
        });

        // Run immediately
        this.runOnce().catch(err =>
            logger.error('Initial job run failed', { error: err })
        );

        // Schedule recurring runs
        if (this.config.intervalMs > 0) {
            this.intervalHandle = setInterval(() => {
                this.runOnce().catch(err =>
                    logger.error('Scheduled job run failed', { error: err })
                );
            }, this.config.intervalMs);

            this.status.scheduledNextRun = new Date(Date.now() + this.config.intervalMs);
        }
    }

    /**
     * Stop scheduled exports
     */
    stop(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
            this.status.scheduledNextRun = undefined;
            logger.info('Training data export job stopped');
        }
    }

    /**
     * Run export for all configured models once
     */
    async runOnce(): Promise<Map<MLModelType, IExportResult>> {
        if (this.status.isRunning) {
            logger.warn('Job already in progress, skipping');
            return this.status.lastResults;
        }

        this.status.isRunning = true;
        this.status.lastRunAt = new Date();
        const results = new Map<MLModelType, IExportResult>();

        logger.info('Running training data export', {
            models: this.config.modelTypes,
            timeWindow: this.config.timeWindowDays
        });

        let allSuccess = true;

        for (const modelType of this.config.modelTypes) {
            const exportConfig: IExportConfig = {
                modelType,
                timeWindowDays: this.config.timeWindowDays,
                outputDir: this.config.outputDir || path.join(process.cwd(), 'data', 'training'),
                minQualityScore: this.config.minQualityScore,
                validateBeforeExport: this.config.validateBeforeExport
            };

            try {
                const result = await this.pipeline.runPipeline(exportConfig);

                if (result.success && result.data) {
                    results.set(modelType, result.data);
                    logger.info('Export completed', {
                        modelType,
                        rowCount: result.data.rowCount,
                        qualityScore: result.data.qualityReport?.qualityScore
                    });
                } else {
                    allSuccess = false;
                    results.set(modelType, {
                        success: false,
                        error: result.error ?? 'Unknown error'
                    });
                    logger.warn('Export failed for model', { modelType, error: result.error });
                }
            } catch (error) {
                allSuccess = false;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.set(modelType, { success: false, error: errorMessage });
                logger.error('Export threw exception', { modelType, error: errorMessage });
            }
        }

        // Update status
        this.status.lastResults = results;
        this.status.isRunning = false;

        if (allSuccess) {
            this.status.consecutiveFailures = 0;
        } else {
            this.status.consecutiveFailures++;
            if (this.status.consecutiveFailures >= 3) {
                logger.error('Training data export failing consistently', {
                    consecutiveFailures: this.status.consecutiveFailures
                });
            }
        }

        if (this.config.intervalMs > 0) {
            this.status.scheduledNextRun = new Date(Date.now() + this.config.intervalMs);
        }

        return results;
    }

    /**
     * Get current job status
     */
    getStatus(): Readonly<IJobStatus> {
        return { ...this.status };
    }

    /**
     * Run export for a specific model
     */
    async exportModel(modelType: MLModelType): Promise<IExportResult> {
        const exportConfig: IExportConfig = {
            modelType,
            timeWindowDays: this.config.timeWindowDays,
            outputDir: this.config.outputDir || path.join(process.cwd(), 'data', 'training'),
            minQualityScore: this.config.minQualityScore,
            validateBeforeExport: this.config.validateBeforeExport
        };

        const result = await this.pipeline.runPipeline(exportConfig);

        if (result.success && result.data) {
            return result.data;
        }

        return { success: false, error: result.error };
    }
}

// ==================== FACTORY ====================

/**
 * Create default export job with recommended settings
 */
export function createDefaultExportJob(db: Database): TrainingDataExportJob {
    return new TrainingDataExportJob(db, {
        modelTypes: ['waste_predictor', 'algorithm_selector', 'time_estimator', 'anomaly_predictor'],
        timeWindowDays: 30,
        minQualityScore: 60,
        validateBeforeExport: true,
        intervalMs: 24 * 60 * 60 * 1000 // Daily
    });
}
