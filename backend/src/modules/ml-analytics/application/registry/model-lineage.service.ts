/**
 * Model Lineage Service
 * Tracks model ancestry, training data, and hyperparameters
 * 
 * Features:
 * - Parent model tracking
 * - Training data hash
 * - Hyperparameter snapshot
 * - Metric history
 * - Lineage graph traversal
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, eq, desc, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { createModuleLogger } from '../../../../core/logger';
import { mlModels, mlTrainingJobs } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('ModelLineage');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export interface IModelLineage {
    modelId: string;
    modelType: MLModelType;
    version: string;
    parentModelId?: string;
    parentVersion?: string;
    lineageDepth: number;

    training: {
        trainingJobId?: string;
        trainingDataHash: string;
        sampleCount: number;
        startedAt?: Date;
        completedAt?: Date;
        durationSeconds?: number;
    };

    hyperparameters: Record<string, unknown>;

    metrics: {
        trainLoss?: number;
        valLoss?: number;
        accuracy?: number;
        precision?: number;
        recall?: number;
        f1Score?: number;
        customMetrics?: Record<string, number>;
    };

    artifacts: {
        modelPath: string;
        weightsHash?: string;
        onnxExported?: boolean;
        artifactSize?: number;
    };

    metadata: {
        createdAt: Date;
        createdBy?: string;
        description?: string;
        tags: string[];
        environment?: string;
    };
}

export interface ILineageNode {
    modelId: string;
    version: string;
    modelType: MLModelType;
    parentId?: string;
    children: string[];
    depth: number;
    metrics?: Record<string, number>;
    createdAt: Date;
}

export interface ILineageGraph {
    root: ILineageNode | null;
    nodes: Map<string, ILineageNode>;
    maxDepth: number;
    totalModels: number;
}

export interface IModelComparison {
    modelA: { id: string; version: string; metrics: Record<string, number> };
    modelB: { id: string; version: string; metrics: Record<string, number> };
    metricDifferences: Record<string, {
        delta: number;
        percentChange: number;
        improved: boolean;
    }>;
    winner: 'A' | 'B' | 'tie';
    recommendation: string;
}

// ==================== SERVICE ====================

export class ModelLineageService {
    constructor(
        private readonly db: Database
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Record lineage for a newly trained model
     */
    async recordLineage(
        modelId: string,
        trainingJobId: string,
        trainingData: unknown[],
        hyperparameters: Record<string, unknown>,
        metrics: IModelLineage['metrics'],
        parentModelId?: string
    ): Promise<IServiceResult<IModelLineage>> {
        try {
            // Get model info
            const [model] = await this.db
                .select()
                .from(mlModels)
                .where(eq(mlModels.id, modelId));

            if (!model) {
                return { success: false, error: 'Model not found' };
            }

            // Calculate training data hash
            const trainingDataHash = this.calculateDataHash(trainingData);

            // Get parent info
            let parentVersion: string | undefined;
            let lineageDepth = 1;

            if (parentModelId) {
                const [parent] = await this.db
                    .select()
                    .from(mlModels)
                    .where(eq(mlModels.id, parentModelId));

                if (parent) {
                    parentVersion = parent.version;
                    // Would need to recursively calculate depth in a real implementation
                    lineageDepth = 2;
                }
            }

            // Get training job info
            let trainingInfo: IModelLineage['training'] = {
                trainingJobId,
                trainingDataHash,
                sampleCount: trainingData.length
            };

            if (trainingJobId) {
                const [job] = await this.db
                    .select()
                    .from(mlTrainingJobs)
                    .where(eq(mlTrainingJobs.id, trainingJobId));

                if (job) {
                    const durationMs = job.startTime && job.endTime
                        ? new Date(job.endTime).getTime() - new Date(job.startTime).getTime()
                        : undefined;

                    trainingInfo = {
                        ...trainingInfo,
                        startedAt: job.startTime ?? undefined,
                        completedAt: job.endTime ?? undefined,
                        durationSeconds: durationMs ? Math.round(durationMs / 1000) : undefined
                    };
                }
            }

            const lineage: IModelLineage = {
                modelId,
                modelType: model.modelType as MLModelType,
                version: model.version,
                parentModelId,
                parentVersion,
                lineageDepth,
                training: trainingInfo,
                hyperparameters,
                metrics,
                artifacts: {
                    modelPath: model.modelPath,
                    onnxExported: model.modelPath.endsWith('.onnx')
                },
                metadata: {
                    createdAt: model.createdAt ?? new Date(),
                    description: model.description ?? undefined,
                    tags: [],
                    environment: process.env.NODE_ENV
                }
            };

            // Store lineage info in model description as JSON (using existing field)
            const lineageJsonString = JSON.stringify({
                parentModelId,
                trainingDataHash,
                hyperparameters,
                metrics
            });

            const newDescription = model.description
                ? `${model.description}\n---LINEAGE---\n${lineageJsonString}`
                : `---LINEAGE---\n${lineageJsonString}`;

            await this.db
                .update(mlModels)
                .set({
                    description: newDescription
                })
                .where(eq(mlModels.id, modelId));

            logger.info('Model lineage recorded', {
                modelId,
                version: model.version,
                parentModelId,
                depth: lineageDepth
            });

            return { success: true, data: lineage };

        } catch (error) {
            logger.error('Failed to record lineage', { modelId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Lineage recording failed'
            };
        }
    }

    /**
     * Get lineage for a specific model
     */
    async getLineage(modelId: string): Promise<IServiceResult<IModelLineage | null>> {
        try {
            const [model] = await this.db
                .select()
                .from(mlModels)
                .where(eq(mlModels.id, modelId));

            if (!model) {
                return { success: true, data: null };
            }

            const lineageData = this.parseLineageFromDescription(model.description);

            const lineage: IModelLineage = {
                modelId: model.id,
                modelType: model.modelType as MLModelType,
                version: model.version,
                parentModelId: lineageData?.parentModelId,
                parentVersion: undefined,
                lineageDepth: 1,
                training: {
                    trainingDataHash: lineageData?.trainingDataHash ?? '',
                    sampleCount: 0
                },
                hyperparameters: lineageData?.hyperparameters ?? {},
                metrics: lineageData?.metrics ?? {},
                artifacts: {
                    modelPath: model.modelPath
                },
                metadata: {
                    createdAt: model.createdAt ?? new Date(),
                    description: this.getCleanDescription(model.description),
                    tags: []
                }
            };

            return { success: true, data: lineage };

        } catch (error) {
            logger.error('Failed to get lineage', { modelId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Lineage retrieval failed'
            };
        }
    }

    /**
     * Build complete lineage graph for a model type
     */
    async buildLineageGraph(modelType: MLModelType): Promise<IServiceResult<ILineageGraph>> {
        try {
            const models = await this.db
                .select()
                .from(mlModels)
                .where(eq(mlModels.modelType, modelType))
                .orderBy(desc(mlModels.createdAt));

            const nodes = new Map<string, ILineageNode>();
            let maxDepth = 0;

            // Build nodes
            for (const model of models) {
                const lineageData = this.parseLineageFromDescription(model.description);
                const parentId = lineageData?.parentModelId;

                nodes.set(model.id, {
                    modelId: model.id,
                    version: model.version,
                    modelType: model.modelType as MLModelType,
                    parentId,
                    children: [],
                    depth: 0,
                    metrics: lineageData?.metrics as Record<string, number> | undefined,
                    createdAt: model.createdAt ?? new Date()
                });
            }

            // Build relationships and calculate depths
            for (const [id, node] of nodes) {
                if (node.parentId && nodes.has(node.parentId)) {
                    nodes.get(node.parentId)!.children.push(id);
                }

                // Calculate depth
                let depth = 0;
                let current = node;
                while (current.parentId && nodes.has(current.parentId)) {
                    depth++;
                    current = nodes.get(current.parentId)!;
                }
                node.depth = depth;
                maxDepth = Math.max(maxDepth, depth);
            }

            // Find root (oldest model without parent)
            let root: ILineageNode | null = null;
            for (const node of nodes.values()) {
                if (!node.parentId) {
                    if (!root || node.createdAt < root.createdAt) {
                        root = node;
                    }
                }
            }

            return {
                success: true,
                data: {
                    root,
                    nodes,
                    maxDepth,
                    totalModels: models.length
                }
            };

        } catch (error) {
            logger.error('Failed to build lineage graph', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Graph building failed'
            };
        }
    }

    /**
     * Compare two models
     */
    async compareModels(
        modelAId: string,
        modelBId: string
    ): Promise<IServiceResult<IModelComparison>> {
        try {
            const [modelA] = await this.db.select().from(mlModels).where(eq(mlModels.id, modelAId));
            const [modelB] = await this.db.select().from(mlModels).where(eq(mlModels.id, modelBId));

            if (!modelA || !modelB) {
                return { success: false, error: 'One or both models not found' };
            }

            const lineageA = this.parseLineageFromDescription(modelA.description);
            const lineageB = this.parseLineageFromDescription(modelB.description);
            const metricsA = (lineageA?.metrics ?? {}) as Record<string, number>;
            const metricsB = (lineageB?.metrics ?? {}) as Record<string, number>;

            const allMetrics = new Set([...Object.keys(metricsA), ...Object.keys(metricsB)]);
            const metricDifferences: IModelComparison['metricDifferences'] = {};

            let aWins = 0;
            let bWins = 0;

            for (const metric of allMetrics) {
                const valA = metricsA[metric] ?? 0;
                const valB = metricsB[metric] ?? 0;
                const delta = valB - valA;
                const percentChange = valA !== 0 ? (delta / valA) * 100 : valB !== 0 ? 100 : 0;

                // For loss metrics, lower is better; for others, higher is better
                const isLossMetric = metric.toLowerCase().includes('loss');
                const improved = isLossMetric ? delta < 0 : delta > 0;

                if (improved) bWins++;
                else if (delta !== 0) aWins++;

                metricDifferences[metric] = { delta, percentChange, improved };
            }

            const winner: 'A' | 'B' | 'tie' = aWins > bWins ? 'A' : bWins > aWins ? 'B' : 'tie';

            return {
                success: true,
                data: {
                    modelA: { id: modelAId, version: modelA.version, metrics: metricsA },
                    modelB: { id: modelBId, version: modelB.version, metrics: metricsB },
                    metricDifferences,
                    winner,
                    recommendation: this.getComparisonRecommendation(winner, metricDifferences)
                }
            };

        } catch (error) {
            logger.error('Failed to compare models', { modelAId, modelBId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Comparison failed'
            };
        }
    }

    /**
     * Get ancestry chain for a model
     */
    async getAncestry(modelId: string): Promise<IServiceResult<string[]>> {
        try {
            const ancestry: string[] = [modelId];
            let currentId = modelId;

            for (let i = 0; i < 100; i++) { // Prevent infinite loops
                const [model] = await this.db
                    .select()
                    .from(mlModels)
                    .where(eq(mlModels.id, currentId));

                if (!model) break;

                const lineageData = this.parseLineageFromDescription(model.description);
                const parentId = lineageData?.parentModelId;

                if (!parentId) break;

                ancestry.push(parentId);
                currentId = parentId;
            }

            return { success: true, data: ancestry };

        } catch (error) {
            logger.error('Failed to get ancestry', { modelId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Ancestry retrieval failed'
            };
        }
    }

    // ==================== PRIVATE METHODS ====================

    private calculateDataHash(data: unknown[]): string {
        const content = JSON.stringify(data);
        return createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    private parseLineageFromDescription(description: string | null): {
        parentModelId?: string;
        trainingDataHash?: string;
        hyperparameters?: Record<string, unknown>;
        metrics?: IModelLineage['metrics'];
    } | null {
        if (!description || !description.includes('---LINEAGE---')) {
            return null;
        }

        try {
            const lineageStart = description.indexOf('---LINEAGE---') + '---LINEAGE---'.length;
            const lineageJson = description.substring(lineageStart).trim();
            return JSON.parse(lineageJson);
        } catch {
            return null;
        }
    }

    private getCleanDescription(description: string | null): string | undefined {
        if (!description) return undefined;
        if (!description.includes('---LINEAGE---')) return description;
        return description.split('---LINEAGE---')[0].trim() || undefined;
    }

    private getComparisonRecommendation(
        winner: 'A' | 'B' | 'tie',
        differences: IModelComparison['metricDifferences']
    ): string {
        const significantImprovements = Object.entries(differences)
            .filter(([_, d]) => d.improved && Math.abs(d.percentChange) > 5)
            .map(([name]) => name);

        if (winner === 'tie') {
            return 'Models perform similarly. Consider other factors like latency or model size.';
        }

        if (significantImprovements.length > 0) {
            return `Model ${winner} is recommended. Significant improvements in: ${significantImprovements.join(', ')}`;
        }

        return `Model ${winner} shows marginal improvements. Consider A/B testing before full deployment.`;
    }
}

// ==================== FACTORY ====================

export function createModelLineageService(db: Database): ModelLineageService {
    return new ModelLineageService(db);
}
