"use strict";
/**
 * Core Database Module
 * Barrel export for database utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantAwareRepository = exports.EnhancedBaseRepository = exports.withRetry = exports.batchTransaction = exports.withTransaction = exports.filterDateRange = exports.filterEq = exports.createFilter = exports.FilterBuilder = void 0;
// Types
__exportStar(require("./types"), exports);
// Query Building
var filter_builder_1 = require("./filter-builder");
Object.defineProperty(exports, "FilterBuilder", { enumerable: true, get: function () { return filter_builder_1.FilterBuilder; } });
Object.defineProperty(exports, "createFilter", { enumerable: true, get: function () { return filter_builder_1.createFilter; } });
Object.defineProperty(exports, "filterEq", { enumerable: true, get: function () { return filter_builder_1.filterEq; } });
Object.defineProperty(exports, "filterDateRange", { enumerable: true, get: function () { return filter_builder_1.filterDateRange; } });
// Transaction Utilities
var transaction_1 = require("./transaction");
Object.defineProperty(exports, "withTransaction", { enumerable: true, get: function () { return transaction_1.withTransaction; } });
Object.defineProperty(exports, "batchTransaction", { enumerable: true, get: function () { return transaction_1.batchTransaction; } });
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return transaction_1.withRetry; } });
// Base Repository
var base_repository_1 = require("./base.repository");
Object.defineProperty(exports, "EnhancedBaseRepository", { enumerable: true, get: function () { return base_repository_1.EnhancedBaseRepository; } });
// Tenant-Aware Repository
var tenant_repository_1 = require("./tenant.repository");
Object.defineProperty(exports, "TenantAwareRepository", { enumerable: true, get: function () { return tenant_repository_1.TenantAwareRepository; } });
//# sourceMappingURL=index.js.map