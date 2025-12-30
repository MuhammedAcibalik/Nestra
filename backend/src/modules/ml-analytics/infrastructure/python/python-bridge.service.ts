/**
 * Python Bridge Service
 * Executes Python scripts for ML training and advanced inference
 */

import { spawn } from 'child_process';
import path from 'path';
import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult, ILocalExplanation } from '../../domain';

const logger = createModuleLogger('PythonBridge');

export interface IPythonExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
}

export class PythonBridgeService {
    private readonly pythonPath: string;
    private readonly scriptsDir: string;

    constructor() {
        // Use python from env or default to 'python'
        this.pythonPath = process.env.PYTHON_PATH || 'python';
        this.scriptsDir = path.join(process.cwd(), 'src', 'modules', 'ml-analytics', 'training');
    }

    /**
     * Execute a python script
     */
    async executeScript(
        scriptName: string,
        args: string[] = [],
        options: {
            cwd?: string;
            timeout?: number;
            env?: NodeJS.ProcessEnv;
        } = {}
    ): Promise<IServiceResult<IPythonExecutionResult>> {
        const scriptPath = path.join(this.scriptsDir, scriptName);
        const startTime = Date.now();

        logger.info('Executing Python script', { script: scriptName, args });

        return new Promise((resolve) => {
            const child = spawn(this.pythonPath, [scriptPath, ...args], {
                cwd: options.cwd || this.scriptsDir,
                env: { ...process.env, ...options.env },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            const timeoutId = options.timeout ? setTimeout(() => {
                child.kill();
                resolve({
                    success: false,
                    error: `Script execution timed out after ${options.timeout}ms`
                });
            }, options.timeout) : null;

            child.on('close', (code) => {
                if (timeoutId) clearTimeout(timeoutId);

                const durationMs = Date.now() - startTime;
                logger.info('Python script completed', {
                    script: scriptName,
                    exitCode: code,
                    durationMs
                });

                if (code === 0) {
                    resolve({
                        success: true,
                        data: {
                            stdout,
                            stderr,
                            exitCode: code,
                            durationMs
                        }
                    });
                } else {
                    logger.error('Python script failed', { script: scriptName, code, stderr });
                    resolve({
                        success: false,
                        error: `Script executed with exit code ${code}. Stderr: ${stderr}`
                    });
                }
            });

            child.on('error', (err) => {
                if (timeoutId) clearTimeout(timeoutId);
                logger.error('Failed to spawn python process', { error: err });
                resolve({
                    success: false,
                    error: `Failed to spawn python process: ${err.message}`
                });
            });
        });
    }

    /**
     * Train model
     */
    async trainModel(
        modelType: string,
        trainingDataPath: string,
        outputModelPath: string,
        hyperparameters: Record<string, unknown> = {}
    ): Promise<IServiceResult<IPythonExecutionResult>> {
        const scriptMap: Record<string, string> = {
            'waste_predictor': 'train_waste_predictor.py',
            'time_estimator': 'train_time_estimator.py',
            'algorithm_selector': 'train_algorithm_selector.py',
            'anomaly_predictor': 'train_anomaly_predictor.py'
        };

        const scriptName = scriptMap[modelType];
        if (!scriptName) {
            return { success: false, error: `No training script found for model type: ${modelType}` };
        }

        // Pass arguments as JSON string
        const args = [
            '--data_path', trainingDataPath,
            '--output_path', outputModelPath,
            '--params', JSON.stringify(hyperparameters)
        ];

        return this.executeScript(scriptName, args, { timeout: 30 * 60 * 1000 }); // 30 min timeout
    }
    async generateExplanation(
        modelType: string,
        modelPath: string,
        inputData: Record<string, unknown>,
        backgroundDataPath?: string
    ): Promise<IServiceResult<ILocalExplanation>> {
        const scriptName = 'explain_model.py';

        // Pass arguments as JSON string
        const args = [
            '--model_type', modelType,
            '--model_path', modelPath,
            '--input_data', JSON.stringify(inputData)
        ];

        if (backgroundDataPath) {
            args.push('--background_data', backgroundDataPath);
        }

        const result = await this.executeScript(scriptName, args, { timeout: 10000 }); // 10s timeout

        if (!result.success || !result.data) {
            return { success: false, error: result.error || 'Explanation generation failed' };
        }

        try {
            // Parse stdout JSON
            // Stdout might contain logs, so we need to extract JSON
            // Assuming script prints ONLY JSON or marked JSON
            const output = result.data.stdout.trim();
            // Simple heuristics: find last JSON object
            const jsonStart = output.lastIndexOf('{');
            const jsonEnd = output.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                return { success: false, error: 'Invalid JSON output from explain script' };
            }

            const jsonStr = output.substring(jsonStart, jsonEnd + 1);
            const explanation = JSON.parse(jsonStr) as ILocalExplanation;
            return { success: true, data: explanation };
        } catch (e) {
            return { success: false, error: 'Failed to parse explanation output' };
        }
    }
}
