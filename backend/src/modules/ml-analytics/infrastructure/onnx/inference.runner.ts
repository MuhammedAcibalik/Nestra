/**
 * ONNX Inference Runner
 * Simplified inference execution with preprocessing
 */

import { onnxProvider, ort } from './onnx.provider';
import { createModuleLogger } from '../../../../core/logger';

const logger = createModuleLogger('InferenceRunner');

// ==================== TYPES ====================

export interface IInferenceResult<T = number[]> {
    output: T;
    inferenceTime: number;
    modelName: string;
}

export interface IBatchInferenceResult<T = number[][]> {
    outputs: T;
    inferenceTime: number;
    batchSize: number;
    modelName: string;
}

// ==================== RUNNER CLASS ====================

export class InferenceRunner {
    constructor(private readonly modelName: string) { }

    /**
     * Run single inference
     */
    async run(features: number[]): Promise<IInferenceResult> {
        const startTime = Date.now();

        // Create input tensor
        const inputTensor = onnxProvider.createTensor(features, [1, features.length]);

        // Run inference
        const results = await onnxProvider.runInference(this.modelName, {
            input: inputTensor
        });

        // Extract output
        const outputTensor = results.output as ort.Tensor;
        const output = Array.from(outputTensor.data as Float32Array);

        const inferenceTime = Date.now() - startTime;

        logger.debug('Inference completed', {
            modelName: this.modelName,
            inferenceTime
        });

        return {
            output,
            inferenceTime,
            modelName: this.modelName
        };
    }

    /**
     * Run batch inference
     */
    async runBatch(featuresBatch: number[][]): Promise<IBatchInferenceResult> {
        const startTime = Date.now();
        const batchSize = featuresBatch.length;
        const featureLength = featuresBatch[0].length;

        // Flatten batch into single array
        const flatData = new Float32Array(batchSize * featureLength);
        featuresBatch.forEach((features, i) => {
            flatData.set(features, i * featureLength);
        });

        // Create input tensor
        const inputTensor = onnxProvider.createTensor(flatData, [batchSize, featureLength]);

        // Run inference
        const results = await onnxProvider.runInference(this.modelName, {
            input: inputTensor
        });

        // Extract outputs
        const outputTensor = results.output as ort.Tensor;
        const outputData = Array.from(outputTensor.data as Float32Array);
        const outputLength = outputData.length / batchSize;

        // Reshape to batch
        const outputs: number[][] = [];
        for (let i = 0; i < batchSize; i++) {
            outputs.push(outputData.slice(i * outputLength, (i + 1) * outputLength));
        }

        const inferenceTime = Date.now() - startTime;

        logger.debug('Batch inference completed', {
            modelName: this.modelName,
            batchSize,
            inferenceTime
        });

        return {
            outputs,
            inferenceTime,
            batchSize,
            modelName: this.modelName
        };
    }

    /**
     * Run inference with softmax output (classification)
     */
    async runClassification(features: number[]): Promise<{
        classIndex: number;
        probabilities: number[];
        confidence: number;
        inferenceTime: number;
    }> {
        const result = await this.run(features);

        // Apply softmax if not already applied by model
        const probabilities = this.softmax(result.output);
        const classIndex = probabilities.indexOf(Math.max(...probabilities));
        const confidence = probabilities[classIndex];

        return {
            classIndex,
            probabilities,
            confidence,
            inferenceTime: result.inferenceTime
        };
    }

    /**
     * Check if model is ready
     */
    isReady(): boolean {
        return onnxProvider.isModelLoaded(this.modelName);
    }

    /**
     * Softmax helper
     */
    private softmax(arr: number[]): number[] {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sum);
    }
}

// ==================== FACTORY ====================

export function createInferenceRunner(modelName: string): InferenceRunner {
    return new InferenceRunner(modelName);
}
