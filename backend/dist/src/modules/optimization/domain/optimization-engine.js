"use strict";
/**
 * Optimization Engine (Refactored)
 * Core orchestrator for optimization process
 * Following SRP - Only orchestration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationEngine = void 0;
const data_converter_1 = require("./data-converter");
const strategy_executor_1 = require("./strategy-executor");
class OptimizationEngine {
    dataLoader;
    executor;
    constructor(prisma) {
        this.dataLoader = new data_converter_1.DataLoader(prisma);
        this.executor = new strategy_executor_1.StrategyExecutor();
    }
    async execute(input) {
        const startTime = Date.now();
        try {
            // 1. Load cutting job
            const job = await this.dataLoader.loadCuttingJob(input.cuttingJobId);
            if (!job) {
                return this.failureResult('Cutting job not found');
            }
            // 2. Determine if 1D or 2D
            const is1D = this.is1DJob(job);
            // 3. Load available stock
            const stock = await this.dataLoader.loadAvailableStock(job.materialTypeId, job.thickness, is1D, input.parameters.selectedStockIds);
            if (stock.length === 0) {
                return this.failureResult('No available stock found');
            }
            // 4. Convert data and execute
            const jobData = data_converter_1.JobToAlgorithmConverter.toJobData(job);
            let planData;
            let executionTimeMs;
            if (is1D) {
                const pieces = data_converter_1.JobToAlgorithmConverter.to1DPieces(jobData);
                const stockData = data_converter_1.StockToAlgorithmConverter.to1DStock(stock);
                const result = this.executor.execute1D(pieces, stockData, input.parameters);
                executionTimeMs = result.executionTimeMs;
                if (!result.success || !result.result1D) {
                    return this.failureResult(result.error ?? 'Optimization failed');
                }
                planData = data_converter_1.ResultToLayoutConverter.from1DResult(result.result1D);
            }
            else {
                const pieces = data_converter_1.JobToAlgorithmConverter.to2DPieces(jobData);
                const stockData = data_converter_1.StockToAlgorithmConverter.to2DStock(stock);
                const result = this.executor.execute2D(pieces, stockData, input.parameters);
                executionTimeMs = result.executionTimeMs;
                if (!result.success || !result.result2D) {
                    return this.failureResult(result.error ?? 'Optimization failed');
                }
                planData = data_converter_1.ResultToLayoutConverter.from2DResult(result.result2D);
            }
            // 5. Return success result
            const metrics = {
                executionTimeMs,
                piecesProcessed: jobData.items.reduce((sum, i) => sum + i.quantity, 0),
                stockEvaluated: stock.length
            };
            return {
                success: true,
                planData,
                metrics
            };
        }
        catch (error) {
            return this.failureResult(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
    is1DJob(job) {
        return job.geometryType === 'LINEAR_1D';
    }
    failureResult(error) {
        return {
            success: false,
            error
        };
    }
}
exports.OptimizationEngine = OptimizationEngine;
//# sourceMappingURL=optimization-engine.js.map