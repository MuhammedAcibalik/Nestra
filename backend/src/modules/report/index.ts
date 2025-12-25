/**
 * Report Module - Barrel Export
 */

export { ReportRepository, IReportRepository } from './report.repository';
export { ReportService } from './report.service';
export { ReportController, createReportController } from './report.controller';

// Mapper
export * from './report.mapper';

// Specialized Services
export { ReportAnalyticsService, IReportAnalyticsService } from './report-analytics.service';
