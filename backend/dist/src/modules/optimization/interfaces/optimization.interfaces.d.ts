/**
 * Optimization Interfaces
 * Core interfaces for the optimization domain
 * Following ISP - Interface Segregation Principle
 */
export interface IOptimizationInput {
    cuttingJobId: string;
    scenarioId: string;
    parameters: IOptimizationParameters;
}
export interface IOptimizationParameters {
    algorithm?: OptimizationAlgorithmType;
    kerf?: number;
    minUsableWaste?: number;
    allowRotation?: boolean;
    useWarehouseStock?: boolean;
    selectedStockIds?: string[];
}
export type OptimizationAlgorithmType = '1D_FFD' | '1D_BFD' | '2D_BOTTOM_LEFT' | '2D_GUILLOTINE';
export interface IOptimizationOutput {
    success: boolean;
    planData?: IPlanData;
    error?: string;
    metrics?: IOptimizationMetrics;
}
export interface IPlanData {
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    efficiency: number;
    layouts: ILayoutData[];
    unplacedCount: number;
}
export interface ILayoutData {
    stockItemId: string;
    sequence: number;
    waste: number;
    wastePercentage: number;
    layoutJson: string;
}
export interface IOptimizationMetrics {
    executionTimeMs: number;
    piecesProcessed: number;
    stockEvaluated: number;
}
export interface IOptimizationEvent {
    scenarioId: string;
    timestamp: Date;
}
export interface IOptimizationStartedEvent extends IOptimizationEvent {
    cuttingJobId: string;
    algorithm: OptimizationAlgorithmType;
}
export interface IOptimizationProgressEvent extends IOptimizationEvent {
    progress: number;
    message: string;
}
export interface IOptimizationCompletedEvent extends IOptimizationEvent {
    planId: string;
    success: boolean;
    metrics: IOptimizationMetrics;
}
export interface IOptimizationFailedEvent extends IOptimizationEvent {
    error: string;
    code: string;
}
export interface IOptimizationEngine {
    execute(input: IOptimizationInput): Promise<IOptimizationOutput>;
}
export interface IOptimizationValidator {
    validateInput(input: IOptimizationInput): IValidationResult;
    validateParameters(params: IOptimizationParameters): IValidationResult;
}
export interface IValidationResult {
    valid: boolean;
    errors: IValidationError[];
}
export interface IValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ICuttingJobData {
    id: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    geometryType: 'LINEAR_1D' | 'RECTANGULAR_2D';
    items: ICuttingJobItemData[];
}
export interface ICuttingJobItemData {
    id: string;
    orderItemId?: string;
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
    label?: string;
}
export interface IStockItemData {
    id: string;
    code: string;
    stockType: 'BAR_1D' | 'SHEET_2D';
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
    unitPrice?: number;
}
//# sourceMappingURL=optimization.interfaces.d.ts.map