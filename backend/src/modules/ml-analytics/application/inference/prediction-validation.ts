/**
 * Prediction Input Validation
 * Zod schemas for validating ML prediction inputs before inference
 * 
 * Following U-AIER: Input validation at boundaries
 */

import { z } from 'zod';

// ==================== WASTE PREDICTION ====================

export const WastePredictionInputSchema = z.object({
    totalPieceCount: z.number()
        .min(1, 'At least 1 piece required')
        .max(100000, 'Piece count exceeds maximum'),
    uniquePieceCount: z.number()
        .min(1, 'At least 1 unique piece required'),
    avgPieceArea: z.number()
        .positive('Average piece area must be positive'),
    pieceAreaStdDev: z.number()
        .min(0, 'Standard deviation cannot be negative'),
    minPieceArea: z.number()
        .positive('Minimum piece area must be positive'),
    maxPieceArea: z.number()
        .positive('Maximum piece area must be positive'),
    pieceAspectRatioMean: z.number()
        .min(0.01, 'Aspect ratio too small')
        .max(100, 'Aspect ratio too large'),
    pieceAspectRatioStdDev: z.number()
        .min(0, 'Standard deviation cannot be negative'),
    totalStockArea: z.number()
        .positive('Total stock area must be positive'),
    stockSheetCount: z.number()
        .min(1, 'At least 1 stock sheet required'),
    avgStockArea: z.number()
        .positive('Average stock area must be positive'),
    stockAspectRatio: z.number()
        .min(0.1, 'Stock aspect ratio too small')
        .max(10, 'Stock aspect ratio too large'),
    totalDemandToStockRatio: z.number()
        .min(0, 'Demand ratio cannot be negative')
        .max(10, 'Demand exceeds reasonable bounds'),
    pieceToStockSizeRatio: z.number()
        .min(0, 'Size ratio cannot be negative')
        .max(1, 'Piece cannot be larger than stock'),
    kerf: z.number()
        .min(0, 'Kerf cannot be negative')
        .max(20, 'Kerf exceeds reasonable bounds'),
    allowRotation: z.number()
        .min(0)
        .max(1),
    materialTypeIndex: z.number()
        .int('Material type must be integer')
        .min(0, 'Invalid material type'),
    historicalAvgWaste: z.number()
        .min(0, 'Waste cannot be negative')
        .max(100, 'Waste cannot exceed 100%'),
    lastJobWaste: z.number()
        .min(0, 'Waste cannot be negative')
        .max(100, 'Waste cannot exceed 100%')
}).refine(data => data.minPieceArea <= data.maxPieceArea, {
    message: 'Minimum piece area must be less than or equal to maximum',
    path: ['minPieceArea']
}).refine(data => data.avgPieceArea >= data.minPieceArea && data.avgPieceArea <= data.maxPieceArea, {
    message: 'Average piece area must be between min and max',
    path: ['avgPieceArea']
});

// ==================== ALGORITHM SELECTION ====================

export const AlgorithmSelectionInputSchema = z.object({
    is1D: z.boolean(),
    totalPieceCount: z.number()
        .min(1, 'At least 1 piece required'),
    uniquePieceCount: z.number()
        .min(1, 'At least 1 unique piece required'),
    pieceAreaVariance: z.number()
        .min(0, 'Variance cannot be negative'),
    pieceAspectRatioMean: z.number()
        .min(0.01, 'Aspect ratio too small')
        .max(100, 'Aspect ratio too large'),
    stockCount: z.number()
        .min(1, 'At least 1 stock item required'),
    algorithmPerformance: z.object({
        BOTTOM_LEFT: z.number().optional(),
        GUILLOTINE: z.number().optional(),
        FFD: z.number().optional(),
        BFD: z.number().optional()
    }).optional()
});

// ==================== TIME PREDICTION ====================

export const TimePredictionInputSchema = z.object({
    is1D: z.boolean(),
    algorithm: z.string()
        .min(1, 'Algorithm name required'),
    pieceCount: z.number()
        .min(1, 'At least 1 piece required'),
    stockCount: z.number()
        .min(1, 'At least 1 stock item required'),
    historicalAvgTime: z.number()
        .min(0, 'Historical time cannot be negative')
        .optional()
});

// ==================== FEATURE VECTOR ====================

export const FeatureVectorSchema = z.array(z.number().finite('Feature value must be finite'))
    .min(1, 'Feature vector cannot be empty')
    .max(100, 'Feature vector too large');

// ==================== VALIDATION FUNCTIONS ====================

export interface IValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: Array<{
        path: string;
        message: string;
    }>;
}

function mapZodErrors(error: z.ZodError): Array<{ path: string; message: string }> {
    return error.issues.map(issue => ({
        path: issue.path.map(p => String(p)).join('.'),
        message: issue.message
    }));
}

export function validateWastePredictionInput(input: unknown): IValidationResult<z.infer<typeof WastePredictionInputSchema>> {
    const result = WastePredictionInputSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: mapZodErrors(result.error)
    };
}

export function validateAlgorithmSelectionInput(input: unknown): IValidationResult<z.infer<typeof AlgorithmSelectionInputSchema>> {
    const result = AlgorithmSelectionInputSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: mapZodErrors(result.error)
    };
}

export function validateTimePredictionInput(input: unknown): IValidationResult<z.infer<typeof TimePredictionInputSchema>> {
    const result = TimePredictionInputSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: mapZodErrors(result.error)
    };
}

export function validateFeatureVector(input: unknown): IValidationResult<number[]> {
    const result = FeatureVectorSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: mapZodErrors(result.error)
    };
}

// ==================== SANITIZATION ====================

/**
 * Sanitize and clamp numeric values to valid ranges
 */
export function sanitizeWastePredictionInput(input: Record<string, unknown>): Record<string, unknown> {
    return {
        ...input,
        // Ensure non-negative values
        pieceAreaStdDev: Math.max(0, Number(input.pieceAreaStdDev) || 0),
        pieceAspectRatioStdDev: Math.max(0, Number(input.pieceAspectRatioStdDev) || 0),
        // Clamp to valid ranges
        historicalAvgWaste: Math.max(0, Math.min(100, Number(input.historicalAvgWaste) || 10)),
        lastJobWaste: Math.max(0, Math.min(100, Number(input.lastJobWaste) || 10)),
        kerf: Math.max(0, Math.min(20, Number(input.kerf) || 3)),
        allowRotation: Number(input.allowRotation) ? 1 : 0
    };
}
