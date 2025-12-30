/**
 * ML Admin Controller Tests
 * Unit tests for model registry and prediction logging
 */

import { ABTestingService } from '../infrastructure/ab-testing/ab-testing.service';

describe('ABTestingService', () => {
    let service: ABTestingService;

    beforeEach(() => {
        // Create service with mock db
        service = new ABTestingService({} as any);
    });

    describe('createExperiment', () => {
        it('should create experiment with valid parameters', () => {
            const result = service.createExperiment(
                'Test Experiment',
                'waste_predictor',
                'control-model-id',
                'treatment-model-id',
                50,
                'Test description'
            );

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Test Experiment');
                expect(result.data.modelType).toBe('waste_predictor');
                expect(result.data.trafficSplit).toBe(50);
                expect(result.data.status).toBe('draft');
            }
        });

        it('should reject invalid traffic split', () => {
            const result = service.createExperiment(
                'Test',
                'waste_predictor',
                'control',
                'treatment',
                150 // Invalid
            );

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('Traffic split');
            }
        });
    });

    describe('experiment lifecycle', () => {
        it('should start and stop experiment', () => {
            const createResult = service.createExperiment(
                'Lifecycle Test',
                'time_estimator',
                'c1',
                't1',
                30
            );

            expect(createResult.success).toBe(true);
            if (!createResult.success) return;

            const experimentId = createResult.data.id;

            // Start
            const startResult = service.startExperiment(experimentId);
            expect(startResult.success).toBe(true);
            if (startResult.success) {
                expect(startResult.data.status).toBe('running');
            }

            // Stop
            const stopResult = service.stopExperiment(experimentId);
            expect(stopResult.success).toBe(true);
            if (stopResult.success) {
                expect(stopResult.data.status).toBe('completed');
            }
        });

        it('should not start already running experiment', () => {
            const createResult = service.createExperiment('Test', 'waste_predictor', 'c', 't', 50);
            if (!createResult.success) return;

            service.startExperiment(createResult.data.id);
            const secondStart = service.startExperiment(createResult.data.id);

            expect(secondStart.success).toBe(false);
        });
    });

    describe('traffic splitting', () => {
        it('should route traffic based on split', () => {
            const createResult = service.createExperiment('Split Test', 'algorithm_selector', 'c', 't', 70);
            if (!createResult.success) return;

            service.startExperiment(createResult.data.id);

            let controlCount = 0;
            let treatmentCount = 0;
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                const selection = service.selectModelForPrediction(createResult.data.id);
                if (selection.success && selection.data.isControl) {
                    controlCount++;
                } else if (selection.success && selection.data.isTreatment) {
                    treatmentCount++;
                }
            }

            // With 70% treatment split, treatment should be ~700, control ~300
            // Allow 10% margin of error
            expect(treatmentCount).toBeGreaterThan(600);
            expect(treatmentCount).toBeLessThan(800);
            expect(controlCount).toBeGreaterThan(200);
            expect(controlCount).toBeLessThan(400);
        });
    });

    describe('listExperiments', () => {
        it('should list all experiments', () => {
            service.createExperiment('E1', 'waste_predictor', 'c1', 't1', 50);
            service.createExperiment('E2', 'time_estimator', 'c2', 't2', 50);

            const result = service.listExperiments();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBe(2);
            }
        });

        it('should filter by model type', () => {
            service.createExperiment('E1', 'waste_predictor', 'c1', 't1', 50);
            service.createExperiment('E2', 'time_estimator', 'c2', 't2', 50);

            const result = service.listExperiments('waste_predictor');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBe(1);
                expect(result.data[0].modelType).toBe('waste_predictor');
            }
        });
    });

    describe('deleteExperiment', () => {
        it('should delete non-running experiment', () => {
            const createResult = service.createExperiment('Delete Test', 'anomaly_predictor', 'c', 't', 50);
            if (!createResult.success) return;

            const deleteResult = service.deleteExperiment(createResult.data.id);
            expect(deleteResult.success).toBe(true);
        });

        it('should not delete running experiment', () => {
            const createResult = service.createExperiment('Running Test', 'anomaly_predictor', 'c', 't', 50);
            if (!createResult.success) return;

            service.startExperiment(createResult.data.id);
            const deleteResult = service.deleteExperiment(createResult.data.id);

            expect(deleteResult.success).toBe(false);
            if (!deleteResult.success) {
                expect(deleteResult.error).toContain('running');
            }
        });
    });
});
