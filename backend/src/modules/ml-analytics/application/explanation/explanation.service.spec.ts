
import { ExplanationService } from './explanation.service';
import { ModelRegistryService } from '../../infrastructure/registry';
import { PythonBridgeService } from '../../infrastructure/python';
import { createMockDb } from '../../../../../test/mocks/db.mock';
import { mlPredictions } from '../../../../db/schema/ml-analytics';
import { eq } from 'drizzle-orm';
import { ILocalExplanation, IGlobalExplanation, IMLModelMetadata } from '../../domain';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { MLModel } from '../../../../db/schema/ml-analytics';

// Mocks
jest.mock('../../infrastructure/registry');
jest.mock('../../infrastructure/python');
jest.mock('../../../../core/logger', () => ({
    createModuleLogger: () => ({ error: jest.fn(), info: jest.fn() })
}));

describe('ExplanationService', () => {
    let service: ExplanationService;
    let dbMock: ReturnType<typeof createMockDb>;
    let pythonBridgeMock: jest.Mocked<PythonBridgeService>;
    let registryMock: jest.Mocked<ModelRegistryService>;

    beforeEach(() => {
        dbMock = createMockDb();
        pythonBridgeMock = new PythonBridgeService() as jest.Mocked<PythonBridgeService>;
        registryMock = new ModelRegistryService(dbMock as unknown as NodePgDatabase<Record<string, unknown>> & { $client: Pool }) as jest.Mocked<ModelRegistryService>;

        // Manual injection of mocks (since they are instantiated inside constructor usually)
        // We will mock the constructor logic by forcing the prototype or using a factory if DI was clearer.
        // For this test, we assume we can spyOn/mock implementation of the imported classes.

        // Since the service instantiates them in constructor:
        // this.pythonBridge = new PythonBridgeService();
        // this.registry = new ModelRegistryService(db);

        // We rely on Jest auto-mocking of the modules
        service = new ExplanationService(dbMock as unknown as NodePgDatabase<Record<string, unknown>> & { $client: Pool });

        // Inject mocks into private properties safely for testing
        Object.assign(service, { pythonBridge: pythonBridgeMock, registry: registryMock });
    });

    describe('explainPrediction', () => {
        it('should return cached explanation if exists', async () => {
            const mockExplanation: ILocalExplanation = {
                baseline: 10,
                contributions: { featureA: 5 }
            };

            dbMock.select.mockReturnThis();
            dbMock.from.mockReturnThis();
            dbMock.where.mockResolvedValue([{
                id: 'pred-1',
                localExplanation: mockExplanation
            }]);

            const result = await service.explainPrediction('pred-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockExplanation);
            expect(pythonBridgeMock.generateExplanation).not.toHaveBeenCalled();
            expect(dbMock.from).toHaveBeenCalledWith(mlPredictions);
        });

        it('should generate explanation via PythonBridge if not cached', async () => {
            // 1. Mock DB returning prediction without explanation
            dbMock.select.mockReturnThis();
            dbMock.from.mockReturnThis();
            // Use mockResolvedValueOnce so strictly the first call (select) gets this. 
            // The second call (update...where) will effectively get undefined or default mock return (if any), which is fine for update.
            dbMock.where.mockResolvedValueOnce([{
                id: 'pred-1',
                modelId: 'model-1',
                inputFeatures: { width: 100 },
                localExplanation: null
            }]);

            // 2. Mock Registry returning model
            registryMock.getModel.mockResolvedValue({
                success: true,
                data: {
                    modelType: 'waste_predictor',
                    modelPath: '/path/to/model.onnx'
                } as unknown as MLModel
            });

            // 3. Mock PythonBridge returning explanation
            const generatedExplanation: ILocalExplanation = {
                baseline: 0,
                contributions: { width: 10 }
            };
            pythonBridgeMock.generateExplanation.mockResolvedValue({
                success: true,
                data: generatedExplanation
            });

            // 4. Mock DB Update
            dbMock.update.mockReturnThis();
            dbMock.set.mockReturnThis();
            // We don't strictly need to mock where return for update if we don't await result, but we do await it.
            // Let's return empty object for update result
            dbMock.where.mockResolvedValueOnce({});

            const result = await service.explainPrediction('pred-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(generatedExplanation);
            expect(registryMock.getModel).toHaveBeenCalledWith('model-1');
            expect(pythonBridgeMock.generateExplanation).toHaveBeenCalledWith(
                'waste_predictor',
                '/path/to/model.onnx',
                { width: 100 }
            );
            expect(dbMock.update).toHaveBeenCalled();
            expect(dbMock.from).toHaveBeenCalledWith(mlPredictions);
        });
    });

    describe('getGlobalExplanation', () => {
        it('should return global explanation from production model', async () => {
            const mockGlobalExpl: IGlobalExplanation = {
                shapValues: { f1: 0.5 },
                featureImportance: { f1: 0.8 }
            };

            registryMock.getProductionModel.mockResolvedValue({
                success: true,
                data: { globalExplanations: mockGlobalExpl } as unknown as MLModel
            });

            const result = await service.getGlobalExplanation('waste_predictor');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockGlobalExpl);
        });
    });
});
