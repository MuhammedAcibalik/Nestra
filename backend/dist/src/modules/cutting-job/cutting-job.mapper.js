"use strict";
/**
 * CuttingJob Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for DTO transformations only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCuttingJobDto = toCuttingJobDto;
exports.toCuttingJobItemDto = toCuttingJobItemDto;
exports.getErrorMessage = getErrorMessage;
/**
 * Maps CuttingJob entity to DTO
 */
function toCuttingJobDto(job) {
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
function toCuttingJobItemDto(item) {
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
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
//# sourceMappingURL=cutting-job.mapper.js.map