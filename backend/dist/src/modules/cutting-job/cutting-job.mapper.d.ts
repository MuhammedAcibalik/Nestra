/**
 * CuttingJob Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */
import { CuttingJobWithRelations, CuttingJobItemWithRelations } from './cutting-job.repository';
/**
 * Cutting Job DTO
 */
export interface ICuttingJobDto {
    id: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    status: string;
    itemCount: number;
    scenarioCount: number;
    createdAt: Date;
    items?: ICuttingJobItemDto[];
}
/**
 * Cutting Job Item DTO
 */
export interface ICuttingJobItemDto {
    id: string;
    orderItemId: string;
    itemCode: string | null;
    itemName: string | null;
    geometryType: string;
    dimensions: {
        length?: number | null;
        width?: number | null;
        height?: number | null;
    };
    quantity: number;
}
/**
 * Auto-generate result
 */
export interface IAutoGenerateResult {
    createdJobs: ICuttingJobDto[];
    skippedItems: {
        orderItemId: string;
        reason: string;
    }[];
}
/**
 * Input for job split operation
 */
export interface ISplitJobInput {
    itemId: string;
    quantity: number;
}
/**
 * Maps CuttingJob entity to DTO
 */
export declare function toCuttingJobDto(job: CuttingJobWithRelations): ICuttingJobDto;
/**
 * Maps CuttingJobItem entity to DTO
 */
export declare function toCuttingJobItemDto(item: CuttingJobItemWithRelations): ICuttingJobItemDto;
/**
 * Extracts error message from unknown error type
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=cutting-job.mapper.d.ts.map