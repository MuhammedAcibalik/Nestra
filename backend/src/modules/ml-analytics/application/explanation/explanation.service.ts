
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions, mlModels, modelTypeEnum } from '../../../../db/schema/ml-analytics';
type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';
import { eq, and } from 'drizzle-orm';
import { PythonBridgeService } from '../../infrastructure/python';
import { ModelRegistryService } from '../../infrastructure/registry';
import { IServiceResult, ILocalExplanation, IGlobalExplanation } from '../../domain';

const logger = createModuleLogger('ExplanationService');

export class ExplanationService {
    private readonly pythonBridge: PythonBridgeService;
    private readonly registry: ModelRegistryService;

    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) {
        this.pythonBridge = new PythonBridgeService();
        this.registry = new ModelRegistryService(db);
    }

    /**
     * Get local explanation for a specific prediction
     */
    async explainPrediction(predictionId: string): Promise<IServiceResult<ILocalExplanation>> {
        try {
            // 1. Check if explanation already exists
            const [prediction] = await this.db
                .select()
                .from(mlPredictions)
                .where(eq(mlPredictions.id, predictionId));

            if (!prediction) {
                return { success: false, error: 'Prediction not found' };
            }

            if (prediction.localExplanation) {
                return { success: true, data: prediction.localExplanation as unknown as ILocalExplanation };
            }

            // 2. Need to compute explanation
            // Get model path to pass to Python script
            // If model is shadowed or generic, we need to find the correct file

            // We need the modelId to look up the model path
            if (!prediction.modelId) {
                // If modelId is missing (legacy?), we might need to fallback to current production model
                return { success: false, error: 'Model ID not linked to prediction' };
            }

            const modelResult = await this.registry.getModel(prediction.modelId);
            if (!modelResult.success || !modelResult.data) {
                return { success: false, error: 'Model file not found for explanation' };
            }

            const model = modelResult.data;

            // 3. Generate Explanation via Python Bridge
            const result = await this.pythonBridge.generateExplanation(
                model.modelType as string,
                model.modelPath,
                prediction.inputFeatures as Record<string, unknown>
            );

            if (!result.success || !result.data) {
                return { success: false, error: result.error || 'Failed to generate explanation' };
            }

            const explanation = result.data;

            // 4. Save explanation to DB
            await this.db
                .update(mlPredictions)
                .set({ localExplanation: explanation })
                .where(eq(mlPredictions.id, prediction.id));

            return { success: true, data: explanation };
        } catch (error) {
            logger.error('Failed to explain prediction', { error, predictionId });
            return { success: false, error: 'Internal failure during explanation' };
        }
    }

    /**
     * Get global explanation for a model
     */
    async getGlobalExplanation(modelType: MLModelType): Promise<IServiceResult<IGlobalExplanation>> {
        try {
            const prodModel = await this.registry.getProductionModel(modelType);
            if (!prodModel.success || !prodModel.data) {
                return { success: false, error: 'No production model found' };
            }

            return { success: true, data: prodModel.data.globalExplanations as unknown as IGlobalExplanation };
        } catch (error) {
            logger.error('Failed to get global explanation', { error });
            return { success: false, error: 'Failed to retrieve global explanation' };
        }
    }
}
