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
    skippedItems: { orderItemId: string; reason: string }[];
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
export function toCuttingJobDto(job: CuttingJobWithRelations): ICuttingJobDto {
    return {
        id: job.id,
        jobNumber: job.jobNumber,
        materialTypeId: job.materialTypeId,
        thickness: job.thickness,
        status: job.status,
        itemCount: job._count?.items ?? 0,
        scenarioCount: job._count?.scenarios ?? 0,
        createdAt: job.createdAt,
        items: job.items?.map(toCuttingJobItemDto)
    };
}

/**
 * Maps CuttingJobItem entity to DTO
 */
export function toCuttingJobItemDto(item: CuttingJobItemWithRelations): ICuttingJobItemDto {
    return {
        id: item.id,
        orderItemId: item.orderItemId,
        itemCode: item.orderItem?.itemCode ?? null,
        itemName: item.orderItem?.itemName ?? null,
        geometryType: item.orderItem?.geometryType ?? '',
        dimensions: {
            length: item.orderItem?.length,
            width: item.orderItem?.width,
            height: item.orderItem?.height
        },
        quantity: item.quantity
    };
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
