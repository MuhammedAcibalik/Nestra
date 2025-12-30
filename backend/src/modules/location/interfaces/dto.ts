/**
 * Location DTOs
 * Data Transfer Objects for API layer
 */

/**
 * Location DTO - Used for API responses
 */
export interface ILocationDto {
    id: string;
    name: string;
    description?: string;
    address?: string;
    stockItemCount: number;
    machineCount: number;
    createdAt: Date;
}

/**
 * Create location input
 */
export interface ICreateLocationInput {
    name: string;
    description?: string;
    address?: string;
}

/**
 * Update location input
 */
export interface IUpdateLocationInput {
    name?: string;
    description?: string;
    address?: string;
}

/**
 * Location filter for queries
 */
export interface ILocationFilter {
    search?: string;
}
