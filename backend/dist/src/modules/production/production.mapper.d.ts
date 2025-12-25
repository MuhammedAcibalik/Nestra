/**
 * Production Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */
import { IProductionLogDto, IDowntimeLogDto, IQualityCheckDto } from '../../core/interfaces';
import { ProductionLogWithRelations, DowntimeLogWithRelations, QualityCheckWithRelations } from './production.repository';
/**
 * Maps ProductionLog entity to DTO
 */
export declare function toProductionLogDto(log: ProductionLogWithRelations): IProductionLogDto;
/**
 * Maps DowntimeLog entity to DTO
 */
export declare function toDowntimeDto(log: DowntimeLogWithRelations): IDowntimeLogDto;
/**
 * Maps QualityCheck entity to DTO
 */
export declare function toQualityCheckDto(qc: QualityCheckWithRelations): IQualityCheckDto;
/**
 * Extracts error message from unknown error type
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=production.mapper.d.ts.map