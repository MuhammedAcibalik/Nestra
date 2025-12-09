/**
 * Material Controller
 * Following Single Responsibility Principle (SRP): Only handles HTTP concerns
 * Controller Layer - Thin controller, delegates to service
 */
import { Router } from 'express';
import { IMaterialService } from '../../core/interfaces';
export declare class MaterialController {
    private readonly materialService;
    router: Router;
    constructor(materialService: IMaterialService);
    private initializeRoutes;
    private getAll;
    private getById;
    private create;
    private update;
    private delete;
    private addThickness;
}
/**
 * Factory function to create material controller with dependencies
 */
export declare function createMaterialController(materialService: IMaterialService): MaterialController;
//# sourceMappingURL=material.controller.d.ts.map