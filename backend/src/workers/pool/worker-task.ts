/**
 * Worker Task Interfaces
 * Type definitions for worker communication
 * Following ISP - Separate interfaces for different task types
 */

import {
    CuttingPiece1D,
    StockBar1D,
    Optimization1DOptions,
    Optimization1DResult
} from '../../algorithms/1d/cutting1d';
import {
    CuttingPiece2D,
    StockSheet2D,
    Optimization2DOptions,
    Optimization2DResult
} from '../../algorithms/2d/cutting2d';

// ==================== BASE INTERFACES ====================

export interface IWorkerTask<TPayload = unknown> {
    id: string;
    type: WorkerTaskType;
    payload: TPayload;
    timestamp: number;
}

export interface IWorkerResult<TResult = unknown> {
    id: string;
    success: boolean;
    result?: TResult;
    error?: string;
    executionTime: number;
}

export type WorkerTaskType =
    | 'OPTIMIZATION_1D'
    | 'OPTIMIZATION_2D';

// ==================== OPTIMIZATION TASK PAYLOADS ====================

export interface IOptimization1DPayload {
    pieces: CuttingPiece1D[];
    stockBars: StockBar1D[];
    options: Optimization1DOptions;
}

export interface IOptimization2DPayload {
    pieces: CuttingPiece2D[];
    stockSheets: StockSheet2D[];
    options: Optimization2DOptions;
}

export type OptimizationPayload = IOptimization1DPayload | IOptimization2DPayload;

// ==================== TYPE GUARDS ====================

export function is1DPayload(payload: OptimizationPayload): payload is IOptimization1DPayload {
    return 'stockBars' in payload;
}

export function is2DPayload(payload: OptimizationPayload): payload is IOptimization2DPayload {
    return 'stockSheets' in payload;
}

// ==================== TASK RESULT TYPES ====================

export type Optimization1DTaskResult = IWorkerResult<Optimization1DResult>;
export type Optimization2DTaskResult = IWorkerResult<Optimization2DResult>;

// ==================== HELPER FUNCTIONS ====================

export function createTask<T>(type: WorkerTaskType, payload: T): IWorkerTask<T> {
    return {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type,
        payload,
        timestamp: Date.now()
    };
}

export function createResult<T>(taskId: string, success: boolean, result?: T, error?: string, startTime?: number): IWorkerResult<T> {
    return {
        id: taskId,
        success,
        result,
        error,
        executionTime: startTime ? Date.now() - startTime : 0
    };
}
