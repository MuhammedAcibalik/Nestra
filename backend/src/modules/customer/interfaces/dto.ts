/**
 * Customer DTOs
 * Data Transfer Objects for API layer
 */

/**
 * Customer DTO - Used for API responses
 */
export interface ICustomerDto {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    orderCount: number;
    createdAt: Date;
}

/**
 * Create customer input
 */
export interface ICreateCustomerInput {
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
}

/**
 * Update customer input
 */
export interface IUpdateCustomerInput {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
}

/**
 * Customer filter for queries
 */
export interface ICustomerFilter {
    search?: string;
}
