"use strict";
/**
 * Audit Service
 * Business logic for audit trail with diff calculation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
exports.setAuditService = setAuditService;
exports.getAuditService = getAuditService;
exports.recordAudit = recordAudit;
const logger_1 = require("../../core/logger");
const event_bus_1 = require("../../core/events/event-bus");
const logger = (0, logger_1.createModuleLogger)('AuditService');
// ==================== SERVICE ====================
class AuditService {
    repository;
    eventBus;
    constructor(repository) {
        this.repository = repository;
        this.eventBus = event_bus_1.EventBus.getInstance();
    }
    async record(input) {
        // Calculate changed fields for UPDATE actions
        const changedFields = input.action === 'UPDATE' && input.previousValue && input.newValue
            ? this.calculateChangedFields(input.previousValue, input.newValue)
            : undefined;
        const auditData = {
            tenantId: input.context.tenantId,
            userId: input.context.userId,
            userEmail: input.context.userEmail,
            userRole: input.context.userRole,
            ipAddress: input.context.ipAddress,
            userAgent: input.context.userAgent,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            entityName: input.entityName,
            previousValue: input.previousValue,
            newValue: input.newValue,
            changedFields,
            requestId: input.context.requestId,
            sessionId: input.context.sessionId,
            module: input.module,
            metadata: input.metadata
        };
        const result = await this.repository.create(auditData);
        // Emit event for real-time dashboard
        await this.eventBus.publish({
            eventId: `audit_${result.id}`,
            eventType: 'audit.recorded',
            timestamp: new Date(),
            aggregateType: 'AuditLog',
            aggregateId: result.id,
            payload: {
                tenantId: result.tenantId,
                action: result.action,
                entityType: result.entityType,
                entityId: result.entityId,
                userId: result.userId
            }
        });
        logger.debug('Audit recorded', {
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId
        });
        return this.toDto(result);
    }
    async getAuditLogs(options) {
        const logs = await this.repository.findMany(options);
        return logs.map((log) => this.toDto(log));
    }
    async getEntityHistory(tenantId, entityType, entityId, limit = 20) {
        const logs = await this.repository.getEntityHistory(tenantId, entityType, entityId, limit);
        return logs.map((log) => this.toDto(log));
    }
    extractContext(req) {
        const user = req
            .user;
        if (!user?.id || !user?.tenantId) {
            return null;
        }
        return {
            tenantId: user.tenantId,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestId: req.requestId
        };
    }
    // ==================== HELPERS ====================
    calculateChangedFields(prev, next) {
        const changedFields = [];
        const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const key of allKeys) {
            // Skip internal fields
            if (['updatedAt', 'createdAt', 'id'].includes(key))
                continue;
            const prevValue = JSON.stringify(prev[key]);
            const nextValue = JSON.stringify(next[key]);
            if (prevValue !== nextValue) {
                changedFields.push(key);
            }
        }
        return changedFields;
    }
    toDto(log) {
        const userInfo = log;
        return {
            id: log.id,
            tenantId: log.tenantId,
            userId: log.userId,
            userName: userInfo.user
                ? `${userInfo.user.firstName ?? ''} ${userInfo.user.lastName ?? ''}`.trim()
                : undefined,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            entityName: log.entityName ?? undefined,
            changedFields: log.changedFields ?? undefined,
            previousValue: log.previousValue,
            newValue: log.newValue,
            createdAt: log.createdAt
        };
    }
}
exports.AuditService = AuditService;
// ==================== AUDIT HELPER ====================
/**
 * Global audit service instance for use in decorators
 */
let auditServiceInstance = null;
function setAuditService(service) {
    auditServiceInstance = service;
}
function getAuditService() {
    return auditServiceInstance;
}
/**
 * Quick audit record function for manual usage
 */
async function recordAudit(input) {
    const service = getAuditService();
    if (service) {
        await service.record(input);
    }
    else {
        logger.warn('Audit service not initialized, log not recorded');
    }
}
//# sourceMappingURL=audit.service.js.map