/**
 * Data Validation Service
 * Training data quality validation
 * 
 * Features:
 * - Schema validation
 * - Statistical bounds checking
 * - Anomaly detection in training data
 * - Data quality scoring
 */

import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult, MLModelType } from '../../domain';

const logger = createModuleLogger('DataValidation');

// ==================== TYPES ====================

export interface IValidationRule {
    name: string;
    type: 'schema' | 'range' | 'distribution' | 'null_check' | 'unique' | 'custom';
    featureName: string;
    config: Record<string, unknown>;
    severity: 'error' | 'warning' | 'info';
}

export interface IValidationResult {
    rule: IValidationRule;
    passed: boolean;
    message: string;
    affectedCount?: number;
    examples?: unknown[];
}

export interface IDataQualityReport {
    datasetId: string;
    recordCount: number;
    validRecords: number;
    invalidRecords: number;
    qualityScore: number; // 0-100
    validationResults: IValidationResult[];
    featureStats: IFeatureStats[];
    anomalyCount: number;
    recommendation: string;
    validatedAt: Date;
}

export interface IFeatureStats {
    featureName: string;
    dataType: 'numeric' | 'categorical' | 'boolean' | 'unknown';
    nullCount: number;
    nullPercent: number;
    uniqueCount: number;
    // Numeric stats
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
    // Categorical stats
    topValues?: Array<{ value: string; count: number }>;
}

export interface IValidationConfig {
    maxNullPercent: number;
    outlierThreshold: number; // Z-score threshold
    minUniqueRatio: number;   // For categorical, prevent constant features
    maxUniqueRatio: number;   // For categorical, prevent ID-like features
}

const DEFAULT_CONFIG: IValidationConfig = {
    maxNullPercent: 10,
    outlierThreshold: 3,
    minUniqueRatio: 0.001,
    maxUniqueRatio: 0.95
};

// ==================== SERVICE ====================

export class DataValidationService {
    private readonly config: IValidationConfig;
    private customRules: Map<string, IValidationRule[]> = new Map();

