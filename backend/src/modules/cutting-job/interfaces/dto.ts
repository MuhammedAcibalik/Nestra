/**
 * Cutting Job DTOs
 * Data Transfer Objects for API layer
 */

/**
 * Cutting job DTO
 */
export interface ICuttingJobDto {
    id: string;
    code: string;
    materialType?: { id: string; name: string } | null;
    thickness: number;
    status: string;
    itemCount: number;
    scenarioCount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Cutting job item DTO
 */
export interface ICuttingJobItemDto {
    id: string;
    quantity: number;
    orderItem?: {
        id: string;
        itemCode: string | null;
        itemName: string | null;
        length: number | null;
        width: number | null;
        geometryType: string;
    };
}

/**
 * Cutting job with items DTO
 */
export interface ICuttingJobWithItemsDto extends ICuttingJobDto {
    items: ICuttingJobItemDto[];
}

/**
 * Cutting job filter
 */
export interface ICuttingJobFilter {
    status?: string;
    materialTypeId?: string;
    thickness?: number;
}

/**
 * Create cutting job input
 */
export interface ICreateCuttingJobInput {
    materialTypeId: string;
    thickness: number;
    orderItemIds?: string[];
}

/**
 * Update cutting job input
 */
export interface IUpdateCuttingJobInput {
    status?: string;
}

/**
 * Create cutting job item input
 */
export interface ICreateCuttingJobItemInput {
    cuttingJobId: string;
    orderItemId: string;
    quantity: number;
}
