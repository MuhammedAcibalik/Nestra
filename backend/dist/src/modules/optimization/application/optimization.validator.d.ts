/**
 * Optimization Validator
 * Validates inputs and business rules
 * Following SRP - Only validation
 */
import { IOptimizationValidator, IValidationResult, IOptimizationInput, IOptimizationParameters, OptimizationAlgorithmType } from '../interfaces';
export declare class OptimizationValidator implements IOptimizationValidator {
    validateInput(input: IOptimizationInput): IValidationResult;
    validateParameters(params: IOptimizationParameters): IValidationResult;
    /**
     * Validate that algorithm matches geometry type
     */
    validateAlgorithmForGeometry(algorithm: OptimizationAlgorithmType | undefined, is1D: boolean): IValidationResult;
}
//# sourceMappingURL=optimization.validator.d.ts.map