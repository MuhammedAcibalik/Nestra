/**
 * Feature Extractor
 * Transforms raw domain data into ML feature vectors
 */

import {
    IWastePredictionFeatures,
    IAlgorithmSelectionFeatures,
    ITimeEstimationFeatures,
    IAnomalyPredictionFeatures
} from '../../domain';
import { createModuleLogger } from '../../../../core/logger';

const logger = createModuleLogger('FeatureExtractor');

// ==================== INTERFACES ====================

interface ICuttingJobData {
    id: string;
    materialTypeId: string;
    thickness: number;
    items: Array<{
        width?: number;
        height?: number;
        length?: number;
        quantity: number;
        canRotate?: boolean;
        grainDirection?: string;
    }>;
}

interface IStockData {
    id: string;
    width?: number;
    height?: number;
    length?: number;
    quantity: number;
    unitPrice?: number;
}

interface IMachineData {
    id: string;
    machineType: string;
    maxWidth?: number;
    maxLength?: number;
}

interface IHistoricalData {
    avgWastePercent: number;
    lastJobWaste: number;
    algorithmPerformance: {
        BOTTOM_LEFT: number;
        GUILLOTINE: number;
        MAXRECTS: number;
    };
    avgProductionTime: number;
    recentAnomalyCount: number;
}

// ==================== FEATURE EXTRACTOR CLASS ====================

export class FeatureExtractor {

    // Material type mapping (will be dynamic in production)
    private readonly materialTypeMap: Map<string, number> = new Map();
    private materialTypeCounter = 0;

    /**
     * Extract features for waste prediction
     */
    extractWastePredictionFeatures(
        job: ICuttingJobData,
        stock: IStockData[],
        params: { kerf: number; allowRotation: boolean },
        historical: Partial<IHistoricalData>
    ): IWastePredictionFeatures {
        // Piece analysis
        const pieces = this.expandPieces(job.items);
        const pieceAreas = pieces.map(p => this.calculateArea(p));
        const pieceAspectRatios = pieces.map(p => this.calculateAspectRatio(p));

        // Stock analysis
        const stockAreas = stock.map(s => this.calculateArea(s) * s.quantity);
        const totalStockArea = stockAreas.reduce((a, b) => a + b, 0);
        const avgStockArea = totalStockArea / Math.max(1, stock.length);

        // Calculate demand
        const totalDemand = pieceAreas.reduce((a, b) => a + b, 0);

        return {
            // Job characteristics
            totalPieceCount: pieces.length,
            uniquePieceCount: job.items.length,
            avgPieceArea: this.mean(pieceAreas),
            pieceAreaStdDev: this.stdDev(pieceAreas),
            minPieceArea: Math.min(...pieceAreas, 0),
            maxPieceArea: Math.max(...pieceAreas, 0),
            pieceAspectRatioMean: this.mean(pieceAspectRatios),
            pieceAspectRatioStdDev: this.stdDev(pieceAspectRatios),

            // Stock characteristics
            totalStockArea,
            stockSheetCount: stock.length,
            avgStockArea,
            stockAspectRatio: stock.length > 0
                ? this.mean(stock.map(s => this.calculateAspectRatio(s)))
                : 1,

            // Ratios
            totalDemandToStockRatio: totalStockArea > 0 ? totalDemand / totalStockArea : 0,
            pieceToStockSizeRatio: avgStockArea > 0
                ? this.mean(pieceAreas) / avgStockArea
                : 0,

            // Algorithm parameters
            kerf: params.kerf,
            allowRotation: params.allowRotation ? 1 : 0,

            // Material
            materialTypeIndex: this.getMaterialIndex(job.materialTypeId),

            // Historical
            historicalAvgWaste: historical.avgWastePercent ?? 15,
            lastJobWaste: historical.lastJobWaste ?? 15
        };
    }

    /**
     * Extract features for algorithm selection
     */
    extractAlgorithmSelectionFeatures(
        job: ICuttingJobData,
        stock: IStockData[],
        historical: Partial<IHistoricalData>
    ): IAlgorithmSelectionFeatures {
        const pieces = this.expandPieces(job.items);
        const pieceAreas = pieces.map(p => this.calculateArea(p));
        const avgArea = this.mean(pieceAreas);

        // Size categories
        const smallThreshold = avgArea * 0.3;
        const largeThreshold = avgArea * 1.5;

        const smallPieces = pieceAreas.filter(a => a < smallThreshold).length;
        const largePieces = pieceAreas.filter(a => a > largeThreshold).length;

        // Square pieces (aspect ratio close to 1)
        const squarePieces = job.items.filter(item => {
            const ratio = this.calculateAspectRatio(item);
            return ratio > 0.8 && ratio < 1.2;
        }).length;

        // Grain constraints
        const grainConstrained = job.items.filter(
            i => i.grainDirection && i.grainDirection !== 'NONE'
        ).length;

        // Standard sizes detection (simplified)
        const standardSizes = stock.filter(s => {
            const w = s.width ?? s.length ?? 0;
            const h = s.height ?? 1;
            return this.isStandardSize(w, h);
        }).length;

        return {
            pieceSizeVariance: this.variance(pieceAreas) / (avgArea * avgArea || 1),
            smallPieceRatio: pieces.length > 0 ? smallPieces / pieces.length : 0,
            largePieceRatio: pieces.length > 0 ? largePieces / pieces.length : 0,
            squarePieceRatio: job.items.length > 0 ? squarePieces / job.items.length : 0,

            uniqueShapeCount: job.items.length,
            rotationAllowed: job.items.some(i => i.canRotate !== false) ? 1 : 0,
            grainConstraintRatio: job.items.length > 0
                ? grainConstrained / job.items.length
                : 0,

            stockVariety: new Set(stock.map(s => `${s.width}_${s.height}`)).size,
            standardSizeRatio: stock.length > 0 ? standardSizes / stock.length : 0,

            bottomLeftHistoricalWaste: historical.algorithmPerformance?.BOTTOM_LEFT ?? 15,
            guillotineHistoricalWaste: historical.algorithmPerformance?.GUILLOTINE ?? 15,
            maxrectsHistoricalWaste: historical.algorithmPerformance?.MAXRECTS ?? 15,

            totalPieceCount: pieces.length,
            totalStockCount: stock.length
        };
    }

