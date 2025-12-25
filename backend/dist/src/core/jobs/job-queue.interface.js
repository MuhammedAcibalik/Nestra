"use strict";
/**
 * Job Queue Interface
 * Following Interface Segregation Principle (ISP)
 * Abstracts job queue implementation for easy swapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobType = void 0;
/**
 * Job Types for Nestra
 */
exports.JobType = {
    OPTIMIZATION_RUN: 'optimization:run',
    OPTIMIZATION_BATCH: 'optimization:batch',
    REPORT_GENERATE: 'report:generate',
    EXPORT_PDF: 'export:pdf',
    EXPORT_EXCEL: 'export:excel',
    IMPORT_ORDERS: 'import:orders',
    IMPORT_STOCK: 'import:stock',
    NOTIFICATION_SEND: 'notification:send',
    CLEANUP_OLD_DATA: 'cleanup:old-data'
};
//# sourceMappingURL=job-queue.interface.js.map