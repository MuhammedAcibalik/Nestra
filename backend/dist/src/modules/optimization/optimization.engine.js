"use strict";
/**
 * Optimization Engine
 * Bridge layer between cutting algorithms and database
 * Following SRP - Only handles algorithm execution and data transformation
 * Following DIP - Uses service clients instead of direct database access
 *
 * NOW WITH PISCINA WORKER THREADS:
 * - Data fetching: Main thread (async I/O)
 * - Algorithm execution: Piscina pool (CPU-intensive)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationEngine = void 0;
const cutting1d_1 = require("../../algorithms/1d/cutting1d");
const cutting2d_1 = require("../../algorithms/2d/cutting2d");
const workers_1 = require("../../workers");
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('OptimizationEngine');
const tracer = api_1.trace.getTracer('optimization', '1.0.0');
// ==================== ENGINE CLASS ====================
class OptimizationEngine {
    cuttingJobClient;
    stockQueryClient;
    pool = null;
    useWorkerThreads;
    enableTracing;
    constructor(cuttingJobClient, stockQueryClient, config) {
        this.cuttingJobClient = cuttingJobClient;
        this.stockQueryClient = stockQueryClient;
        this.useWorkerThreads = config?.useWorkerThreads ?? true;
        this.enableTracing = config?.enableTracing ?? true;
    }
    /**
     * Initialize Piscina pool (call once at startup)
     */
    async initializeWorkers() {
        if (this.useWorkerThreads && !this.pool) {
            this.pool = (0, workers_1.getOptimizationPool)();
            await this.pool.initialize();
            logger.info('Piscina pool initialized');
        }
    }
    /**
     * Main entry point - runs optimization for a cutting job
     */
    async runOptimization(input) {
        if (!this.enableTracing) {
            return this.runOptimizationImpl(input);
        }
        const span = tracer.startSpan('optimization.run', {
            attributes: {
                'optimization.job_id': input.cuttingJobId,
                'optimization.scenario_id': input.scenarioId,
                'optimization.algorithm': input.parameters.algorithm ?? 'auto'
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await this.runOptimizationImpl(input);
                const duration = Date.now() - startTime;
                span.setAttribute('optimization.duration_ms', duration);
                span.setAttribute('optimization.success', result.success);
                span.setAttribute('optimization.efficiency', result.planData.efficiency);
                span.setAttribute('optimization.waste_percentage', result.planData.wastePercentage);
                span.setAttribute('optimization.stock_used', result.planData.stockUsedCount);
                span.setAttribute('optimization.unplaced_count', result.planData.unplacedCount);
                if (result.success) {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                }
                else {
                    span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: result.error });
                }
                return result;
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(semantic_conventions_1.ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Internal optimization implementation
     */
    async runOptimizationImpl(input) {
        try {
            // 1. Get cutting job with items via service client (MAIN THREAD - async I/O)
            const loadSpan = this.enableTracing ? tracer.startSpan('optimization.load_data') : null;
            const cuttingJob = await this.getCuttingJobWithItems(input.cuttingJobId);
            if (!cuttingJob) {
                loadSpan?.end();
                return { success: false, planData: this.emptyPlanData(), error: 'Cutting job not found' };
            }
            // 2. Determine if 1D or 2D based on geometry
            const is1D = this.is1DJob(cuttingJob);
            loadSpan?.setAttribute('optimization.is_1d', is1D);
            loadSpan?.setAttribute('optimization.pieces_count', cuttingJob.items.length);
            // 3. Get available stock via service client (MAIN THREAD - async I/O)
            const stock = await this.getAvailableStock(cuttingJob.materialTypeId, cuttingJob.thickness, is1D, input.parameters);
            loadSpan?.setAttribute('optimization.stock_count', stock.length);
            loadSpan?.end();
            if (stock.length === 0) {
                return { success: false, planData: this.emptyPlanData(), error: 'No available stock found' };
            }
            // 4. Run appropriate algorithm (PISCINA POOL or FALLBACK)
            if (is1D) {
                return this.run1DOptimization(cuttingJob, stock, input.parameters);
            }
            else {
                return this.run2DOptimization(cuttingJob, stock, input.parameters);
            }
        }
        catch (error) {
            return {
                success: false,
                planData: this.emptyPlanData(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get pool statistics
     */
    getPoolStats() {
        return this.pool?.getStats() ?? null;
    }
    // ==================== 1D OPTIMIZATION ====================
    async run1DOptimization(job, stock, params) {
        const pieces = this.convertTo1DPieces(job);
        const bars = this.convertTo1DStock(stock);
        const options = {
            algorithm: params.algorithm === '1D_BFD' ? 'BFD' : 'FFD',
            kerf: params.kerf ?? 3,
            minUsableWaste: params.minUsableWaste ?? 100
        };
        let result;
        // Try Piscina first, fallback to main thread
        const algoSpan = this.enableTracing ? tracer.startSpan('optimization.algorithm.1d', {
            attributes: {
                'algorithm.type': options.algorithm,
                'algorithm.pieces_count': pieces.length,
                'algorithm.stock_count': bars.length
            }
        }) : null;
        if (this.pool?.isReady() && this.useWorkerThreads) {
            try {
                algoSpan?.setAttribute('algorithm.execution_mode', 'worker');
                const payload = { pieces, stockBars: bars, options };
                result = await this.pool.run1D(payload);
                logger.debug('1D optimization completed in Piscina worker');
            }
            catch (error) {
                logger.warn('Piscina failed, falling back to main thread', { error });
                algoSpan?.setAttribute('algorithm.execution_mode', 'main_fallback');
                result = this.run1DSync(pieces, bars, options);
            }
        }
        else {
            algoSpan?.setAttribute('algorithm.execution_mode', 'main');
            result = this.run1DSync(pieces, bars, options);
        }
        algoSpan?.setAttribute('algorithm.bars_used', result.bars.length);
        algoSpan?.end();
        return {
            success: true,
            planData: this.convert1DResult(result, stock)
        };
    }
    run1DSync(pieces, bars, options) {
        if (options.algorithm === 'BFD') {
            return (0, cutting1d_1.bestFitDecreasing)(pieces, bars, options);
        }
        return (0, cutting1d_1.firstFitDecreasing)(pieces, bars, options);
    }
    convertTo1DPieces(job) {
        return job.items.map(item => ({
            id: item.id,
            length: item.orderItem?.length ?? 0,
            quantity: item.quantity,
            orderItemId: item.orderItemId,
            canRotate: false
        }));
    }
    convertTo1DStock(stock) {
        return stock.map(s => ({
            id: s.id,
            length: s.length ?? 0,
            available: s.quantity,
            unitPrice: s.unitPrice ?? undefined
        }));
    }
    convert1DResult(result, _stock) {
        const layouts = result.bars.map((bar, i) => ({
            stockItemId: bar.stockId,
            sequence: i + 1,
            waste: bar.waste,
            wastePercentage: bar.wastePercentage,
            layoutJson: JSON.stringify({
                barId: bar.stockId,
                barLength: bar.stockLength,
                cuts: bar.cuts,
                waste: bar.waste
            })
        }));
        return {
            totalWaste: result.totalWaste,
            wastePercentage: result.totalWastePercentage,
            stockUsedCount: result.stockUsedCount,
            efficiency: result.statistics.efficiency,
            layouts,
            unplacedCount: result.unplacedPieces.length
        };
    }
    // ==================== 2D OPTIMIZATION ====================
    async run2DOptimization(job, stock, params) {
        const pieces = this.convertTo2DPieces(job, params.allowRotation ?? true);
        const sheets = this.convertTo2DStock(stock);
        const options = {
            algorithm: params.algorithm === '2D_GUILLOTINE' ? 'GUILLOTINE' : 'BOTTOM_LEFT',
            kerf: params.kerf ?? 3,
            allowRotation: params.allowRotation ?? true,
            guillotineOnly: params.algorithm === '2D_GUILLOTINE'
        };
        let result;
        // Try Piscina first, fallback to main thread
        if (this.pool?.isReady() && this.useWorkerThreads) {
            try {
                const payload = { pieces, stockSheets: sheets, options };
                result = await this.pool.run2D(payload);
                logger.debug('2D optimization completed in Piscina worker');
            }
            catch (error) {
                logger.warn('Piscina failed, falling back to main thread', { error });
                result = this.run2DSync(pieces, sheets, options);
            }
        }
        else {
            result = this.run2DSync(pieces, sheets, options);
        }
        return {
            success: true,
            planData: this.convert2DResult(result, stock)
        };
    }
    run2DSync(pieces, sheets, options) {
        if (options.algorithm === 'GUILLOTINE') {
            return (0, cutting2d_1.guillotineCutting)(pieces, sheets, options);
        }
        return (0, cutting2d_1.bottomLeftFill)(pieces, sheets, options);
    }
    convertTo2DPieces(job, allowRotation) {
        return job.items.map(item => ({
            id: item.id,
            width: item.orderItem?.width ?? 0,
            height: item.orderItem?.length ?? 0,
            quantity: item.quantity,
            orderItemId: item.orderItemId,
            canRotate: allowRotation
        }));
    }
    convertTo2DStock(stock) {
        return stock.map(s => ({
            id: s.id,
            width: s.width ?? 0,
            height: s.length ?? 0,
            available: s.quantity,
            unitPrice: s.unitPrice ?? undefined
        }));
    }
    convert2DResult(result, _stock) {
        const layouts = result.sheets.map((sheet, i) => ({
            stockItemId: sheet.stockId,
            sequence: i + 1,
            waste: sheet.wasteArea,
            wastePercentage: sheet.wastePercentage,
            layoutJson: JSON.stringify({
                sheetId: sheet.stockId,
                sheetWidth: sheet.stockWidth,
                sheetHeight: sheet.stockHeight,
                placements: sheet.placements,
                waste: sheet.wasteArea
            })
        }));
        return {
            totalWaste: result.totalWasteArea,
            wastePercentage: result.totalWastePercentage,
            stockUsedCount: result.stockUsedCount,
            efficiency: result.statistics.efficiency,
            layouts,
            unplacedCount: result.unplacedPieces.length
        };
    }
    // ==================== HELPER METHODS ====================
    async getCuttingJobWithItems(jobId) {
        const response = await this.cuttingJobClient.getJobWithItems(jobId);
        return response.success ? response.data ?? null : null;
    }
    async getAvailableStock(materialTypeId, thickness, is1D, params) {
        const response = await this.stockQueryClient.getAvailableStock({
            materialTypeId,
            thickness: thickness ?? 0,
            stockType: is1D ? 'BAR_1D' : 'SHEET_2D',
            selectedStockIds: params.selectedStockIds
        });
        return response.success ? response.data ?? [] : [];
    }
    is1DJob(job) {
        if (job.items.length === 0)
            return true;
        const firstItem = job.items[0];
        return firstItem.orderItem?.geometryType === 'BAR_1D';
    }
    emptyPlanData() {
        return {
            totalWaste: 0,
            wastePercentage: 0,
            stockUsedCount: 0,
            efficiency: 0,
            layouts: [],
            unplacedCount: 0
        };
    }
}
exports.OptimizationEngine = OptimizationEngine;
//# sourceMappingURL=optimization.engine.js.map