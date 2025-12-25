"use strict";
/**
 * Audit Module
 * Centralized audit trail for all entity changes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditRouter = exports.getAuditService = exports.initializeAuditService = exports.setAuditService = exports.recordAudit = exports.AuditService = exports.AuditRepository = void 0;
var audit_repository_1 = require("./audit.repository");
Object.defineProperty(exports, "AuditRepository", { enumerable: true, get: function () { return audit_repository_1.AuditRepository; } });
var audit_service_1 = require("./audit.service");
Object.defineProperty(exports, "AuditService", { enumerable: true, get: function () { return audit_service_1.AuditService; } });
Object.defineProperty(exports, "recordAudit", { enumerable: true, get: function () { return audit_service_1.recordAudit; } });
Object.defineProperty(exports, "setAuditService", { enumerable: true, get: function () { return audit_service_1.setAuditService; } });
Object.defineProperty(exports, "initializeAuditService", { enumerable: true, get: function () { return audit_service_1.setAuditService; } });
Object.defineProperty(exports, "getAuditService", { enumerable: true, get: function () { return audit_service_1.getAuditService; } });
var audit_controller_1 = require("./audit.controller");
Object.defineProperty(exports, "createAuditRouter", { enumerable: true, get: function () { return audit_controller_1.createAuditRouter; } });
//# sourceMappingURL=index.js.map