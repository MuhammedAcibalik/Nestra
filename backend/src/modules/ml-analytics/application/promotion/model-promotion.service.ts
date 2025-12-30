
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createModuleLogger } from '../../../../core/logger';
import { ModelRegistryService, MLModelType } from '../../infrastructure/registry';
import { mlPredictions, mlModels } from '../../../../db/schema/ml-analytics';
import { eq, and, desc, gte, isNotNull } from 'drizzle-orm';

const logger = createModuleLogger('ModelPromotion');

interface IPromotionConfig {
    minPredictions: number;
    improvementThreshold: number; // e.g. 0.05 for 5% improvement
    evaluationWindowDays: number;
}

export class ModelPromotionService {
    private config: IPromotionConfig = {
        minPredictions: 50,
        improvementThreshold: 0.05,
        evaluationWindowDays: 7
    };

    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool },
        private readonly registry: ModelRegistryService
    ) { }

    /**
     * Staging (Shadow) modelleri değerlendirir ve gerekirse production'a taşır.
     */
    async evaluateAndPromote(): Promise<void> {
        logger.info('Starting model evaluation process...');

        const modelTypes: MLModelType[] = [
            'waste_predictor',
            'time_estimator',
            'algorithm_selector',
            'anomaly_predictor'
        ];

        for (const type of modelTypes) {
            await this.evaluateModelType(type);
        }

        logger.info('Model evaluation completed.');
    }

    private async evaluateModelType(modelType: MLModelType): Promise<void> {
        // 1. Production ve Shadow modelleri bul
        const prodResult = await this.registry.getProductionModel(modelType);
        const shadowResult = await this.registry.getShadowModels(modelType);

        if (!prodResult.success || !prodResult.data) {
            logger.warn(`No production model found for ${modelType}, skipping evaluation.`);
            return; // İlk model manuel promote edilmeli veya ayrı bir "Init" süreci olmalı.
        }

        if (!shadowResult.success || !shadowResult.data || shadowResult.data.length === 0) {
            logger.debug(`No shadow models found for ${modelType}.`);
            return;
        }

        const productionModel = prodResult.data;
        const shadowModels = shadowResult.data;

        // 2. Production performansını hesapla
        const prodMetrics = await this.calculateMetrics(productionModel.id, productionModel.modelType);
        if (prodMetrics.count < this.config.minPredictions) {
            logger.debug(`Not enough feedback data for production model ${productionModel.version}`, { count: prodMetrics.count });
            return;
        }

        logger.info(`Production Model (${productionModel.version}) Metrics`, prodMetrics);

        // 3. Shadow modelleri kıyasla
        for (const shadow of shadowModels) {
            const shadowMetrics = await this.calculateMetrics(shadow.id, shadow.modelType);

            if (shadowMetrics.count < this.config.minPredictions) {
                logger.debug(`Not enough feedback data for shadow model ${shadow.version}`, { count: shadowMetrics.count });
                continue;
            }

            logger.info(`Shadow Model (${shadow.version}) Metrics`, shadowMetrics);

            // Kıyaslama Mantığı (Hata oranı azalmalı)
            const improvement = (prodMetrics.errorRate - shadowMetrics.errorRate) / prodMetrics.errorRate;

            if (improvement > this.config.improvementThreshold) {
                logger.info(`✨ PROMOTION TRIGGERED: Shadow model ${shadow.version} is ${improvement.toFixed(2)}% better than production.`);

                await this.registry.promoteToProduction(shadow.id, 'auto-promoter');
                // Diğer shadow modeller ne olacak? Şimdilik kalsınlar veya arşivlensinler.
            } else {
                // Eğer performans çok kötüyse (> %20 kötü), shadow modeli arşivle/kapat.
                if (improvement < -0.20) {
                    logger.warn(`Shadow model ${shadow.version} is significantly worse (${improvement}). Archiving.`);
                    await this.registry.archiveModel(shadow.id);
                }
            }
        }
    }

    private async calculateMetrics(modelId: string, modelType: MLModelType): Promise<{ errorRate: number; count: number }> {
        // Son X gündeki tahminler ve feedbackler
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - this.config.evaluationWindowDays);

        const predictions = await this.db.select({
            formattedPrediction: mlPredictions.formattedPrediction,
            actualValue: mlPredictions.actualValue
        })
            .from(mlPredictions)
            .where(and(
                eq(mlPredictions.modelId, modelId),
                gte(mlPredictions.createdAt, startDate),
                isNotNull(mlPredictions.actualValue)
            ));

        if (predictions.length === 0) return { errorRate: 999, count: 0 };

        let totalError = 0;
        let validCount = 0;

        for (const p of predictions) {
            if (!p.formattedPrediction || !p.actualValue) continue;

            const predRaw = p.formattedPrediction as Record<string, any>;
            const actualRaw = p.actualValue as Record<string, any>;

            // Model tipine göre hata hesaplama
            let error = 0;
            switch (modelType) {
                case 'waste_predictor':
                    // MSE: (Predicted - Actual)^2
                    const pWaste = Number(predRaw.predictedWastePercent || 0);
                    const aWaste = Number(actualRaw.wastePercent || actualRaw.actualWastePercent || 0);
                    error = Math.pow(pWaste - aWaste, 2);
                    break;
                case 'time_estimator':
                    const pTime = Number(predRaw.estimatedMinutes || 0);
                    const aTime = Number(actualRaw.productionTimeMinutes || actualRaw.actualTime || 0);
                    error = Math.pow(pTime - aTime, 2);
                    break;
                case 'algorithm_selector':
                    // Classification Error (0 or 1)
                    const pAlgo = String(predRaw.recommendedAlgorithm);
                    const aAlgo = String(actualRaw.algorithm || actualRaw.usedAlgorithm);
                    error = pAlgo === aAlgo ? 0 : 1;
                    break;
                default:
                    error = 0;
            }

            totalError += error;
            validCount++;
        }

        if (validCount === 0) return { errorRate: 999, count: 0 };

        // RMSE veya Error Rate dön
        const finalMetric = modelType === 'algorithm_selector'
            ? totalError / validCount // Accuracy error rate
            : Math.sqrt(totalError / validCount); // RMSE

        return { errorRate: finalMetric, count: validCount };
    }
}
