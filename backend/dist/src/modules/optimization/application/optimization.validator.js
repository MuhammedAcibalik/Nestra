"use strict";
/**
 * Optimization Validator
 * Validates inputs and business rules
 * Following SRP - Only validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationValidator = void 0;
const VALID_1D_ALGORITHMS = ['1D_FFD', '1D_BFD'];
const VALID_2D_ALGORITHMS = ['2D_BOTTOM_LEFT', '2D_GUILLOTINE'];
class OptimizationValidator {
    validateInput(input) {
        const errors = [];
        if (!input.cuttingJobId || input.cuttingJobId.trim() === '') {
            errors.push({
                field: 'cuttingJobId',
                message: 'Cutting job ID is required',
                code: 'REQUIRED'
            });
        }
        if (!input.scenarioId || input.scenarioId.trim() === '') {
            errors.push({
                field: 'scenarioId',
                message: 'Scenario ID is required',
                code: 'REQUIRED'
            });
        }
        // Validate parameters
        const paramResult = this.validateParameters(input.parameters);
        errors.push(...paramResult.errors);
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateParameters(params) {
        const errors = [];
        if (params.algorithm) {
            const allAlgorithms = [...VALID_1D_ALGORITHMS, ...VALID_2D_ALGORITHMS];
            if (!allAlgorithms.includes(params.algorithm)) {
                errors.push({
                    field: 'parameters.algorithm',
                    message: `Invalid algorithm: ${params.algorithm}. Valid options: ${allAlgorithms.join(', ')}`,
                    code: 'INVALID_ALGORITHM'
                });
            }
        }
        if (params.kerf !== undefined) {
            if (params.kerf < 0) {
                errors.push({
                    field: 'parameters.kerf',
                    message: 'Kerf must be non-negative',
                    code: 'INVALID_RANGE'
                });
            }
            if (params.kerf > 20) {
                errors.push({
                    field: 'parameters.kerf',
                    message: 'Kerf exceeds maximum (20mm)',
                    code: 'INVALID_RANGE'
                });
            }
        }
        if (params.minUsableWaste !== undefined && params.minUsableWaste < 0) {
            errors.push({
                field: 'parameters.minUsableWaste',
                message: 'Minimum usable waste must be non-negative',
                code: 'INVALID_RANGE'
            });
        }
        if (params.selectedStockIds) {
            if (!Array.isArray(params.selectedStockIds)) {
                errors.push({
                    field: 'parameters.selectedStockIds',
                    message: 'Selected stock IDs must be an array',
                    code: 'INVALID_TYPE'
                });
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate that algorithm matches geometry type
     */
    validateAlgorithmForGeometry(algorithm, is1D) {
        const errors = [];
        if (!algorithm)
            return { valid: true, errors: [] };
        if (is1D && VALID_2D_ALGORITHMS.includes(algorithm)) {
            errors.push({
                field: 'algorithm',
                message: `Cannot use 2D algorithm (${algorithm}) for 1D job`,
                code: 'ALGORITHM_MISMATCH'
            });
        }
        if (!is1D && VALID_1D_ALGORITHMS.includes(algorithm)) {
            errors.push({
                field: 'algorithm',
                message: `Cannot use 1D algorithm (${algorithm}) for 2D job`,
                code: 'ALGORITHM_MISMATCH'
            });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.OptimizationValidator = OptimizationValidator;
//# sourceMappingURL=optimization.validator.js.map