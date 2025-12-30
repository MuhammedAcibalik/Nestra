/**
 * ONNX Runtime Provider
 * Centralized ONNX Runtime initialization and session management
 */

import * as ort from 'onnxruntime-node';
import { createModuleLogger } from '../../../../core/logger';
import path from 'node:path';
import fs from 'node:fs/promises';

const logger = createModuleLogger('ONNXProvider');

// ==================== TYPES ====================

export interface IONNXSessionOptions {
    executionProviders?: ('cuda' | 'cpu')[];
    graphOptimizationLevel?: 'disabled' | 'basic' | 'extended' | 'all';
    enableCpuMemArena?: boolean;
    logSeverityLevel?: number;
}

export interface IModelInfo {
    name: string;
    path: string;
    inputNames: string[];
    outputNames: string[];
    loaded: boolean;
}

// ==================== PROVIDER ====================

class ONNXProvider {
    private static instance: ONNXProvider;
    private sessions: Map<string, ort.InferenceSession> = new Map();
    private modelInfo: Map<string, IModelInfo> = new Map();
    private initialized = false;
    private readonly modelsDir: string;

    private constructor() {
        this.modelsDir = path.join(process.cwd(), 'models', 'onnx');
    }

    static getInstance(): ONNXProvider {
        if (!ONNXProvider.instance) {
            ONNXProvider.instance = new ONNXProvider();
        }
        return ONNXProvider.instance;
    }

    /**
     * Initialize ONNX Runtime
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            logger.debug('ONNX Runtime already initialized');
            return;
        }

        try {
            // Ensure models directory exists
            await fs.mkdir(this.modelsDir, { recursive: true });

            // Log available execution providers
            const availableProviders = ort.env.wasm?.numThreads
                ? ['cpu']
                : ['cuda', 'cpu'];

            logger.info('ONNX Runtime initialized', {
                modelsDir: this.modelsDir,
                availableProviders
            });

            this.initialized = true;
        } catch (error) {
            logger.error('Failed to initialize ONNX Runtime', { error });
            throw error;
        }
    }

    /**
     * Load a model from file
     */
    async loadModel(
        name: string,
        modelPath?: string,
        options?: IONNXSessionOptions
    ): Promise<boolean> {
        const fullPath = modelPath ?? path.join(this.modelsDir, `${name}.onnx`);

        try {
            // Check if file exists
            await fs.access(fullPath);

            // Create session options
            const sessionOptions: ort.InferenceSession.SessionOptions = {
                executionProviders: options?.executionProviders ?? ['cpu'],
                graphOptimizationLevel: options?.graphOptimizationLevel ?? 'all',
                enableCpuMemArena: options?.enableCpuMemArena ?? true,
                logSeverityLevel: (options?.logSeverityLevel ?? 3) as 0 | 1 | 2 | 3 | 4
            };

            // Create inference session
            const session = await ort.InferenceSession.create(fullPath, sessionOptions);

            // Store session
            this.sessions.set(name, session);

            // Store model info
            this.modelInfo.set(name, {
                name,
                path: fullPath,
                inputNames: [...session.inputNames],
                outputNames: [...session.outputNames],
                loaded: true
            });

            logger.info('Model loaded', {
                name,
                inputs: session.inputNames,
                outputs: session.outputNames
            });

            return true;
        } catch (error) {
            logger.warn('Model not found or failed to load', {
                name,
                path: fullPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            // Store as not loaded
            this.modelInfo.set(name, {
                name,
                path: fullPath,
                inputNames: [],
                outputNames: [],
                loaded: false
            });

            return false;
        }
    }

    /**
     * Run inference on a loaded model
     */
    async runInference(
        modelName: string,
        inputs: Record<string, ort.Tensor>
    ): Promise<ort.InferenceSession.OnnxValueMapType> {
        const session = this.sessions.get(modelName);

        if (!session) {
            throw new Error(`Model '${modelName}' not loaded`);
        }

        try {
            const results = await session.run(inputs);
            return results;
        } catch (error) {
            logger.error('Inference failed', { modelName, error });
            throw error;
        }
    }

    /**
     * Create a tensor from data
     */
    createTensor(
        data: Float32Array | number[],
        dims: number[]
    ): ort.Tensor {
        const floatData = data instanceof Float32Array
            ? data
            : new Float32Array(data);
        return new ort.Tensor('float32', floatData, dims);
    }

    /**
     * Get model info
     */
    getModelInfo(name: string): IModelInfo | undefined {
        return this.modelInfo.get(name);
    }

    /**
     * Check if model is loaded
     */
    isModelLoaded(name: string): boolean {
        return this.sessions.has(name);
    }

    /**
     * Get all loaded models
     */
    getLoadedModels(): string[] {
        return Array.from(this.sessions.keys());
    }

    /**
     * Dispose a specific model
     */
    async disposeModel(name: string): Promise<void> {
        const session = this.sessions.get(name);
        if (session) {
            // ONNX Runtime sessions don't have explicit dispose
            this.sessions.delete(name);
            this.modelInfo.delete(name);
            logger.debug('Model disposed', { name });
        }
    }

    /**
     * Dispose all models
     */
    async disposeAll(): Promise<void> {
        for (const name of this.sessions.keys()) {
            await this.disposeModel(name);
        }
        logger.debug('All ONNX models disposed');
    }

    /**
     * Get models directory path
     */
    getModelsDir(): string {
        return this.modelsDir;
    }

    /**
     * Reset for testing
     */
    static reset(): void {
        if (ONNXProvider.instance) {
            ONNXProvider.instance.sessions.clear();
            ONNXProvider.instance.modelInfo.clear();
            ONNXProvider.instance.initialized = false;
        }
        ONNXProvider.instance = undefined as unknown as ONNXProvider;
    }
}

// ==================== EXPORTS ====================

export const onnxProvider = ONNXProvider.getInstance();
export { ort };
