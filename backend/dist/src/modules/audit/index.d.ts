/**
 * Audit Module
 * Centralized audit trail for all entity changes
 */
export { AuditRepository, IAuditRepository, IAuditQueryOptions } from './audit.repository';
export { AuditService, IAuditService, IAuditContext, IRecordAuditInput, IAuditDto, recordAudit, setAuditService, setAuditService as initializeAuditService, // Alias for DI container
getAuditService } from './audit.service';
export { createAuditRouter } from './audit.controller';
//# sourceMappingURL=index.d.ts.map