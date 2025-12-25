/**
 * Tenant Service
 * Business logic for tenant management
 * Following Single Responsibility Principle (SRP)
 */
import { ITenantRepository, ITenantQueryOptions } from './tenant.repository';
import { TenantUser } from '../../db/schema';
import { ITenantInfo, TenantPlan } from '../../core/tenant';
import { IResult } from '../../core/interfaces';
export interface ITenantService {
    createTenant(data: ICreateTenantInput): Promise<IResult<ITenantInfo>>;
    getTenant(id: string): Promise<IResult<ITenantInfo>>;
    getTenantBySlug(slug: string): Promise<IResult<ITenantInfo>>;
    updateTenant(id: string, data: IUpdateTenantInput): Promise<IResult<ITenantInfo>>;
    deactivateTenant(id: string): Promise<IResult<void>>;
    listTenants(options?: ITenantQueryOptions): Promise<IResult<ITenantInfo[]>>;
    addUser(tenantId: string, userId: string, isOwner?: boolean): Promise<IResult<void>>;
    removeUser(tenantId: string, userId: string): Promise<IResult<void>>;
    getUserTenants(userId: string): Promise<IResult<ITenantUserInfo[]>>;
    getTenantUsers(tenantId: string): Promise<IResult<TenantUser[]>>;
    validateSlug(slug: string): Promise<IResult<boolean>>;
    checkLimit(tenantId: string, limitType: LimitType): Promise<IResult<ILimitCheckResult>>;
}
export interface ICreateTenantInput {
    readonly name: string;
    readonly slug: string;
    readonly plan?: TenantPlan;
    readonly contactEmail?: string;
    readonly contactPhone?: string;
    readonly address?: string;
    readonly settings?: Record<string, unknown>;
}
export interface IUpdateTenantInput {
    readonly name?: string;
    readonly plan?: TenantPlan;
    readonly contactEmail?: string;
    readonly contactPhone?: string;
    readonly address?: string;
    readonly settings?: Record<string, unknown>;
    readonly maxUsers?: number;
    readonly maxLocations?: number;
    readonly maxMachines?: number;
}
export interface ITenantUserInfo {
    readonly tenantId: string;
    readonly tenantName: string;
    readonly tenantSlug: string;
    readonly plan: TenantPlan;
    readonly isOwner: boolean;
    readonly joinedAt: Date;
}
export type LimitType = 'users' | 'locations' | 'machines' | 'optimizations';
export interface ILimitCheckResult {
    readonly allowed: boolean;
    readonly current: number;
    readonly max: number;
    readonly remaining: number;
}
export declare class TenantService implements ITenantService {
    private readonly repository;
    constructor(repository: ITenantRepository);
    createTenant(data: ICreateTenantInput): Promise<IResult<ITenantInfo>>;
    getTenant(id: string): Promise<IResult<ITenantInfo>>;
    getTenantBySlug(slug: string): Promise<IResult<ITenantInfo>>;
    updateTenant(id: string, data: IUpdateTenantInput): Promise<IResult<ITenantInfo>>;
    deactivateTenant(id: string): Promise<IResult<void>>;
    listTenants(options?: ITenantQueryOptions): Promise<IResult<ITenantInfo[]>>;
    addUser(tenantId: string, userId: string, isOwner?: boolean): Promise<IResult<void>>;
    removeUser(tenantId: string, userId: string): Promise<IResult<void>>;
    getUserTenants(userId: string): Promise<IResult<ITenantUserInfo[]>>;
    getTenantUsers(tenantId: string): Promise<IResult<TenantUser[]>>;
    validateSlug(slug: string): Promise<IResult<boolean>>;
    checkLimit(tenantId: string, limitType: LimitType): Promise<IResult<ILimitCheckResult>>;
    private isValidSlug;
    private toTenantInfo;
    private getDefaultMaxUsers;
    private getDefaultMaxLocations;
    private getDefaultMaxMachines;
}
//# sourceMappingURL=tenant.service.d.ts.map