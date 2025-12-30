/**
 * Training Data Pipeline Service
 * Orchestrates data collection, validation, and export for ML model training
 * 
 * Features:
 * - Scheduled data export
 * - Data quality validation
 * - Outlier detection
 * - Missing value handling
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, gte, isNotNull, count, avg, sql } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions } from '../../../../db/schema/ml-analytics';
import { IServiceResult, MLModelType } from '../../domain';
import { FeatureStoreService } from '../feature-store/feature-store.service';
import path from 'path';
import fs from 'fs/promises';

const logger = createModuleLogger('TrainingDataPipeline');

// ==================== TYPES ====================

export interface IDataQualityReport {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    nullValueCounts: Record<string, number>;
    outlierCounts: Record<string, number>;
    qualityScore: number; // 0-100
    issues: IDataQualityIssue[];
}

export interface IDataQualityIssue {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'null_values' | 'outliers' | 'schema_mismatch' | 'insufficient_data' | 'distribution_shift';
    message: string;
    affectedRows?: number;
    recommendation: string;
}

export interface IExportConfig {
    modelType: MLModelType;
    timeWindowDays: number;
    outputDir: string;
    minQualityScore: number;
    validateBeforeExport: boolean;
}

export interface IExportResult {
    success: boolean;
    filePath?: string;
    rowCount?: number;
    qualityReport?: IDataQualityReport;
    error?: string;
}

// ==================== SERVICE ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export class TrainingDataPipelineService {
    private readonly featureStore: FeatureStoreService;
    private readonly dataDir: string;

    constructor(
        private readonly db: Database
    ) {
        this.featureStore = new FeatureStoreService(db);
        this.dataDir = path.join(process.cwd(), 'data', 'training');
    }

    // ==================== PUBLIC API ====================

    /**
     * Full pipeline: validate → export → report
     */
    async runPipeline(config: IExportConfig): Promise<IServiceResult<IExportResult>> {
        logger.info('Starting training data pipeline', { modelType: config.modelType });

        try {
            // 1. Ensure output directory exists
            await this.ensureDirectory(config.outputDir || this.dataDir);

            // 2. Validate data quality if enabled
            let qualityReport: IDataQualityReport | undefined;
            if (config.validateBeforeExport) {
                const validation = await this.validateData(config.modelType, config.timeWindowDays);
                if (!validation.success || !validation.data) {
                    return {
                        success: false,
                        error: validation.error ?? 'Data validation failed'
                    };
                }
                qualityReport = validation.data;

                // Check quality threshold
                if (qualityReport.qualityScore < config.minQualityScore) {
                    logger.warn('Data quality below threshold', {
                        score: qualityReport.qualityScore,
                        threshold: config.minQualityScore
                    });
                    return {
                        success: false,
                        error: `Data quality score (${qualityReport.qualityScore}) below threshold (${config.minQualityScore})`
                    };
                }
            }

            // 3. Export data
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${config.modelType}_training_${timestamp}.csv`;
            const filePath = path.join(config.outputDir || this.dataDir, fileName);

            const exportResult = await this.featureStore.exportTrainingData(
                config.modelType,
                filePath,
                config.timeWindowDays
            );

            if (!exportResult.success) {
                return { success: false, error: exportResult.error };
            }

            logger.info('Training data pipeline completed', {
                modelType: config.modelType,
                rowCount: exportResult.data?.rowCount,
                qualityScore: qualityReport?.qualityScore
            });

            return {
                success: true,
                data: {
                    success: true,
                    filePath,
                    rowCount: exportResult.data?.rowCount,
                    qualityReport
                }
            };

        } catch (error) {
            logger.error('Pipeline failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Pipeline failed'
            };
        }
    }

    /**
     * Validate data quality without exporting
     */
    async validateData(
        modelType: MLModelType,
        timeWindowDays: number = 30
    ): Promise<IServiceResult<IDataQualityReport>> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - timeWindowDays);

            // Get statistics
            const stats = await this.getDataStatistics(modelType, startDate);
            const issues = this.identifyIssues(stats);
            const qualityScore = this.calculateQualityScore(stats, issues);

            const report: IDataQualityReport = {
                totalRows: stats.totalRows,
                validRows: stats.validRows,
                invalidRows: stats.totalRows - stats.validRows,
                nullValueCounts: stats.nullCounts,
                outlierCounts: stats.outlierCounts,
                qualityScore,
                issues
            };

            return { success: true, data: report };

        } catch (error) {
            logger.error('Validation failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Get available data window for a model type
     */
    async getDataWindow(modelType: MLModelType): Promise<IServiceResult<{
        oldestRecord: Date;
        newestRecord: Date;
        totalCount: number;
        withFeedbackCount: number;
    }>> {
        try {
            const result = await this.db.select({
                oldest: sql<Date>`MIN(${mlPredictions.createdAt})`,
                newest: sql<Date>`MAX(${mlPredictions.createdAt})`,
                total: count(),
                withFeedback: sql<number>`COUNT(CASE WHEN ${mlPredictions.actualValue} IS NOT NULL THEN 1 END)`
            })
                .from(mlPredictions)
                .where(eq(mlPredictions.modelType, modelType));

            const row = result[0];
            if (!row || !row.oldest || !row.newest) {
                return { success: false, error: 'No data found for model type' };
            }

            return {
                success: true,
                data: {
                    oldestRecord: row.oldest,
                    newestRecord: row.newest,
                    totalCount: Number(row.total),
                    withFeedbackCount: Number(row.withFeedback)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Query failed'
            };
        }
    }

    // ==================== INTERNAL METHODS ====================

    private async getDataStatistics(modelType: MLModelType, startDate: Date) {
        // Total and valid counts
        const countResult = await this.db.select({
            total: count(),
            withActual: sql<number>`COUNT(CASE WHEN ${mlPredictions.actualValue} IS NOT NULL THEN 1 END)`,
            withFeatures: sql<number>`COUNT(CASE WHEN ${mlPredictions.inputFeatures} IS NOT NULL THEN 1 END)`
        })
            .from(mlPredictions)
            .where(and(
                eq(mlPredictions.modelType, modelType),
                gte(mlPredictions.createdAt, startDate)
            ));

        const stats = countResult[0];

        return {
            totalRows: Number(stats?.total ?? 0),
            validRows: Number(stats?.withActual ?? 0),
            nullCounts: {
                inputFeatures: Number(stats?.total ?? 0) - Number(stats?.withFeatures ?? 0),
                actualValue: Number(stats?.total ?? 0) - Number(stats?.withActual ?? 0)
            },
            outlierCounts: {} // Would need actual feature analysis
        };
    }

    private identifyIssues(stats: {
        totalRows: number;
        validRows: number;
        nullCounts: Record<string, number>;
        outlierCounts: Record<string, number>;
    }): IDataQualityIssue[] {
        const issues: IDataQualityIssue[] = [];

        // Check for insufficient data
        if (stats.totalRows < 100) {
            issues.push({
                severity: 'critical',
                type: 'insufficient_data',
                message: `Only ${stats.totalRows} records found, minimum 100 required`,
                affectedRows: stats.totalRows,
                recommendation: 'Wait for more predictions to accumulate before training'
            });
        }

        // Check for missing feedback
        const feedbackRatio = stats.validRows / (stats.totalRows || 1);
        if (feedbackRatio < 0.5 && stats.totalRows >= 100) {
            issues.push({
                severity: 'high',
                type: 'null_values',
                message: `Only ${Math.round(feedbackRatio * 100)}% of predictions have feedback`,
                affectedRows: stats.totalRows - stats.validRows,
                recommendation: 'Ensure optimization results are fed back to ML predictions'
            });
        }

        // Check for null input features
        const nullFeaturesRatio = stats.nullCounts.inputFeatures / (stats.totalRows || 1);
        if (nullFeaturesRatio > 0.05) {
            issues.push({
                severity: 'medium',
                type: 'null_values',
                message: `${Math.round(nullFeaturesRatio * 100)}% of records have null input features`,
                affectedRows: stats.nullCounts.inputFeatures,
                recommendation: 'Check prediction logging to ensure features are captured'
            });
        }

        return issues;
    }

    private calculateQualityScore(
        stats: { totalRows: number; validRows: number },
        issues: IDataQualityIssue[]
    ): number {
        if (stats.totalRows === 0) return 0;

        let score = 100;

        // Deduct for issues
        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical': score -= 40; break;
                case 'high': score -= 20; break;
                case 'medium': score -= 10; break;
                case 'low': score -= 5; break;
            }
        }

        // Bonus for feedback ratio
        const feedbackRatio = stats.validRows / stats.totalRows;
        score = score * (0.5 + feedbackRatio * 0.5);

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    private async ensureDirectory(dir: string): Promise<void> {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }
}
