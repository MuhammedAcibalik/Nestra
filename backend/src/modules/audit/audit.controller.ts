/**
 * Audit Controller
 * REST API for querying audit logs
 */

import { Router, Request, Response, RequestHandler } from 'express';
import { AuditService } from './audit.service';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('AuditController');

type AuthenticatedRequest = Request & {
    user: { id: string; tenantId: string; email?: string; role?: string };
};

export function createAuditRouter(auditService: AuditService, authMiddleware: RequestHandler): Router {
    const router = Router();

    /**
     * GET /api/audit
     * Query audit logs with filters
     */
    router.get('/', authMiddleware, async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const options = {
                tenantId: authReq.user.tenantId,
                entityType: req.query.entityType as string | undefined,
                entityId: req.query.entityId as string | undefined,
                userId: req.query.userId as string | undefined,
                action: req.query.action as string | undefined,
                module: req.query.module as string | undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                limit: req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 50,
                offset: req.query.offset ? Number.parseInt(req.query.offset as string, 10) : 0
            };

            const logs = await auditService.getAuditLogs(options);

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
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
    router.get('/entity/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const { entityType, entityId } = req.params;
            const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 20;

            const history = await auditService.getEntityHistory(authReq.user.tenantId, entityType, entityId, limit);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            logger.error('Failed to get entity history', { error, params: req.params });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve entity history' }
            });
        }
    });

    return router;
}
