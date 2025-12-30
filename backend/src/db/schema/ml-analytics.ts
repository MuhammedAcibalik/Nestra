/**
 * ML Analytics Database Schema
 * Tables for model registry and prediction logging
 */

import { pgTable, uuid, text, timestamp, jsonb, real, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ENUMS ====================

export const modelStatusEnum = pgEnum('ml_model_status', [
    'draft',
    'training',
    'validating',
    'staging',
    'production',
    'archived',
    'failed'
]);

export const modelTypeEnum = pgEnum('ml_model_type', [
    'waste_predictor',
    'time_estimator',
    'algorithm_selector',
    'anomaly_predictor'
]);

export const jobStatusEnum = pgEnum('ml_job_status', [
    'pending',
    'running',
    'completed',
    'failed',
    'failed',
    'cancelled'
]);

export const executionTypeEnum = pgEnum('ml_execution_type', [
    'primary',
    'shadow',
    'fallback'
]);

// ==================== A/B TESTING ENUMS ====================

export const experimentStatusEnum = pgEnum('ml_experiment_status', [
    'active',
    'paused',
    'completed'
]);

export const scopeTypeEnum = pgEnum('ml_scope_type', [
    'global',
    'tenant'
]);

export const variantEnum = pgEnum('ml_variant', [
    'control',
    'variant'
]);

export const experimentTypeEnum = pgEnum('ml_experiment_type', [
    'ab_test',
    'mab_epsilon',
    'mab_ucb',
    'mab_thompson',
    'canary'
]);

// ==================== MODEL REGISTRY ====================

/**
 * ml_models - Model version registry
 * Stores all trained model versions with metadata
 */
export const mlModels = pgTable('ml_models', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Model identification
    modelType: modelTypeEnum('model_type').notNull(),
    version: text('version').notNull(),
    name: text('name'),
    description: text('description'),

    // Status and deployment
    status: modelStatusEnum('status').notNull().default('draft'),
    isProduction: boolean('is_production').notNull().default(false),

    // File storage
    modelPath: text('model_path').notNull(),
    metadataPath: text('metadata_path'),

    // Training info
    trainedAt: timestamp('trained_at'),
    trainingDuration: integer('training_duration_seconds'),
    trainingDataCount: integer('training_data_count'),

    // Performance metrics
    metrics: jsonb('metrics').$type<{
        trainLoss?: number;
        valLoss?: number;
        accuracy?: number;
        mae?: number;
        mse?: number;
        r2?: number;
    }>(),

    // Normalization parameters
    normParams: jsonb('norm_params').$type<{
        means: number[];
        stds: number[];
    }>(),

    // Feature order for this model
    featureOrder: jsonb('feature_order').$type<string[]>(),
    inputSize: integer('input_size'),

    // XAI (Explainability)
    globalExplanations: jsonb('global_explanations').$type<{
        shapValues: Record<string, number>;
        featureImportance: Record<string, number>;
    }>(),

    // Audit
    createdBy: uuid('created_by'),
    promotedBy: uuid('promoted_by'),
    promotedAt: timestamp('promoted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ==================== PREDICTION LOGGING ====================

/**
 * ml_predictions - Prediction audit log
 * Stores all predictions for monitoring and analysis
 */
export const mlPredictions = pgTable('ml_predictions', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Model reference
    modelId: uuid('model_id').references(() => mlModels.id),
    modelType: modelTypeEnum('model_type').notNull(),
    modelVersion: text('model_version').notNull(),
    executionType: executionTypeEnum('execution_type').notNull().default('primary'),

    // Input/Output
    inputFeatures: jsonb('input_features').notNull().$type<Record<string, number>>(),
    rawPrediction: jsonb('raw_prediction').$type<number[]>(),
    formattedPrediction: jsonb('formatted_prediction').$type<Record<string, unknown>>(),

    // Confidence and quality
    confidence: real('confidence'),
    usedFallback: boolean('used_fallback').notNull().default(false),

    // Performance
    preprocessingMs: integer('preprocessing_ms'),
    inferenceMs: integer('inference_ms'),
    totalLatencyMs: integer('total_latency_ms'),

    // XAI (Local Explanation)
    localExplanation: jsonb('local_explanation').$type<{
        contributions: Record<string, number>; // Feature contributions to this prediction
        baseline: number; // Base value
    }>(),

    // Context
    jobId: uuid('job_id'),
    scenarioId: uuid('scenario_id'),
    userId: uuid('user_id'),
    tenantId: uuid('tenant_id'),

    // Ground truth (for feedback)
    actualValue: jsonb('actual_value').$type<Record<string, unknown>>(),
    feedbackScore: real('feedback_score'),
    feedbackAt: timestamp('feedback_at'),

    // A/B Testing columns
    experimentId: uuid('experiment_id'),
    assignedVariant: variantEnum('assigned_variant'),
    servedVariant: variantEnum('served_variant'),
    modelIdUsed: uuid('model_id_used'),
    errorCode: text('error_code'),

    createdAt: timestamp('created_at').defaultNow().notNull()
});

// ==================== MODEL PERFORMANCE AGGREGATES ====================

/**
 * ml_model_performance - Daily performance metrics
 * Aggregated prediction performance per model
 */
export const mlModelPerformance = pgTable('ml_model_performance', {
    id: uuid('id').primaryKey().defaultRandom(),

    modelId: uuid('model_id').references(() => mlModels.id).notNull(),
    date: timestamp('date').notNull(),

    // Counts
    predictionCount: integer('prediction_count').notNull().default(0),
    fallbackCount: integer('fallback_count').notNull().default(0),

    // Latency stats
    avgLatencyMs: real('avg_latency_ms'),
    p95LatencyMs: real('p95_latency_ms'),
    maxLatencyMs: real('max_latency_ms'),

    // Confidence stats
    avgConfidence: real('avg_confidence'),
    minConfidence: real('min_confidence'),

    // Error tracking
    errorCount: integer('error_count').notNull().default(0),

    // Accuracy (if feedback available)
    feedbackCount: integer('feedback_count').notNull().default(0),
    avgFeedbackScore: real('avg_feedback_score'),

    createdAt: timestamp('created_at').defaultNow().notNull()
});

// ==================== TRAINING JOBS ====================

/**
 * ml_training_jobs - Training job queue
 * Persisted state of training operations
 */
export const mlTrainingJobs = pgTable('ml_training_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),

    modelType: modelTypeEnum('model_type').notNull(),
    status: jobStatusEnum('status').notNull().default('pending'),

    // Config and Parameters
    config: jsonb('config').notNull().$type<Record<string, unknown>>(),
    triggerReason: text('trigger_reason'),

    // Execution details
    workerId: text('worker_id'),

    // Result
    newModelVersion: text('new_model_version'),
    metrics: jsonb('metrics').$type<{
        trainLoss?: number;
        valLoss?: number;
        accuracy?: number;
    }>(),
    error: text('error'),

    // Timestamps
    startTime: timestamp('start_time'),
    endTime: timestamp('end_time'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ==================== A/B EXPERIMENTS ====================

/**
 * ml_experiments - A/B Testing experiments
 * Manages traffic split between control and variant models
 */
export const mlExperiments = pgTable('ml_experiments', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Model type (which model is being tested)
    modelType: modelTypeEnum('model_type').notNull(),

    // Experiment status
    status: experimentStatusEnum('status').notNull().default('paused'),

    // Scope
    scopeType: scopeTypeEnum('scope_type').notNull().default('global'),
    scopeTenantId: uuid('scope_tenant_id'),

    // Model references
    controlModelId: uuid('control_model_id').references(() => mlModels.id).notNull(),
    variantModelId: uuid('variant_model_id').references(() => mlModels.id).notNull(),

    // Traffic allocation (basis points: 0-10000, where 10000 = 100%)
    allocationBasisPoints: integer('allocation_basis_points').notNull().default(0),
    salt: text('salt').notNull(),

    // Time window
    startDate: timestamp('start_date').defaultNow().notNull(),
    endDate: timestamp('end_date'),

    // Experiment Type (ab_test, mab_epsilon, mab_ucb, mab_thompson, canary)
    experimentType: experimentTypeEnum('experiment_type').notNull().default('ab_test'),

    // MAB State (for multi-arm bandit experiments)
    mabState: jsonb('mab_state').$type<{
        strategy: 'epsilon_greedy' | 'ucb' | 'thompson_sampling';
        epsilon?: number;
        totalPulls: number;
        arms: Array<{
            armId: 'control' | 'variant';
            pulls: number;
            rewards: number;
            avgReward: number;
            ucbScore?: number;
            thompsonAlpha?: number;
            thompsonBeta?: number;
        }>;
        lastUpdated: Date;
    }>(),

    // Canary State (for canary deployments)
    canaryState: jsonb('canary_state').$type<{
        stage: 'initial' | 'ramp_1' | 'ramp_5' | 'ramp_25' | 'ramp_50' | 'full' | 'rolled_back';
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
    }>(),

    // Audit
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ==================== RELATIONS ====================

export const mlModelsRelations = relations(mlModels, ({ many }) => ({
    predictions: many(mlPredictions),
    performance: many(mlModelPerformance)
}));

export const mlPredictionsRelations = relations(mlPredictions, ({ one }) => ({
    model: one(mlModels, {
        fields: [mlPredictions.modelId],
        references: [mlModels.id]
    })
}));

export const mlModelPerformanceRelations = relations(mlModelPerformance, ({ one }) => ({
    model: one(mlModels, {
        fields: [mlModelPerformance.modelId],
        references: [mlModels.id]
    })
}));

// ==================== TYPE EXPORTS ====================

export type MLModel = typeof mlModels.$inferSelect;
export type NewMLModel = typeof mlModels.$inferInsert;

export type MLPrediction = typeof mlPredictions.$inferSelect;
export type NewMLPrediction = typeof mlPredictions.$inferInsert;

export type MLModelPerformance = typeof mlModelPerformance.$inferSelect;
export type NewMLModelPerformance = typeof mlModelPerformance.$inferInsert;

export type MLTrainingJob = typeof mlTrainingJobs.$inferSelect;
export type NewMLTrainingJob = typeof mlTrainingJobs.$inferInsert;

export type MLExperiment = typeof mlExperiments.$inferSelect;
export type NewMLExperiment = typeof mlExperiments.$inferInsert;
