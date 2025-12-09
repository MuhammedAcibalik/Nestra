"use strict";
/**
 * Result Pattern Interfaces
 * For consistent error handling across services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.failure = failure;
function success(data) {
    return { success: true, data };
}
function failure(error) {
    return { success: false, error };
}
//# sourceMappingURL=result.interface.js.map