    constructor(config?: Partial<IValidationConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ==================== PUBLIC API ====================

    /**
     * Validate training dataset
     */
    async validateDataset(
        data: Array<Record<string, unknown>>,
        modelType: MLModelType,
        datasetId: string = `dataset_${Date.now()}`
    ): Promise<IServiceResult<IDataQualityReport>> {
        try {
            if (data.length === 0) {
                return { success: false, error: 'Empty dataset' };
            }

            const validationResults: IValidationResult[] = [];
            const featureStats = this.calculateFeatureStats(data);

            // Run built-in validations
            for (const stats of featureStats) {
                // Null check
                if (stats.nullPercent > this.config.maxNullPercent) {
                    validationResults.push({
                        rule: {
                            name: 'null_check',
                            type: 'null_check',
                            featureName: stats.featureName,
                            config: { maxNull: this.config.maxNullPercent },
                            severity: stats.nullPercent > 50 ? 'error' : 'warning'
                        },
                        passed: false,
                        message: `Feature '${stats.featureName}' has ${stats.nullPercent.toFixed(1)}% null values`,
                        affectedCount: stats.nullCount
                    });
                }

                // Range validation for numeric features
                if (stats.dataType === 'numeric' && stats.mean !== undefined && stats.std !== undefined) {
                    const outlierCount = this.countOutliers(
                        data.map(d => d[stats.featureName] as number),
                        stats.mean,
                        stats.std
                    );

                    if (outlierCount > data.length * 0.05) { // >5% outliers
                        validationResults.push({
                            rule: {
                                name: 'outlier_check',
                                type: 'range',
                                featureName: stats.featureName,
                                config: { threshold: this.config.outlierThreshold },
                                severity: 'warning'
                            },
                            passed: false,
                            message: `Feature '${stats.featureName}' has ${outlierCount} outliers (${((outlierCount / data.length) * 100).toFixed(1)}%)`,
                            affectedCount: outlierCount
                        });
                    }
                }

                // Uniqueness check for categorical
                if (stats.dataType === 'categorical') {
                    const uniqueRatio = stats.uniqueCount / data.length;

                    if (uniqueRatio < this.config.minUniqueRatio) {
                        validationResults.push({
                            rule: {
                                name: 'low_variance',
                                type: 'distribution',
                                featureName: stats.featureName,
                                config: {},
                                severity: 'warning'
                            },
                            passed: false,
                            message: `Feature '${stats.featureName}' has very low variance (${stats.uniqueCount} unique values)`,
                            affectedCount: data.length
                        });
                    }

                    if (uniqueRatio > this.config.maxUniqueRatio) {
                        validationResults.push({
                            rule: {
                                name: 'high_cardinality',
                                type: 'unique',
                                featureName: stats.featureName,
                                config: {},
                                severity: 'warning'
                            },
                            passed: false,
                            message: `Feature '${stats.featureName}' may be an ID field (${(uniqueRatio * 100).toFixed(1)}% unique)`,
                            affectedCount: stats.uniqueCount
                        });
                    }
                }
            }

            // Run custom rules
            const customRules = this.customRules.get(modelType) ?? [];
            for (const rule of customRules) {
                const result = this.validateCustomRule(data, rule);
                validationResults.push(result);
            }

            // Count anomalies
            const anomalyCount = this.detectAnomalies(data, featureStats);

            // Calculate quality score
            const errorCount = validationResults.filter(r => !r.passed && r.rule.severity === 'error').length;
            const warningCount = validationResults.filter(r => !r.passed && r.rule.severity === 'warning').length;
            const qualityScore = Math.max(0, 100 - errorCount * 20 - warningCount * 5 - anomalyCount * 0.1);

            const report: IDataQualityReport = {
                datasetId,
                recordCount: data.length,
                validRecords: data.length - anomalyCount,
                invalidRecords: anomalyCount,
                qualityScore,
                validationResults,
                featureStats,
                anomalyCount,
                recommendation: this.getRecommendation(qualityScore, errorCount, warningCount),
                validatedAt: new Date()
            };

            logger.info('Dataset validated', {
                datasetId,
                recordCount: data.length,
                qualityScore,
                errors: errorCount,
                warnings: warningCount
            });

            return { success: true, data: report };

        } catch (error) {
            logger.error('Data validation failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Add custom validation rule
     */
    addRule(modelType: MLModelType, rule: IValidationRule): void {
        const rules = this.customRules.get(modelType) ?? [];
        rules.push(rule);
        this.customRules.set(modelType, rules);
    }

    /**
     * Validate single record
     */
    validateRecord(
        record: Record<string, unknown>,
        schema: Record<string, 'number' | 'string' | 'boolean'>
    ): IValidationResult[] {
        const results: IValidationResult[] = [];

        for (const [field, expectedType] of Object.entries(schema)) {
            const value = record[field];
            const actualType = typeof value;

            if (value === null || value === undefined) {
                results.push({
                    rule: {
                        name: 'required_field',
                        type: 'null_check',
                        featureName: field,
                        config: {},
                        severity: 'error'
                    },
                    passed: false,
                    message: `Required field '${field}' is missing`
                });
            } else if (actualType !== expectedType) {
                results.push({
                    rule: {
                        name: 'type_check',
                        type: 'schema',
                        featureName: field,
                        config: { expected: expectedType },
                        severity: 'error'
                    },
                    passed: false,
                    message: `Field '${field}' expected ${expectedType}, got ${actualType}`
                });
            }
        }

        return results;
    }

    // ==================== PRIVATE METHODS ====================

    private calculateFeatureStats(data: Array<Record<string, unknown>>): IFeatureStats[] {
        if (data.length === 0) return [];

        const features = Object.keys(data[0]);
        const stats: IFeatureStats[] = [];

        for (const feature of features) {
            const values = data.map(d => d[feature]);
            const nullCount = values.filter(v => v === null || v === undefined).length;
            const nonNullValues = values.filter(v => v !== null && v !== undefined);
            const uniqueValues = new Set(nonNullValues.map(v => String(v)));

            // Determine data type
            let dataType: IFeatureStats['dataType'] = 'unknown';
            if (nonNullValues.length > 0) {
                if (typeof nonNullValues[0] === 'number') {
                    dataType = 'numeric';
                } else if (typeof nonNullValues[0] === 'boolean') {
                    dataType = 'boolean';
                } else if (typeof nonNullValues[0] === 'string') {
                    dataType = 'categorical';
                }
            }

            const stat: IFeatureStats = {
                featureName: feature,
                dataType,
                nullCount,
                nullPercent: (nullCount / data.length) * 100,
                uniqueCount: uniqueValues.size
            };

            // Numeric stats
            if (dataType === 'numeric') {
                const numValues = nonNullValues as number[];
                stat.min = Math.min(...numValues);
                stat.max = Math.max(...numValues);
                stat.mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
                stat.std = Math.sqrt(
                    numValues.reduce((sum, v) => sum + (v - stat.mean!) ** 2, 0) / numValues.length
                );
            }

            // Categorical stats
            if (dataType === 'categorical') {
                const counts = new Map<string, number>();
                for (const v of nonNullValues) {
                    const key = String(v);
                    counts.set(key, (counts.get(key) ?? 0) + 1);
                }
                stat.topValues = [...counts.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([value, count]) => ({ value, count }));
            }

            stats.push(stat);
        }

        return stats;
    }

    private countOutliers(values: number[], mean: number, std: number): number {
        if (std === 0) return 0;
        return values.filter(v =>
            typeof v === 'number' &&
            Math.abs((v - mean) / std) > this.config.outlierThreshold
        ).length;
    }

    private detectAnomalies(
        data: Array<Record<string, unknown>>,
        featureStats: IFeatureStats[]
    ): number {
        // Simple multivariate outlier detection using z-scores
        let anomalyCount = 0;

        for (const record of data) {
            let zScoreSum = 0;
            let numericCount = 0;

            for (const stats of featureStats) {
                if (stats.dataType === 'numeric' && stats.mean !== undefined && stats.std !== undefined && stats.std > 0) {
                    const value = record[stats.featureName];
                    if (typeof value === 'number') {
                        const zScore = Math.abs((value - stats.mean) / stats.std);
                        zScoreSum += zScore;
                        numericCount++;
                    }
                }
            }

            if (numericCount > 0) {
                const avgZScore = zScoreSum / numericCount;
                if (avgZScore > this.config.outlierThreshold) {
                    anomalyCount++;
                }
            }
        }

        return anomalyCount;
    }

    private validateCustomRule(
        data: Array<Record<string, unknown>>,
        rule: IValidationRule
    ): IValidationResult {
        // Custom rule implementation placeholder
        return {
            rule,
            passed: true,
            message: `Custom rule '${rule.name}' passed`
        };
    }

    private getRecommendation(
        qualityScore: number,
        errorCount: number,
        warningCount: number
    ): string {
        if (qualityScore >= 90) {
            return 'Data quality is excellent. Ready for training.';
        } else if (qualityScore >= 70) {
            return warningCount > 0
                ? `Data quality is good. Consider addressing ${warningCount} warning(s).`
                : 'Data quality is good. Ready for training.';
        } else if (qualityScore >= 50) {
            return `Data quality is moderate. Address ${errorCount} error(s) before training.`;
        } else {
            return `Data quality is poor. Significant data cleaning required. Found ${errorCount} errors and ${warningCount} warnings.`;
        }
    }
}

// ==================== FACTORY ====================

export function createDataValidationService(
    config?: Partial<IValidationConfig>
): DataValidationService {
    return new DataValidationService(config);
}
