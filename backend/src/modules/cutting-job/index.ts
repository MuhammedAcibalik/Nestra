/**
 * Cutting Job Module - Barrel Export
 * Following standard module structure
 */

// ==================== INTERFACES ====================
export type {
    ICuttingJobDto,
    ICuttingJobItemDto,
    ICuttingJobWithItemsDto,
    ICuttingJobFilter,
    ICreateCuttingJobInput,
    IUpdateCuttingJobInput,
    ICreateCuttingJobItemInput
} from './interfaces/dto';

export type {
    CuttingJob,
    CuttingJobItem,
    CuttingJobWithRelations,
    CuttingJobItemWithRelations,
    OrderItemForJob,
    ICuttingJobRepository,
    ICuttingJobService
} from './interfaces/types';

// ==================== REPOSITORY ====================
export { CuttingJobRepository } from './cutting-job.repository';

// ==================== SERVICE ====================
export { CuttingJobService } from './cutting-job.service';

// ==================== CONTROLLER ====================
export { CuttingJobController } from './cutting-job.controller';

// ==================== MAPPER ====================
export { toCuttingJobDto, toCuttingJobItemDto, getErrorMessage } from './cutting-job.mapper';

// ==================== SPECIALIZED SERVICES ====================
export { CuttingJobGeneratorService, ICuttingJobGeneratorService } from './cutting-job-generator.service';
export { CuttingJobOperationsService, ICuttingJobOperationsService } from './cutting-job-operations.service';

// ==================== MICROSERVICE ====================
export { CuttingJobServiceHandler } from './cutting-job.service-handler';
export { CuttingJobEventHandler } from './cutting-job.event-handler';