    /**
     * Extract features for time estimation
     */
    extractTimeEstimationFeatures(
        planData: {
            totalPieces: number;
            totalCuts: number;
            wastePercentage: number;
            stockUsedCount: number;
        },
        machine: IMachineData,
        materialTypeId: string,
        thickness: number,
        historical: Partial<IHistoricalData>
    ): ITimeEstimationFeatures {
        const machineTypeIndex = this.getMachineTypeIndex(machine.machineType);

        return {
            totalPieces: planData.totalPieces,
            totalCuts: planData.totalCuts,
            wastePercentage: planData.wastePercentage,
            stockUsedCount: planData.stockUsedCount,

            machineType: machineTypeIndex,
            machineSpeed: 1, // Normalized speed factor

            materialTypeIndex: this.getMaterialIndex(materialTypeId),
            thickness,

            averagePieceArea: 0, // Would be calculated from plan
            maxPieceArea: 0,

            operatorAvgTime: historical.avgProductionTime ?? 60,
            machineAvgTime: historical.avgProductionTime ?? 60
        };
    }

    /**
     * Extract features for anomaly prediction
     */
    extractAnomalyPredictionFeatures(
        currentMetrics: {
            waste: number;
            time: number;
            efficiency: number;
        },
        historical: {
            avgWaste: number;
            avgTime: number;
            avgEfficiency: number;
        },
        contextual: {
            recentAnomalyCount: number;
            dayOfWeek: number;
            hourOfDay: number;
        }
    ): IAnomalyPredictionFeatures {
        return {
            currentWaste: currentMetrics.waste,
            currentTime: currentMetrics.time,
            currentEfficiency: currentMetrics.efficiency,

            wasteDeviation: (currentMetrics.waste - historical.avgWaste) /
                (historical.avgWaste || 1),
            timeDeviation: (currentMetrics.time - historical.avgTime) /
                (historical.avgTime || 1),
            efficiencyDeviation: (currentMetrics.efficiency - historical.avgEfficiency) /
                (historical.avgEfficiency || 1),

            recentAnomalyCount: contextual.recentAnomalyCount,
            avgHistoricalWaste: historical.avgWaste,
            avgHistoricalTime: historical.avgTime,

            dayOfWeek: contextual.dayOfWeek,
            hourOfDay: contextual.hourOfDay,
            isWeekend: (contextual.dayOfWeek === 0 || contextual.dayOfWeek === 6) ? 1 : 0
        };
    }

    // ==================== HELPERS ====================

    private expandPieces(items: ICuttingJobData['items']): ICuttingJobData['items'] {
        const expanded: ICuttingJobData['items'] = [];
        items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                expanded.push({ ...item, quantity: 1 });
            }
        });
        return expanded;
    }

    private calculateArea(item: { width?: number; height?: number; length?: number }): number {
        const width = item.width ?? item.length ?? 0;
        const height = item.height ?? 1;
        return width * height;
    }

    private calculateAspectRatio(item: { width?: number; height?: number; length?: number }): number {
        const width = item.width ?? item.length ?? 1;
        const height = item.height ?? 1;
        return Math.min(width, height) / Math.max(width, height) || 1;
    }

    private getMaterialIndex(materialTypeId: string): number {
        if (!this.materialTypeMap.has(materialTypeId)) {
            this.materialTypeMap.set(materialTypeId, this.materialTypeCounter++);
        }
        return this.materialTypeMap.get(materialTypeId)!;
    }

    private getMachineTypeIndex(machineType: string): number {
        const types: Record<string, number> = {
            'PANEL_SAW': 0,
            'LASER': 1,
            'PLASMA': 2,
            'WATERJET': 3,
            'CNC_ROUTER': 4
        };
        return types[machineType] ?? 0;
    }

    private isStandardSize(width: number, height: number): boolean {
        const standardSizes = [
            [1220, 2440], [1250, 2500], [1500, 3000],
            [1000, 2000], [1525, 3050]
        ];
        return standardSizes.some(([sw, sh]) =>
            (Math.abs(width - sw) < 10 && Math.abs(height - sh) < 10) ||
            (Math.abs(width - sh) < 10 && Math.abs(height - sw) < 10)
        );
    }

    private mean(arr: number[]): number {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    private variance(arr: number[]): number {
        if (arr.length === 0) return 0;
        const m = this.mean(arr);
        return arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length;
    }

    private stdDev(arr: number[]): number {
        return Math.sqrt(this.variance(arr));
    }
}

// Singleton instance
export const featureExtractor = new FeatureExtractor();
