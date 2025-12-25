/**
 * Tenant Controller
 * HTTP endpoints for tenant management
 * Following SOLID principles
 */
import { Router } from 'express';
import { ITenantService } from './tenant.service';
export declare class TenantController {
    private readonly tenantService;
    readonly router: Router;
    constructor(tenantService: ITenantService);
    private initializeRoutes;
    private createTenant;
    private getTenant;
    private getTenantBySlug;
    private updateTenant;
    private deactivateTenant;
    private listTenants;
    private validateSlug;
    private addUser;
    private removeUser;
    private getTenantUsers;
    private getMyTenants;
}
//# sourceMappingURL=tenant.controller.d.ts.map