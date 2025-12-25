"use strict";
/**
 * Audit Controller
 * REST API for querying audit logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditRouter = createAuditRouter;
const express_1 = require("express");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('AuditController');
function createAuditRouter(auditService, authMiddleware) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/audit
     * Query audit logs with filters
     */
    router.get('/', authMiddleware, async (req, res) => {
        try {
            const authReq = req;
            const options = {
                tenantId: authReq.user.tenantId,
                entityType: req.query.entityType,
                entityId: req.query.entityId,
                userId: req.query.userId,
                action: req.query.action,
                module: req.query.module,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : 50,
                offset: req.query.offset ? Number.parseInt(req.query.offset, 10) : 0
            };
            const logs = await auditService.getAuditLogs(options);
            res.json({
                success: true,
                data: logs
            });
        }
        catch (error) {
            logger.error('Failed to get audit logs', { error });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve audit logs' }
            });
        }
    });
    /**
     * GET /api/audit/entity/:entityType/:entityId
     * Get history for a specific entity
     */
    router.get('/entity/:entityType/:entityId', authMiddleware, async (req, res) => {
        try {
            const authReq = req;
            const { entityType, entityId } = req.params;
            const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 20;
            const history = await auditService.getEntityHistory(authReq.user.tenantId, entityType, entityId, limit);
            res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            logger.error('Failed to get entity history', { error, params: req.params });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve entity history' }
            });
        }
    });
    return router;
}
//# sourceMappingURL=audit.controller.js.map