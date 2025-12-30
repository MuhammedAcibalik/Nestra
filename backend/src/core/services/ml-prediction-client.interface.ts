/**
 * ML Prediction Client Interface
 * Following DIP - OptimizationEngine depends on abstraction, not concrete implementation
 * 
 * This interface defines the contract for ML prediction services
 * used by the optimization engine to make intelligent decisions.
 */

// ==================== TYPES ====================

export type MLAlgorithmSuggestion = '1D_FFD' | '1D_BFD' | '2D_BOTTOM_LEFT' | '2D_GUILLOTINE';

export interface IMLServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ==================== PREDICTION INPUTS ====================

export interface IWastePredictionInput {
    /** Total number of pieces to cut */
    totalPieceCount: number;
    /** Number of unique piece dimensions */
    uniquePieceCount: number;
    /** Average piece area in mm² */
    avgPieceArea: number;
    /** Standard deviation of piece areas */
    pieceAreaStdDev: number;
    /** Minimum piece area */
    minPieceArea: number;
    /** Maximum piece area */
    maxPieceArea: number;
    /** Mean aspect ratio of pieces */
    pieceAspectRatioMean: number;
    /** Standard deviation of aspect ratios */
    pieceAspectRatioStdDev: number;
    /** Total stock area available in mm² */
    totalStockArea: number;
    /** Number of stock sheets/bars */
    stockSheetCount: number;
    /** Average stock area */
    avgStockArea: number;
    /** Stock aspect ratio */
    stockAspectRatio: number;
    /** Ratio of total demand to total stock */
    totalDemandToStockRatio: number;
    /** Average piece size relative to stock */
    pieceToStockSizeRatio: number;
    /** Kerf (blade width) in mm */
    kerf: number;
    /** Whether rotation is allowed (1=yes, 0=no) */
    allowRotation: number;
    /** Material type index */
    materialTypeIndex: number;
    /** Historical average waste percentage */
    historicalAvgWaste: number;
    /** Last job waste percentage */
    lastJobWaste: number;
}

export interface IAlgorithmSelectionInput {
    /** Is this a 1D optimization problem */
    is1D: boolean;
    /** Total pieces to place */
    totalPieceCount: number;
    /** Unique piece types */
    uniquePieceCount: number;
    /** Piece area variance (normalized) */
    pieceAreaVariance: number;
    /** Mean piece aspect ratio */
    pieceAspectRatioMean: number;
    /** Stock sheet count */
    stockCount: number;
    /** Historical performance per algorithm */
    algorithmPerformance?: {
        BOTTOM_LEFT?: number;
        GUILLOTINE?: number;
        FFD?: number;
        BFD?: number;
    };
}

export interface ITimePredictionInput {
    /** Is this a 1D optimization */
    is1D: boolean;
    /** Algorithm to use */
    algorithm: string;
    /** Total pieces */
    pieceCount: number;
    /** Stock sheet count */
    stockCount: number;
    /** Historical average time for this job type */
    historicalAvgTime?: number;
}

// ==================== PREDICTION OUTPUTS ====================

export interface IWastePredictionResult {
    /** Predicted waste percentage (0-100) */
    predictedWastePercent: number;
    /** Confidence score (0-1) */
    confidence: number;
    /** Model version used */
    modelVersion: string;
    /** Prediction ID for tracking */
    predictionId: string;
}

export interface IAlgorithmSelectionResult {
    /** Recommended algorithm */
    recommendedAlgorithm: MLAlgorithmSuggestion;
    /** Confidence score (0-1) */
    confidence: number;
    /** Scores per algorithm */
    scores: Record<string, number>;
    /** Model version */
    modelVersion: string;
}

export interface ITimePredictionResult {
    /** Predicted time in seconds */
    predictedTimeSeconds: number;
    /** Confidence score (0-1) */
    confidence: number;
    /** Model version */
    modelVersion: string;
}

// ==================== CLIENT INTERFACE ====================

/**
 * Interface for ML Prediction Client
 * Following Dependency Inversion Principle (DIP)
 * 
 * OptimizationEngine depends on this abstraction,
 * not the concrete EnhancedPredictionService implementation.
 */
export interface IMLPredictionClient {
    /**
     * Predict waste percentage before optimization
     */
    predictWaste(input: IWastePredictionInput): Promise<IMLServiceResult<IWastePredictionResult>>;

    /**
     * Select best algorithm for the job characteristics
     */
    selectAlgorithm(input: IAlgorithmSelectionInput): Promise<IMLServiceResult<IAlgorithmSelectionResult>>;

    /**
     * Predict optimization time
     */
    predictTime(input: ITimePredictionInput): Promise<IMLServiceResult<ITimePredictionResult>>;

    /**
     * Record actual outcome after optimization for learning
     */
    recordOutcome(predictionId: string, actualWastePercent: number, actualTimeSeconds: number): Promise<void>;
}

// ==================== NULL IMPLEMENTATION ====================

/**
 * Null implementation for when ML is disabled or unavailable
 * Follows Null Object Pattern - no-op implementation
 */
export class NullMLPredictionClient implements IMLPredictionClient {
    async predictWaste(_input: IWastePredictionInput): Promise<IMLServiceResult<IWastePredictionResult>> {
        return { success: false, error: 'ML predictions disabled' };
    }

    async selectAlgorithm(_input: IAlgorithmSelectionInput): Promise<IMLServiceResult<IAlgorithmSelectionResult>> {
        return { success: false, error: 'ML predictions disabled' };
    }

    async predictTime(_input: ITimePredictionInput): Promise<IMLServiceResult<ITimePredictionResult>> {
        return { success: false, error: 'ML predictions disabled' };
    }

    async recordOutcome(_predictionId: string, _actualWaste: number, _actualTime: number): Promise<void> {
        // No-op
    }
}
