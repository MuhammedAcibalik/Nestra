/**
 * Audit Controller
 * REST API for querying audit logs
 */
import { Router, RequestHandler } from 'express';
import { AuditService } from './audit.service';
export declare function createAuditRouter(auditService: AuditService, authMiddleware: RequestHandler): Router;
//# sourceMappingURL=audit.controller.d.ts.map